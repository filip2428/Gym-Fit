using System.ComponentModel.DataAnnotations;

namespace GymFit.API.DTOs;

public record ActivateMembershipRequest(
    [Required] Guid UserId,
    [Range(1, 3650)] int DurationDays);

public record DeactivateMembershipRequest(
    [Required] Guid UserId);

public record MembershipStatusResponse(
    bool IsActive,
    DateTime? ActivatedAt,
    DateTime? ExpiresAt,
    bool IsExpired);
