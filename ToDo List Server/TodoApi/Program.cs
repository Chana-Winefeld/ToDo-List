using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using TodoApi;

var builder = WebApplication.CreateBuilder(args);

// הגדרת CORS - מאפשר לכל דומיין לגשת ל-API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<ToDoDbContext>();

// הגדרת מפתח סודי - חשוב שיהיה לפחות 32 תווים! השרת חותם את הטוקנים לוודא שהם לא זוייפו
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

// Routes Mapping
// הרשמה של משתמש חדש
app.MapPost("/register", async (ToDoDbContext db, User user) => {
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "המשתמש נוצר בהצלחה!" });
});

// התחברות וקבלת Token
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
        Expires = DateTime.UtcNow.AddDays(7), // הטוקן בתוקף לשבוע
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new { token = tokenHandler.WriteToken(token) });
});

app.MapGet("/items", async (ToDoDbContext db) => await db.Items.ToListAsync()).RequireAuthorization();

app.MapPost("/items", async (ToDoDbContext db, Item item) => {
    db.Items.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/items/{item.Id}", item);
}).RequireAuthorization();

app.MapPut("/items/{id}", async (ToDoDbContext db, int id, Item inputItem) =>
{
    var item = await db.Items.FindAsync(id);
    if (item is null) return Results.NotFound();

    // עדכון השם רק אם הוא לא ריק בבקשה שנשלחה
    if (!string.IsNullOrEmpty(inputItem.Name))
    {
        item.Name = inputItem.Name;
    }
    
    item.IsComplete = inputItem.IsComplete;

    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/items/{id}", async (ToDoDbContext db, int id) => {
    if (await db.Items.FindAsync(id) is Item item) {
        db.Items.Remove(item);
        await db.SaveChangesAsync();
        return Results.Ok(item);
    }
    return Results.NotFound();
}).RequireAuthorization();

app.Run();