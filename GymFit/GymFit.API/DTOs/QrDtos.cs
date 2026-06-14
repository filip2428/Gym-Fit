namespace GymFit.API.DTOs;

public record QrCodeResponse(
    Guid UserId,
    string QrCodeBase64);

public record QrValidationResponse(
    string FullName,
    string Email,
    bool IsActive,
    DateTime? ActivatedAt,
    DateTime? ExpiresAt,
    bool IsExpired);
