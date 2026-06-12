using GymFit.API.Data;
using GymFit.API.DTOs;
using GymFit.API.Models;
using GymFit.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymFit.API.Controllers;

[ApiController]
[Route("api/trainers")]
public class TrainersController : ControllerBase
{
    private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public TrainersController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // GET /api/trainers - public
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<TrainerListItem>>> GetAll()
    {
        var trainers = await _db.Trainers
            .OrderBy(t => t.User.FullName)
            .Select(t => new TrainerListItem(t.Id, t.User.FullName, t.Bio, t.Phone, t.PhotoUrl))
            .ToListAsync();

        return Ok(trainers);
    }

    // GET /api/trainers/{id} - includes upcoming classes
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<TrainerDetailResponse>> GetById(Guid id)
    {
        var now = DateTime.UtcNow;

        var trainer = await _db.Trainers
            .Where(t => t.Id == id)
            .Select(t => new TrainerDetailResponse(
                t.Id,
                t.User.FullName,
                t.Bio,
                t.Phone,
                t.PhotoUrl,
                t.ClassTrainers
                    .Where(ct => ct.Class.ScheduledAt >= now)
                    .OrderBy(ct => ct.Class.ScheduledAt)
                    .Select(ct => new TrainerClassItem(
                        ct.Class.Id,
                        ct.Class.Name,
                        ct.Class.ScheduledAt,
                        ct.Class.DurationMinutes,
                        ct.Class.Capacity,
                        ct.Class.Enrollments.Count))))
            .FirstOrDefaultAsync();

        if (trainer is null) return NotFound(new MessageResponse("Trainer not found."));
        return Ok(trainer);
    }

    // admin - creates both the user row and trainer profile
    [HttpPost]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult<TrainerListItem>> Create(CreateTrainerRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new MessageResponse("A user with this email already exists."));

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Role = UserRole.Trainer,
        };

        var trainer = new Trainer
        {
            User = user,
            Bio = request.Bio,
            Phone = request.Phone,
        };

        _db.Users.Add(user);
        _db.Trainers.Add(trainer);
        await _db.SaveChangesAsync();

        var result = new TrainerListItem(trainer.Id, user.FullName, trainer.Bio, trainer.Phone, trainer.PhotoUrl);
        return CreatedAtAction(nameof(GetById), new { id = trainer.Id }, result);
    }

    // admin - update bio + phone
    [HttpPut("{id:guid}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult<TrainerListItem>> Update(Guid id, UpdateTrainerRequest request)
    {
        var trainer = await _db.Trainers.Include(t => t.User).FirstOrDefaultAsync(t => t.Id == id);
        if (trainer is null) return NotFound(new MessageResponse("Trainer not found."));

        trainer.Bio = request.Bio;
        trainer.Phone = request.Phone;
        await _db.SaveChangesAsync();

        return Ok(new TrainerListItem(trainer.Id, trainer.User.FullName, trainer.Bio, trainer.Phone, trainer.PhotoUrl));
    }

    // admin - remove trainer profile, demotes role back to "user"
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var trainer = await _db.Trainers.Include(t => t.User).FirstOrDefaultAsync(t => t.Id == id);
        if (trainer is null) return NotFound(new MessageResponse("Trainer not found."));

        trainer.User.Role = UserRole.User;
        _db.Trainers.Remove(trainer);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // admin - upload trainer photo, saves to wwwroot/uploads
    [HttpPost("{id:guid}/photo")]
    [Authorize(Roles = UserRole.Admin)]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<TrainerListItem>> UploadPhoto(Guid id, IFormFile file)
    {
        var trainer = await _db.Trainers.Include(t => t.User).FirstOrDefaultAsync(t => t.Id == id);
        if (trainer is null) return NotFound(new MessageResponse("Trainer not found."));

        if (file is null || file.Length == 0)
            return BadRequest(new MessageResponse("No file was uploaded."));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedImageExtensions.Contains(ext))
            return BadRequest(new MessageResponse($"Unsupported file type. Allowed: {string.Join(", ", AllowedImageExtensions)}."));

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(uploadsDir, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        trainer.PhotoUrl = $"/uploads/{fileName}";
        await _db.SaveChangesAsync();

        return Ok(new TrainerListItem(trainer.Id, trainer.User.FullName, trainer.Bio, trainer.Phone, trainer.PhotoUrl));
    }

    // trainer self-service - note the singular /api/trainer/ prefix

    // trainer - their assigned classes
    [HttpGet("/api/trainer/my-classes")]
    [Authorize(Roles = UserRole.Trainer)]
    public async Task<ActionResult<IEnumerable<TrainerClassItem>>> MyClasses()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var trainer = await _db.Trainers.FirstOrDefaultAsync(t => t.UserId == userId);
        if (trainer is null) return NotFound(new MessageResponse("Trainer profile not found."));

        var classes = await _db.ClassTrainers
            .Where(ct => ct.TrainerId == trainer.Id)
            .OrderBy(ct => ct.Class.ScheduledAt)
            .Select(ct => new TrainerClassItem(
                ct.Class.Id,
                ct.Class.Name,
                ct.Class.ScheduledAt,
                ct.Class.DurationMinutes,
                ct.Class.Capacity,
                ct.Class.Enrollments.Count))
            .ToListAsync();

        return Ok(classes);
    }

    // trainer - students for one of their classes (returns 403 if not their class)
    [HttpGet("/api/trainer/my-classes/{classId:guid}/students")]
    [Authorize(Roles = UserRole.Trainer)]
    public async Task<ActionResult<IEnumerable<EnrolledStudent>>> MyClassStudents(Guid classId)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var trainer = await _db.Trainers.FirstOrDefaultAsync(t => t.UserId == userId);
        if (trainer is null) return NotFound(new MessageResponse("Trainer profile not found."));

        var isAssigned = await _db.ClassTrainers
            .AnyAsync(ct => ct.TrainerId == trainer.Id && ct.ClassId == classId);

        if (!isAssigned)
            return Forbid();

        var students = await _db.Enrollments
            .Where(e => e.ClassId == classId)
            .OrderBy(e => e.User.FullName)
            .Select(e => new EnrolledStudent(e.UserId, e.User.FullName, e.User.Email, e.EnrolledAt))
            .ToListAsync();

        return Ok(students);
    }
}
