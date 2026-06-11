namespace GymFit.API.DTOs;

public record MemberListItem(
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    DateTime? ActivatedAt,
    DateTime? ExpiresAt,
    bool IsExpired);
