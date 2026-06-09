namespace GymFit.API.Services;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "GymFit";
    public string Audience { get; set; } = "GymFit";
    public int ExpiryHours { get; set; } = 24;
}
