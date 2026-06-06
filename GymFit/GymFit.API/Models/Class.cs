using System.ComponentModel.DataAnnotations;

namespace GymFit.API.Models;

public class Class
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int Capacity { get; set; }

    public DateTime ScheduledAt { get; set; }

    public int DurationMinutes { get; set; }

    public ICollection<ClassTrainer> ClassTrainers { get; set; } = new List<ClassTrainer>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}
