namespace GymFit.API.Models;

public class Trainer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string? Bio { get; set; }
    public string? Phone { get; set; }

    // relative path, e.g. /uploads/abc123.png
    public string? PhotoUrl { get; set; }

    public ICollection<ClassTrainer> ClassTrainers { get; set; } = new List<ClassTrainer>();
}
