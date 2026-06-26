using GymFit.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GymFit.API.Data;

// seeds demo data on every startup
// idempotent - checks by email/name before inserting so it won't duplicate stuff
// class times are relative to now so they always look upcoming in the demo
public static class DbSeeder
{
    public const string AdminEmail = "admin@gymfit.com";
    public const string AdminPassword = "Admin123!";

    // simple passwords for the demo
    private const string MemberPassword = "Member123!";
    private const string TrainerPassword = "Trainer123!";

    public static async Task SeedAsync(AppDbContext db)
    {
        var now = DateTime.UtcNow;

        // admin
        await EnsureUserAsync(db, AdminEmail, AdminPassword, "GymFit Administrator", UserRole.Admin,
            membership: Active(now, years: 100));

        // members - mix of active, expired, and inactive so the badges look good
        await EnsureUserAsync(db, "member@gymfit.com", MemberPassword, "Mary Member", UserRole.User,
            membership: Active(now, days: 30));
        await EnsureUserAsync(db, "filip@gymfit.com", MemberPassword, "Filip Hac", UserRole.User,
            membership: Active(now, days: 90));
        await EnsureUserAsync(db, "john@gymfit.com", MemberPassword, "John Carter", UserRole.User,
            membership: Active(now, days: 180));
        await EnsureUserAsync(db, "sarah@gymfit.com", MemberPassword, "Sarah Nguyen", UserRole.User,
            membership: Active(now, days: 7)); // expiring soon
        await EnsureUserAsync(db, "david@gymfit.com", MemberPassword, "David Okafor", UserRole.User,
            membership: Active(now, days: 365));
        await EnsureUserAsync(db, "expired@gymfit.com", MemberPassword, "Elena Petrova", UserRole.User,
            membership: Expired(now));
        await EnsureUserAsync(db, "pending@gymfit.com", MemberPassword, "Pavel Ionescu", UserRole.User,
            membership: Inactive());

        // trainers
        await EnsureTrainerAsync(db, "trainer@gymfit.com", TrainerPassword, "Tom Becker",
            bio: "Certified HIIT and conditioning coach with 8 years of experience.",
            phone: "+1 (555) 010-2030");
        await EnsureTrainerAsync(db, "alex@gymfit.com", TrainerPassword, "Alex Rivera",
            bio: "Strength and powerlifting specialist. Former national competitor.",
            phone: "+1 (555) 040-5060");
        await EnsureTrainerAsync(db, "nina@gymfit.com", TrainerPassword, "Nina Larsson",
            bio: "Yoga and mobility instructor focused on recovery and flexibility.",
            phone: "+1 (555) 070-8090");

        // save users + trainers first - the class queries below hit the db, not the change tracker
        await db.SaveChangesAsync();

        // classes - times are offset from today so they always look upcoming
        await EnsureClassAsync(db, "Morning HIIT",
            "High-intensity interval training to kick-start your day.",
            capacity: 15, scheduledAt: now.Date.AddDays(1).AddHours(7).AddMinutes(30), durationMinutes: 45,
            trainerEmails: new[] { "trainer@gymfit.com" });
        await EnsureClassAsync(db, "Strength 101",
            "Foundational barbell strength for all levels.",
            capacity: 12, scheduledAt: now.Date.AddDays(2).AddHours(18), durationMinutes: 60,
            trainerEmails: new[] { "alex@gymfit.com", "trainer@gymfit.com" });
        await EnsureClassAsync(db, "Yoga Flow",
            "Vinyasa-style flow to build mobility and calm.",
            capacity: 20, scheduledAt: now.Date.AddDays(3).AddHours(9), durationMinutes: 50,
            trainerEmails: new[] { "nina@gymfit.com" });
        await EnsureClassAsync(db, "Spin Cycle",
            "Indoor cycling endurance and intervals.",
            capacity: 18, scheduledAt: now.Date.AddDays(4).AddHours(19), durationMinutes: 45,
            trainerEmails: new[] { "nina@gymfit.com" });
        await EnsureClassAsync(db, "Boxing Basics",
            "Fundamentals of footwork, defense, and combinations.",
            capacity: 10, scheduledAt: now.Date.AddDays(5).AddHours(17).AddMinutes(30), durationMinutes: 60,
            trainerEmails: new[] { "alex@gymfit.com" });

        // save classes before adding enrollments
        await db.SaveChangesAsync();

        // enrollments - so the trainer dashboard and class counts aren't empty
        await EnsureEnrollmentAsync(db, "member@gymfit.com", "Morning HIIT");
        await EnsureEnrollmentAsync(db, "member@gymfit.com", "Yoga Flow");
        await EnsureEnrollmentAsync(db, "john@gymfit.com", "Morning HIIT");
        await EnsureEnrollmentAsync(db, "john@gymfit.com", "Strength 101");
        await EnsureEnrollmentAsync(db, "sarah@gymfit.com", "Yoga Flow");
        await EnsureEnrollmentAsync(db, "sarah@gymfit.com", "Spin Cycle");
        await EnsureEnrollmentAsync(db, "david@gymfit.com", "Strength 101");
        await EnsureEnrollmentAsync(db, "david@gymfit.com", "Boxing Basics");

        await db.SaveChangesAsync();
    }

    // membership helpers

    private static Membership Active(DateTime now, int days = 0, int years = 0) => new()
    {
        IsActive = true,
        ActivatedAt = now,
        ExpiresAt = years > 0 ? now.AddYears(years) : now.AddDays(days),
    };

    private static Membership Expired(DateTime now) => new()
    {
        IsActive = true,
        ActivatedAt = now.AddDays(-90),
        ExpiresAt = now.AddDays(-5),
    };

    private static Membership Inactive() => new()
    {
        IsActive = false,
        ActivatedAt = null,
        ExpiresAt = null,
    };

    // upsert helpers

    private static async Task<User> EnsureUserAsync(
        AppDbContext db, string email, string password, string fullName, string role, Membership membership)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existing is not null) return existing;

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            FullName = fullName,
            Role = role,
        };
        membership.User = user;
        user.Membership = membership;

        db.Users.Add(user);
        return user;
    }

    private static async Task EnsureTrainerAsync(
        AppDbContext db, string email, string password, string fullName, string bio, string phone)
    {
        // trainers are users under the hood - inactive membership since they don't need one
        var user = await EnsureUserAsync(db, email, password, fullName, UserRole.Trainer, Inactive());

        var hasTrainer = user.Trainer is not null
            || await db.Trainers.AnyAsync(t => t.User.Email == email);
        if (hasTrainer) return;

        user.Trainer = new Trainer
        {
            User = user,
            Bio = bio,
            Phone = phone,
        };
    }

    private static async Task EnsureClassAsync(
        AppDbContext db, string name, string description, int capacity,
        DateTime scheduledAt, int durationMinutes, string[] trainerEmails)
    {
        if (await db.Classes.AnyAsync(c => c.Name == name)) return;

        var cls = new Class
        {
            Name = name,
            Description = description,
            Capacity = capacity,
            ScheduledAt = scheduledAt,
            DurationMinutes = durationMinutes,
        };

        foreach (var email in trainerEmails)
        {
            var trainer = await db.Trainers.FirstOrDefaultAsync(t => t.User.Email == email);
            if (trainer is not null)
                cls.ClassTrainers.Add(new ClassTrainer { Class = cls, Trainer = trainer });
        }

        db.Classes.Add(cls);
    }

    private static async Task EnsureEnrollmentAsync(AppDbContext db, string userEmail, string className)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        var cls = await db.Classes.FirstOrDefaultAsync(c => c.Name == className);
        if (user is null || cls is null) return;

        if (await db.Enrollments.AnyAsync(e => e.UserId == user.Id && e.ClassId == cls.Id)) return;

        db.Enrollments.Add(new Enrollment { User = user, Class = cls });
    }
}
