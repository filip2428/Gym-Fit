using System.ComponentModel.DataAnnotations;

namespace GymFit.API.DTOs;

public record TrainerListItem(
    Guid Id,
    string FullName,
    string? Bio,
    string? Phone,
    string? PhotoUrl);

public record TrainerClassItem(
    Guid Id,
    string Name,
    DateTime ScheduledAt,
    int DurationMinutes,
    int Capacity,
    int EnrolledCount);

public record TrainerDetailResponse(
    Guid Id,
    string FullName,
    string? Bio,
    string? Phone,
    string? PhotoUrl,
    IEnumerable<TrainerClassItem> UpcomingClasses);

public record CreateTrainerRequest(
    [Required] string FullName,
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    string? Bio,
    string? Phone);

public record UpdateTrainerRequest(
    string? Bio,
    string? Phone);

public record EnrolledStudent(
    Guid UserId,
    string FullName,
    string Email,
    DateTime EnrolledAt);
