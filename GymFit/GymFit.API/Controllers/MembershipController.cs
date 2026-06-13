using GymFit.API.Data;
using GymFit.API.DTOs;
using GymFit.API.Models;
using GymFit.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymFit.API.Controllers;

[ApiController]
[Route("api/membership")]
[Authorize]
public class MembershipController : ControllerBase
{
    private readonly AppDbContext _db;

    public MembershipController(AppDbContext db)
    {
        _db = db;
    }

    // admin - activate a user's membership for n days
    [HttpPost("activate")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult<MembershipStatusResponse>> Activate(ActivateMembershipRequest request)
    {
        var membership = await _db.Memberships.FirstOrDefaultAsync(m => m.UserId == request.UserId);
        if (membership is null)
        {
            // user might not have a membership row yet if they signed up manually
            if (!await _db.Users.AnyAsync(u => u.Id == request.UserId))
                return NotFound(new MessageResponse("User not found."));

            membership = new Membership { UserId = request.UserId };
            _db.Memberships.Add(membership);
        }

        var now = DateTime.UtcNow;
        membership.IsActive = true;
        membership.ActivatedAt = now;
        membership.ExpiresAt = now.AddDays(request.DurationDays);

        await _db.SaveChangesAsync();

        return Ok(ToStatus(membership));
    }

    // GET /api/membership/status - returns own membership info
    [HttpGet("status")]
    public async Task<ActionResult<MembershipStatusResponse>> Status()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var membership = await _db.Memberships.FirstOrDefaultAsync(m => m.UserId == userId);
        if (membership is null)
            return Ok(new MembershipStatusResponse(false, null, null, false));

        return Ok(ToStatus(membership));
    }

    // admin - deactivate
    [HttpPatch("deactivate")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult<MembershipStatusResponse>> Deactivate(DeactivateMembershipRequest request)
    {
        var membership = await _db.Memberships.FirstOrDefaultAsync(m => m.UserId == request.UserId);
        if (membership is null)
            return NotFound(new MessageResponse("Membership not found for this user."));

        membership.IsActive = false;
        await _db.SaveChangesAsync();

        return Ok(ToStatus(membership));
    }

    private static MembershipStatusResponse ToStatus(Membership m)
    {
        var isExpired = m.ExpiresAt.HasValue && m.ExpiresAt.Value < DateTime.UtcNow;
        return new MembershipStatusResponse(m.IsActive, m.ActivatedAt, m.ExpiresAt, isExpired);
    }
}
