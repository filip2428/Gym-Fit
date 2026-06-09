using System.Security.Claims;

namespace GymFit.API.Services;

public static class ClaimsPrincipalExtensions
{
    // tries "userId" first, falls back to NameIdentifier
    public static Guid? GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue("userId")
                    ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : null;
    }
}
