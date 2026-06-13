using GymFit.API.Data;
using GymFit.API.DTOs;
using GymFit.API.Models;
using GymFit.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymFit.API.Controllers;

[ApiController]
[Route("api/classes")]
public class ClassesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ClassesController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/classes - public, includes trainer info and enrolled count
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ClassListItem>>> GetAll()
    {
        var classes = await _db.Classes
            .OrderBy(c => c.ScheduledAt)
            .Select(c => new ClassListItem(
                c.Id,
                c.Name,
                c.Description,
                c.Capacity,
                c.ScheduledAt,
                c.DurationMinutes,
                c.Enrollments.Count,
                c.ClassTrainers.Select(ct => new TrainerSummary(ct.Trainer.Id, ct.Trainer.User.FullName))))
            .ToListAsync();

        return Ok(classes);
    }

    // GET /api/classes/enrolled - only the user's own classes
    [HttpGet("enrolled")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ClassListItem>>> GetMyEnrolled()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var classes = await _db.Enrollments
            .Where(e => e.UserId == userId)
            .Select(e => e.Class)
            .OrderBy(c => c.ScheduledAt)
            .Select(c => new ClassListItem(
                c.Id,
                c.Name,
                c.Description,
                c.Capacity,
                c.ScheduledAt,
                c.DurationMinutes,
                c.Enrollments.Count,
                c.ClassTrainers.Select(ct => new TrainerSummary(ct.Trainer.Id, ct.Trainer.User.FullName))))
            .ToListAsync();

        return Ok(classes);
    }

    // GET /api/classes/{id} - also tells you if the class is full
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ClassDetailResponse>> GetById(Guid id)
    {
        var item = await _db.Classes
            .Where(c => c.Id == id)
            .Select(c => new ClassDetailResponse(
                c.Id,
                c.Name,
                c.Description,
                c.Capacity,
                c.ScheduledAt,
                c.DurationMinutes,
                c.Enrollments.Count,
                c.Enrollments.Count >= c.Capacity,
                c.ClassTrainers.Select(ct => new TrainerSummary(ct.Trainer.Id, ct.Trainer.User.FullName))))
            .FirstOrDefaultAsync();

        if (item is null) return NotFound(new MessageResponse("Class not found."));
        return Ok(item);
    }

    // admin - create class + assign trainers
    [HttpPost]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult<ClassDetailResponse>> Create(CreateClassRequest request)
    {
        var newClass = new Class
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            Capacity = request.Capacity,
            ScheduledAt = request.ScheduledAt.ToUniversalTime(),
            DurationMinutes = request.DurationMinutes,
        };

        var error = await AssignTrainersAsync(newClass, request.TrainerIds);
        if (error is not null) return BadRequest(new MessageResponse(error));

        _db.Classes.Add(newClass);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = newClass.Id }, await BuildDetailAsync(newClass.Id));
    }

    // admin - update class, replaces trainer list entirely
    [HttpPut("{id:guid}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult<ClassDetailResponse>> Update(Guid id, UpdateClassRequest request)
    {
        var existing = await _db.Classes
            .Include(c => c.ClassTrainers)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (existing is null) return NotFound(new MessageResponse("Class not found."));

        existing.Name = request.Name.Trim();
        existing.Description = request.Description;
        existing.Capacity = request.Capacity;
        existing.ScheduledAt = request.ScheduledAt.ToUniversalTime();
        existing.DurationMinutes = request.DurationMinutes;

        // wipe and re-add trainers instead of doing a diff
        existing.ClassTrainers.Clear();
        var error = await AssignTrainersAsync(existing, request.TrainerIds);
        if (error is not null) return BadRequest(new MessageResponse(error));

        await _db.SaveChangesAsync();
        return Ok(await BuildDetailAsync(existing.Id));
    }

    // admin - delete class
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var existing = await _db.Classes.FindAsync(id);
        if (existing is null) return NotFound(new MessageResponse("Class not found."));

        _db.Classes.Remove(existing);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // enroll - checks active membership, capacity, and duplicate enrollment
    [HttpPost("{id:guid}/enroll")]
    [Authorize]
    public async Task<IActionResult> Enroll(Guid id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var cls = await _db.Classes
            .Where(c => c.Id == id)
            .Select(c => new { c.Id, c.Capacity, EnrolledCount = c.Enrollments.Count })
            .FirstOrDefaultAsync();

        if (cls is null) return NotFound(new MessageResponse("Class not found."));

        var membership = await _db.Memberships
            .Where(m => m.UserId == userId)
            .Select(m => new { m.IsActive, m.ExpiresAt })
            .FirstOrDefaultAsync();

        var hasActiveMembership = membership is not null
            && membership.IsActive
            && (membership.ExpiresAt is null || membership.ExpiresAt >= DateTime.UtcNow);

        if (!hasActiveMembership)
            return StatusCode(StatusCodes.Status403Forbidden,
                new MessageResponse("Your membership is inactive or expired. Please renew it to enroll in classes."));

        if (await _db.Enrollments.AnyAsync(e => e.ClassId == id && e.UserId == userId))
            return Conflict(new MessageResponse("You are already enrolled in this class."));

        if (cls.EnrolledCount >= cls.Capacity)
            return Conflict(new MessageResponse("This class is full."));

        _db.Enrollments.Add(new Enrollment { ClassId = id, UserId = userId.Value });
        await _db.SaveChangesAsync();

        return Ok(new MessageResponse("Enrolled successfully."));
    }

    // unenroll
    [HttpDelete("{id:guid}/unenroll")]
    [Authorize]
    public async Task<IActionResult> Unenroll(Guid id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var enrollment = await _db.Enrollments
            .FirstOrDefaultAsync(e => e.ClassId == id && e.UserId == userId);

        if (enrollment is null)
            return NotFound(new MessageResponse("You are not enrolled in this class."));

        _db.Enrollments.Remove(enrollment);
        await _db.SaveChangesAsync();

        return Ok(new MessageResponse("Unenrolled successfully."));
    }

    // returns an error string or null if all trainers exist
    private async Task<string?> AssignTrainersAsync(Class cls, List<Guid>? trainerIds)
    {
        if (trainerIds is null || trainerIds.Count == 0) return null;

        var distinctIds = trainerIds.Distinct().ToList();
        var existingIds = await _db.Trainers
            .Where(t => distinctIds.Contains(t.Id))
            .Select(t => t.Id)
            .ToListAsync();

        var missing = distinctIds.Except(existingIds).ToList();
        if (missing.Count > 0)
            return $"Unknown trainer id(s): {string.Join(", ", missing)}.";

        foreach (var trainerId in distinctIds)
            cls.ClassTrainers.Add(new ClassTrainer { ClassId = cls.Id, TrainerId = trainerId });

        return null;
    }

    private async Task<ClassDetailResponse> BuildDetailAsync(Guid id)
    {
        return (await _db.Classes
            .Where(c => c.Id == id)
            .Select(c => new ClassDetailResponse(
                c.Id,
                c.Name,
                c.Description,
                c.Capacity,
                c.ScheduledAt,
                c.DurationMinutes,
                c.Enrollments.Count,
                c.Enrollments.Count >= c.Capacity,
                c.ClassTrainers.Select(ct => new TrainerSummary(ct.Trainer.Id, ct.Trainer.User.FullName))))
            .FirstAsync());
    }
}
