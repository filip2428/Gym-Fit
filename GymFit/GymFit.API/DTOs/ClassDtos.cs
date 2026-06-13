using System.ComponentModel.DataAnnotations;

namespace GymFit.API.DTOs;

public record TrainerSummary(Guid Id, string FullName);

public record ClassListItem(
    Guid Id,
    string Name,
    string? Description,
    int Capacity,
    DateTime ScheduledAt,
    int DurationMinutes,
    int EnrolledCount,
    IEnumerable<TrainerSummary> Trainers);

public record ClassDetailResponse(
    Guid Id,
    string Name,
    string? Description,
    int Capacity,
    DateTime ScheduledAt,
    int DurationMinutes,
    int EnrolledCount,
    bool IsFull,
    IEnumerable<TrainerSummary> Trainers);

public record CreateClassRequest(
    [Required] string Name,
    string? Description,
    [Range(0, int.MaxValue)] int Capacity,
    DateTime ScheduledAt,
    [Range(1, 1440)] int DurationMinutes,
    List<Guid>? TrainerIds);

public record UpdateClassRequest(
    [Required] string Name,
    string? Description,
    [Range(0, int.MaxValue)] int Capacity,
    DateTime ScheduledAt,
    [Range(1, 1440)] int DurationMinutes,
    List<Guid>? TrainerIds);
