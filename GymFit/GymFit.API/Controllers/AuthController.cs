using GymFit.API.Data;
using GymFit.API.DTOs;
using GymFit.API.Models;
using GymFit.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymFit.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;

    public AuthController(AppDbContext db, ITokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new MessageResponse("A user with this email already exists."));

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Role = UserRole.User,
        };

        // membership starts inactive - admin needs to activate it
        user.Membership = new Membership
        {
            User = user,
            IsActive = false,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokens.GenerateToken(user);
        return CreatedAtAction(nameof(Register),
            new AuthResponse(token, user.Id, user.Email, user.FullName, user.Role));
    }

    // POST /api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new MessageResponse("Invalid email or password."));

        var token = _tokens.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Id, user.Email, user.FullName, user.Role));
    }
}
