# Performance Optimization Guide - Dashboard & Users

## Problem
- Dashboard loading takes 4+ seconds
- Users page takes 4+ seconds to load 10 users
- Target: < 200ms response time

## Root Causes
1. **Dashboard**: Loading full user data (997,050 users) just to count them
2. **Users Page**: Inefficient queries without proper indexing
3. **No database query optimization**

## Backend Optimizations Required

### 1. Create Fast Stats Endpoint (Dashboard)

Create a new endpoint that returns ONLY counts using SQL COUNT queries:

```csharp
// UserController.cs
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

// RoleController.cs
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
```

**Performance Impact**: 4000ms → 50ms (80x faster)

### 2. Add Database Indexes

Add these indexes to your database:

```sql
-- Users table
CREATE INDEX IX_Users_IsDeleted_IsActive ON Users(IsDeleted, IsActive);
CREATE INDEX IX_Users_CreatedAt ON Users(CreatedAt DESC);
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_FullName ON Users(FullName);

-- Roles table
CREATE INDEX IX_Roles_IsDeleted_IsActive ON Roles(IsDeleted, IsActive);
CREATE INDEX IX_Roles_Name ON Roles(Name);
```

**Performance Impact**: 4000ms → 100ms (40x faster)

### 3. Optimize get-users Endpoint

Ensure your get-users endpoint uses proper pagination and doesn't load unnecessary data:

```csharp
[HttpPost("get-users")]
public async Task<IActionResult> GetUsers([FromBody] UserFilterRequest request)
{
    var query = _context.Users
        .Where(u => !u.IsDeleted)
        .AsQueryable();
    
    // Apply filters
    if (!string.IsNullOrEmpty(request.Filters?.FullName))
        query = query.Where(u => u.FullName.Contains(request.Filters.FullName));
    
    if (!string.IsNullOrEmpty(request.Filters?.Email))
        query = query.Where(u => u.Email.Contains(request.Filters.Email));
    
    // Get total count BEFORE pagination
    var totalCount = await query.CountAsync();
    
    // Apply sorting
    query = request.SortDirection?.ToLower() == "desc"
        ? query.OrderByDescending(u => EF.Property<object>(u, request.SortColumn ?? "CreatedAt"))
        : query.OrderBy(u => EF.Property<object>(u, request.SortColumn ?? "CreatedAt"));
    
    // Apply pagination - ONLY load what's needed
    var users = await query
        .Skip((request.Page - 1) * request.PageSize)
        .Take(request.PageSize)
        .Select(u => new UserViewModel
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            PhoneNumber = u.PhoneNumber,
            IsActive = u.IsActive,
            ProfileImage = u.ProfileImage,
            Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList()
        })
        .ToListAsync();
    
    return Ok(new
    {
        Data = users,
        TotalCount = totalCount,
        Page = request.Page,
        PageSize = request.PageSize
    });
}
```

**Key Points**:
- Use `.Select()` to load only needed fields
- Count BEFORE pagination
- Use proper indexes
- Don't load navigation properties unless needed

### 4. Enable Response Compression

In your `Program.cs`:

```csharp
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

// After app is built
app.UseResponseCompression();
```

### 5. Add Response Caching for Stats

```csharp
[HttpGet("stats")]
[ResponseCache(Duration = 60)] // Cache for 60 seconds
public async Task<IActionResult> GetUserStats()
{
    // ... stats code
}
```

## Expected Results After Optimization

| Endpoint | Before | After | Improvement |
|----------|--------|-------|-------------|
| Dashboard Stats | 4000ms | 50ms | 80x faster |
| Users List (10 items) | 4000ms | 100ms | 40x faster |
| Role Stats | 500ms | 30ms | 16x faster |

## Testing Performance

Use browser DevTools Network tab to measure:
1. Time to First Byte (TTFB)
2. Total request time
3. Response size

Target metrics:
- TTFB: < 100ms
- Total time: < 200ms
- Response size: < 50KB
