# Backend Stats Endpoint - Complete Implementation

## Error Fix: "The name '_context' does not exist in the current context"

You need to inject your DbContext into the controller. Here's the complete implementation:

## UserController.cs

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YourNamespace.Data; // Replace with your actual namespace
using System.Threading.Tasks;

namespace YourNamespace.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context; // Replace ApplicationDbContext with your DbContext name
        
        // Constructor - Inject DbContext
        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetUserStats()
        {
            var stats = new
            {
                TotalUsers = await _context.Users.CountAsync(u => !u.IsDeleted),
                ActiveUsers = await _context.Users.CountAsync(u => !u.IsDeleted && u.IsActive),
                InactiveUsers = await _context.Users.CountAsync(u => !u.IsDeleted && !u.IsActive)
            };
            
            return Ok(stats);
        }

        // ... rest of your existing methods
    }
}
```

## RoleController.cs

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YourNamespace.Data; // Replace with your actual namespace
using System.Threading.Tasks;

namespace YourNamespace.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoleController : ControllerBase
    {
        private readonly ApplicationDbContext _context; // Replace ApplicationDbContext with your DbContext name
        
        // Constructor - Inject DbContext
        public RoleController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetRoleStats()
        {
            var stats = new
            {
                TotalRoles = await _context.Roles.CountAsync(r => !r.IsDeleted),
                ActiveRoles = await _context.Roles.CountAsync(r => !r.IsDeleted && r.IsActive),
                InactiveRoles = await _context.Roles.CountAsync(r => !r.IsDeleted && !r.IsActive)
            };
            
            return Ok(stats);
        }

        // ... rest of your existing methods
    }
}
```

## Key Points:

1. **Replace `ApplicationDbContext`** with your actual DbContext class name (might be `AppDbContext`, `DatabaseContext`, etc.)

2. **Replace `YourNamespace`** with your actual project namespace

3. **If your controller already has a constructor**, just add the DbContext parameter to it:

```csharp
// If you already have other services injected
public UserController(
    ApplicationDbContext context,
    IUserService userService,
    IMapper mapper)
{
    _context = context;
    _userService = userService;
    _mapper = mapper;
}
```

4. **Make sure your DbContext is registered** in `Program.cs`:

```csharp
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

## Alternative: If you're using a Service Layer

If you're using a repository or service pattern, inject that instead:

```csharp
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    
    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetUserStats()
    {
        var stats = await _userService.GetUserStatsAsync();
        return Ok(stats);
    }
}
```

Then implement in your service:

```csharp
public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    
    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<UserStatsDto> GetUserStatsAsync()
    {
        return new UserStatsDto
        {
            TotalUsers = await _context.Users.CountAsync(u => !u.IsDeleted),
            ActiveUsers = await _context.Users.CountAsync(u => !u.IsDeleted && u.IsActive),
            InactiveUsers = await _context.Users.CountAsync(u => !u.IsDeleted && !u.IsActive)
        };
    }
}
```

## Testing the Endpoint

Once implemented, test with:
- GET https://localhost:7065/api/User/stats
- GET https://localhost:7065/api/Role/stats

Expected response:
```json
{
  "totalUsers": 997050,
  "activeUsers": 897445,
  "inactiveUsers": 99605
}
```
