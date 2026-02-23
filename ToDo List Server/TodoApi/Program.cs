using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using TodoApi;

var builder = WebApplication.CreateBuilder(args);

// הגדרת CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<ToDoDbContext>();

// מפתח סודי (חייב להתאים למה שכתוב ב-Login)
var key = Encoding.ASCII.GetBytes("ThisIsAStrongSecretKey12345678901234567890!");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// --- נתיבים (Routes) ---

// הרשמה
app.MapPost("/register", async (ToDoDbContext db, User user) => {
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "המשתמש נוצר בהצלחה!" });
});

// התחברות
app.MapPost("/login", (ToDoDbContext db, User loginData) => {
    var user = db.Users.FirstOrDefault(u => u.Username == loginData.Username && u.Password == loginData.Password);
    
    if (user == null) return Results.Unauthorized();

    var tokenHandler = new JwtSecurityTokenHandler();
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[] { 
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("id", user.Id.ToString()) 
        }),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new { token = tokenHandler.WriteToken(token) });
});

// שליפת משימות - סינון לפי משתמש מחובר
app.MapGet("/items", async (ToDoDbContext db, ClaimsPrincipal user) => 
{
    var userIdClaim = user.FindFirst("id")?.Value;
    if (userIdClaim == null) return Results.Unauthorized();
    
    var userId = int.Parse(userIdClaim);
    return await db.Items.Where(i => i.UserId == userId).ToListAsync();
}).RequireAuthorization();

// הוספת משימה - שיוך אוטומטי למשתמש
app.MapPost("/items", async (ToDoDbContext db, Item item, ClaimsPrincipal user) => {
    // השורה שחסרה לך:
    item.UserId = int.Parse(user.FindFirst("id")?.Value ?? "0");

    db.Items.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/items/{item.Id}", item);
}).RequireAuthorization();

// עדכון משימה
app.MapPut("/items/{id}", async (ToDoDbContext db, int id, Item inputItem, ClaimsPrincipal user) =>
{
    var userId = int.Parse(user.FindFirst("id")?.Value);
    var item = await db.Items.FindAsync(id);

    if (item is null) return Results.NotFound();
    if (item.UserId != userId) return Results.Forbid(); // בדיקת בעלות

    if (!string.IsNullOrEmpty(inputItem.Name)) item.Name = inputItem.Name;
    item.IsComplete = inputItem.IsComplete;

    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// מחיקת משימה
app.MapDelete("/items/{id}", async (ToDoDbContext db, int id, ClaimsPrincipal user) => {
    var userId = int.Parse(user.FindFirst("id")?.Value);
    var item = await db.Items.FindAsync(id);

    if (item is null) return Results.NotFound();
    if (item.UserId != userId) return Results.Forbid();

    db.Items.Remove(item);
    await db.SaveChangesAsync();
    return Results.Ok(item);
}).RequireAuthorization();

app.Run();