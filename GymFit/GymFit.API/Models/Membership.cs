namespace GymFit.API.Models;

public class Membership
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime? ActivatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
