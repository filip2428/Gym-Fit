using System.ComponentModel.DataAnnotations;

namespace GymFit.API.DTOs;

public record RegisterRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required] string FullName);

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password);

public record AuthResponse(
    string Token,
    Guid UserId,
    string Email,
    string FullName,
    string Role);
