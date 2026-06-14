using GymFit.API.Data;
using GymFit.API.DTOs;
using GymFit.API.Models;
using GymFit.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QRCoder;

namespace GymFit.API.Controllers;

[ApiController]
[Route("api/qr")]
[Authorize]
public class QRController : ControllerBase
{
    private readonly AppDbContext _db;

    public QRController(AppDbContext db)
    {
        _db = db;
    }

    // returns a base64 PNG qr code with the user's id encoded in it
    [HttpGet("generate")]
    public ActionResult<QrCodeResponse> Generate()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(userId.Value.ToString(), QRCodeGenerator.ECCLevel.Q);
        var pngQr = new PngByteQRCode(data);
        byte[] pngBytes = pngQr.GetGraphic(20);

        var base64 = $"data:image/png;base64,{Convert.ToBase64String(pngBytes)}";
        return Ok(new QrCodeResponse(userId.Value, base64));
    }

    // admin - scan a qr code (userId) and get back the membership status
    [HttpGet("validate/{userId:guid}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult<QrValidationResponse>> Validate(Guid userId)
    {
        var data = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.FullName,
                u.Email,
                Membership = u.Membership,
            })
            .FirstOrDefaultAsync();

        if (data is null) return NotFound(new MessageResponse("User not found."));

        var m = data.Membership;
        var isActive = m?.IsActive ?? false;
        var activatedAt = m?.ActivatedAt;
        var expiresAt = m?.ExpiresAt;
        var isExpired = expiresAt.HasValue && expiresAt.Value < DateTime.UtcNow;

        return Ok(new QrValidationResponse(
            data.FullName,
            data.Email,
            isActive,
            activatedAt,
            expiresAt,
            isExpired));
    }
}
