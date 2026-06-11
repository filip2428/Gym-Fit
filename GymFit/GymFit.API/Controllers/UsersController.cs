using GymFit.API.Data;
using GymFit.API.DTOs;
using GymFit.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymFit.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = UserRole.Admin)]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    // admin - list all users, optionally filter by role (?role=user, ?role=trainer, etc.)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MemberListItem>>> GetAll([FromQuery] string? role)
    {
        var now = DateTime.UtcNow;

        var query = _db.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(u => u.Role == role);

        var users = await query
            .OrderBy(u => u.FullName)
            .Select(u => new MemberListItem(
                u.Id,
                u.FullName,
                u.Email,
                u.Role,
                u.Membership != null && u.Membership.IsActive,
                u.Membership != null ? u.Membership.ActivatedAt : null,
                u.Membership != null ? u.Membership.ExpiresAt : null,
                u.Membership != null && u.Membership.ExpiresAt != null && u.Membership.ExpiresAt < now))
            .ToListAsync();

        return Ok(users);
    }
}
