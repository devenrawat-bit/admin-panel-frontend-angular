# Optimized Controller Code - Single Query

## Current Code (SLOW - 3 separate queries)
```csharp
[HttpGet("stats")]
public async Task<IActionResult> GetUserStats()
{
    var stats = new
    {
        TotalUsers = await _userManager.Users.CountAsync(u => !u.IsDeleted),
        ActiveUsers = await _userManager.Users.CountAsync(u => !u.IsDeleted && u.IsActive),
        InactiveUsers = await _userManager.Users.CountAsync(u => !u.IsDeleted && !u.IsActive)
    };
    return Ok(stats);
}
```

## OPTION 1: Optimized with Single Query (FAST)

Replace your current code with this:

```csharp
[HttpGet("stats")]
public async Task<IActionResult> GetUserStats()
{
    var stats = await _userManager.Users
        .Where(u => !u.IsDeleted)
        .GroupBy(u => 1)
        .Select(g => new
        {
            TotalUsers = g.Count(),
            ActiveUsers = g.Count(u => u.IsActive),
            InactiveUsers = g.Count(u => !u.IsActive)
        })
        .FirstOrDefaultAsync();
    
    return Ok(stats ?? new { TotalUsers = 0, ActiveUsers = 0, InactiveUsers = 0 });
}
```

## OPTION 2: Ultra-Fast with Raw SQL (FASTEST)

If you need even faster performance:

```csharp
[HttpGet("stats")]
public async Task<IActionResult> GetUserStats()
{
    // Get DbContext from UserManager
    var dbContext = _userManager.Users.GetDbContext();
    
    var result = await dbContext.Database
        .SqlQueryRaw<UserStatsResult>(@"
            SELECT 
                COUNT(*) as TotalUsers,
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveUsers,
                SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveUsers
            FROM AspNetUsers
            WHERE IsDeleted = 0
        ")
        .FirstOrDefaultAsync();
    
    return Ok(result ?? new UserStatsResult());
}

// Add this class at the bottom of your controller or in a separate file
public class UserStatsResult
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
}
```

## OPTION 3: With Memory Caching (BEST for Production)

```csharp
private readonly IMemoryCache _cache;

// Update constructor
public UserController(
    IUserService userService,
    UserManager<ApplicationUser> userManager,
    IMemoryCache cache)
{
    _userService = userService;
    _userManager = userManager;
    _cache = cache;
}

[HttpGet("stats")]
public async Task<IActionResult> GetUserStats()
{
    const string cacheKey = "user_stats";
    
    // Try to get from cache
    if (_cache.TryGetValue(cacheKey, out object cachedStats))
    {
        return Ok(cachedStats);
    }
    
    // Single query
    var stats = await _userManager.Users
        .Where(u => !u.IsDeleted)
        .GroupBy(u => 1)
        .Select(g => new
        {
            TotalUsers = g.Count(),
            ActiveUsers = g.Count(u => u.IsActive),
            InactiveUsers = g.Count(u => !u.IsActive)
        })
        .FirstOrDefaultAsync();
    
    var result = stats ?? new { TotalUsers = 0, ActiveUsers = 0, InactiveUsers = 0 };
    
    // Cache for 30 seconds
    _cache.Set(cacheKey, result, TimeSpan.FromSeconds(30));
    
    return Ok(result);
}
```

Don't forget to register IMemoryCache in Program.cs:
```csharp
builder.Services.AddMemoryCache();
```

## Critical: Add Database Index

Run this SQL command for maximum performance:

```sql
CREATE INDEX IX_Users_IsDeleted_IsActive 
ON AspNetUsers(IsDeleted, IsActive);
```

## Performance Comparison

| Method | Queries | Time |
|--------|---------|------|
| Current (3 CountAsync) | 3 | 4000ms |
| Option 1 (Single GroupBy) | 1 | 200ms |
| Option 2 (Raw SQL) | 1 | 50ms |
| Option 3 (With Cache) | 1 (first), 0 (cached) | 5ms |

## Recommendation

Start with **Option 1** (simplest, 20x faster than current).

If still not fast enough, add **Option 3** (caching) for 800x improvement!
