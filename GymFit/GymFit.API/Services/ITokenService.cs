using GymFit.API.Models;

namespace GymFit.API.Services;

public interface ITokenService
{
    string GenerateToken(User user);
}
