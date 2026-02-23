using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using TodoApi;

var builder = WebApplication.CreateBuilder(args);

// --- 1. שירותים (Services) ---

// הגדרת CORS - מאשר רק לקליינט שלך לגשת
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy => policy.WithOrigins("https://todo-listclient.onrender.com")
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// חיבור למסד הנתונים עם הגנת קריסה (Retry)
var connectionString = builder.Configuration.GetConnectionString("ToDoDB");
builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
        mySqlOptions => mySqlOptions.EnableRetryOnFailure()));

var keyString = "ThisIsAStrongSecretKey12345678901234567890!";
var key = Encoding.ASCII.GetBytes(keyString);

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

// --- 2. בניית האפליקציה (Build) ---
var app = builder.Build();

// --- 3. הגדרות הרצה (Middleware) ---

// פתיחת Swagger תמיד (גם ב-Production) כדי שנוכל לבדוק ב-Render
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Todo API V1");
    c.RoutePrefix = string.Empty; // הופך את הסווגר לדף הבית של השרת
});

app.UseCors("AllowSpecificOrigin");

app.UseAuthentication();
app.UseAuthorization();

// --- 4. נתיבים (Routes) ---

app.MapPost("/register", async (ToDoDbContext db, User user) => {
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "User created" });
});

app.MapPost("/login", (ToDoDbContext db, User loginData) => {
    var user = db.Users.FirstOrDefault(u => u.Username == loginData.Username && u.Password == loginData.Password);
    if (user == null) return Results.Unauthorized();

    var tokenHandler = new JwtSecurityTokenHandler();
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[] { 
            new Claim(ClaimTypes.Name, user.Username ?? ""),
            new Claim("id", user.Id.ToString()) 
        }),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new { token = tokenHandler.WriteToken(token) });
});

app.MapGet("/items", async (ToDoDbContext db, ClaimsPrincipal user) => 
{
    var idClaim = user.FindFirst("id")?.Value;
    if (idClaim == null) return Results.Unauthorized();
    int userId = int.Parse(idClaim);
    return Results.Ok(await db.Items.Where(i => i.UserId == userId).ToListAsync());
}).RequireAuthorization();

app.MapPost("/items", async (ToDoDbContext db, Item item, ClaimsPrincipal user) => {
    var idClaim = user.FindFirst("id")?.Value;
    if (idClaim == null) return Results.Unauthorized();
    item.UserId = int.Parse(idClaim);
    db.Items.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/items/{item.Id}", item);
}).RequireAuthorization();

app.MapPut("/items/{id}", async (ToDoDbContext db, int id, Item inputItem, ClaimsPrincipal user) =>
{
    var idClaim = user.FindFirst("id")?.Value;
    if (idClaim == null) return Results.Unauthorized();
    int userId = int.Parse(idClaim);

    var item = await db.Items.FindAsync(id);
    if (item == null) return Results.NotFound();
    if (item.UserId != userId) return Results.Forbid();

    item.Name = inputItem.Name ?? item.Name;
    item.IsComplete = inputItem.IsComplete;

    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/items/{id}", async (ToDoDbContext db, int id, ClaimsPrincipal user) => {
    var idClaim = user.FindFirst("id")?.Value;
    if (idClaim == null) return Results.Unauthorized();
    int userId = int.Parse(idClaim);

    var item = await db.Items.FindAsync(id);
    if (item == null) return Results.NotFound();
    if (item.UserId != userId) return Results.Forbid();

    db.Items.Remove(item);
    await db.SaveChangesAsync();
    return Results.Ok(item);
}).RequireAuthorization();

app.Run();