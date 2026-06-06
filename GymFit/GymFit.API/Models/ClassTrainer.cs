namespace GymFit.API.Models;

// join table for the class <-> trainer many-to-many
public class ClassTrainer
{
    public Guid ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public Guid TrainerId { get; set; }
    public Trainer Trainer { get; set; } = null!;
}
