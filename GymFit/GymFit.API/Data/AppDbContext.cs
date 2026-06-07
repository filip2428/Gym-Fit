using GymFit.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GymFit.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Trainer> Trainers => Set<Trainer>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<ClassTrainer> ClassTrainers => Set<ClassTrainer>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // user
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).IsRequired();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.FullName).IsRequired();
            entity.Property(u => u.Role).IsRequired();
        });

        // membership is 1:1 with user, cascade delete
        modelBuilder.Entity<Membership>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.HasOne(m => m.User)
                  .WithOne(u => u.Membership)
                  .HasForeignKey<Membership>(m => m.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(m => m.UserId).IsUnique();
        });

        // same deal for trainer
        modelBuilder.Entity<Trainer>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasOne(t => t.User)
                  .WithOne(u => u.Trainer)
                  .HasForeignKey<Trainer>(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(t => t.UserId).IsUnique();
        });

        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired();
        });

        // classTrainer is the join table - composite pk instead of a surrogate
        modelBuilder.Entity<ClassTrainer>(entity =>
        {
            entity.HasKey(ct => new { ct.ClassId, ct.TrainerId });
            entity.HasOne(ct => ct.Class)
                  .WithMany(c => c.ClassTrainers)
                  .HasForeignKey(ct => ct.ClassId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(ct => ct.Trainer)
                  .WithMany(t => t.ClassTrainers)
                  .HasForeignKey(ct => ct.TrainerId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // unique index on (user, class) so you can't enroll twice at the db level
        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Enrollments)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Class)
                  .WithMany(c => c.Enrollments)
                  .HasForeignKey(e => e.ClassId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.ClassId }).IsUnique();
        });
    }
}
