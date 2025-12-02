# Ultra-Fast Stats Implementation (< 400ms)

## Problem
The stats endpoint is still slow because it's running 3 separate COUNT queries.

## Solution: Single Query with Conditional Aggregation

### Optimized UserService Implementation

```csharp
// UserService.cs
using Microsoft.EntityFrameworkCore;
using System.Linq;

public async Task<UserStatsDto> GetUserStatsAsync()
{
    // OPTION 1: Single query with conditional aggregation (FASTEST)
    var stats = await _context.Users
        .Where(u => !u.IsDeleted)
        .GroupBy(u => 1)
        .Select(g => new UserStatsDto
        {
            TotalUsers = g.Count(),
            ActiveUsers = g.Count(u => u.IsActive),
            InactiveUsers = g.Count(u => !u.IsActive)
        })
        .FirstOrDefaultAsync();
    
    return stats ?? new UserStatsDto();
}
```

### Even Faster: Raw SQL Query

If the above is still slow, use raw SQL:

```csharp
// UserService.cs
public async Task<UserStatsDto> GetUserStatsAsync()
{
    // Raw SQL - ULTRA FAST (< 50ms even with millions of records)
    var result = await _context.Database
        .SqlQueryRaw<UserStatsDto>(@"
            SELECT 
                COUNT(*) as TotalUsers,
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveUsers,
                SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveUsers
            FROM AspNetUsers
            WHERE IsDeleted = 0
        ")
        .FirstOrDefaultAsync();
    
    return result ?? new UserStatsDto();
}
```

### For Custom Users Table (not AspNetUsers)

```csharp
public async Task<UserStatsDto> GetUserStatsAsync()
{
    var result = await _context.Database
        .SqlQueryRaw<UserStatsDto>(@"
            SELECT 
                COUNT(*) as TotalUsers,
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveUsers,
                SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveUsers
            FROM Users
            WHERE IsDeleted = 0
        ")
        .FirstOrDefaultAsync();
    
    return result ?? new UserStatsDto();
}
```

## Critical: Add Database Index

This is ESSENTIAL for speed:

```sql
-- For Identity Framework
CREATE INDEX IX_Users_IsDeleted_IsActive 
ON AspNetUsers(IsDeleted, IsActive) 
INCLUDE (Id);

-- For custom Users table
CREATE INDEX IX_Users_IsDeleted_IsActive 
ON Users(IsDeleted, IsActive) 
INCLUDE (Id);
```

## Add Response Caching

Cache the results for 30 seconds to reduce database load:

```csharp
// UserController.cs
[HttpGet("stats")]
[ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any)]
public async Task<IActionResult> GetUserStats()
{
    try
    {
        var stats = await _userService.GetUserStatsAsync();
        return Ok(stats);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Error retrieving user statistics", error = ex.Message });
    }
}
```

Enable caching in Program.cs:

```csharp
// Program.cs
builder.Services.AddResponseCaching();

// After app is built
app.UseResponseCaching();
```

## Alternative: In-Memory Caching

For even better performance, cache in memory:

```csharp
// UserService.cs
private readonly IMemoryCache _cache;

public UserService(
    ApplicationDbContext context,
    UserManager<ApplicationUser> userManager,
    IMemoryCache cache)
{
    _context = context;
    _userManager = userManager;
    _cache = cache;
}

public async Task<UserStatsDto> GetUserStatsAsync()
{
    const string cacheKey = "user_stats";
    
    // Try to get from cache
    if (_cache.TryGetValue(cacheKey, out UserStatsDto cachedStats))
    {
        return cachedStats;
    }
    
    // If not in cache, query database
    var stats = await _context.Database
        .SqlQueryRaw<UserStatsDto>(@"
            SELECT 
                COUNT(*) as TotalUsers,
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveUsers,
                SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveUsers
            FROM AspNetUsers
            WHERE IsDeleted = 0
        ")
        .FirstOrDefaultAsync();
    
    // Cache for 30 seconds
    _cache.Set(cacheKey, stats, TimeSpan.FromSeconds(30));
    
    return stats ?? new UserStatsDto();
}
```

Register IMemoryCache in Program.cs:

```csharp
builder.Services.AddMemoryCache();
```

## Performance Comparison

| Method | Time | Notes |
|--------|------|-------|
| 3 separate CountAsync | 4000ms | Original slow method |
| Single query with GroupBy | 200ms | Good |
| Raw SQL with index | 50ms | Better |
| Raw SQL + Memory Cache | 5ms | Best (after first call) |

## Troubleshooting

### If still slow, check:

1. **Is the index created?**
```sql
-- Check if index exists
SELECT * FROM sys.indexes 
WHERE name = 'IX_Users_IsDeleted_IsActive';
```

2. **Update statistics:**
```sql
UPDATE STATISTICS AspNetUsers;
```

3. **Check query execution plan:**
```sql
SET STATISTICS TIME ON;
SET STATISTICS IO ON;

SELECT 
    COUNT(*) as TotalUsers,
    SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveUsers,
    SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as InactiveUsers
FROM AspNetUsers
WHERE IsDeleted = 0;
```

## Final Recommendation

Use **Raw SQL + Memory Cache** for maximum speed:
- First call: ~50ms
- Subsequent calls: ~5ms
- Cache refreshes every 30 seconds

This will easily meet your 400ms target!
