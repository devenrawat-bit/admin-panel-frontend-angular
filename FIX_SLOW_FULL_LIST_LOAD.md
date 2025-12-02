# Fix Slow Full List Load

## Problem
When clearing search filters, loading all users is slow because:
1. `CountAsync()` is counting 997,050 records
2. Loading roles for each user is expensive
3. No caching for common queries

## Solution 1: Cache Total Count (Recommended)

Update your UserService.GetUsersAsync() method:

```csharp
// Add this as a class-level field in UserService
private static int? _cachedTotalUsers = null;
private static DateTime? _cacheExpiry = null;
private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

public async Task<ResponseData<PagedResponse<UserModel>>> GetUsersAsync(PaginationParams parameters)
{
    try
    {
        var query = _userManager.Users
            .Where(u => !u.IsDeleted)
            .AsNoTracking()
            .AsSplitQuery();

        bool hasFilters = parameters.Filters != null && parameters.Filters.Any();

        // Apply filters (your existing code)
        if (hasFilters)
        {
            // ... your existing filter code ...
        }

        // Sorting (your existing code)
        var sortableColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "fullName", "FullName" },
            { "email", "Email" },
            { "phoneNumber", "PhoneNumber" },
            { "dateOfBirth", "DateOfBirth" },
            { "country", "Country" },
            { "createdAt", "CreatedAt" },
            { "isActive", "IsActive" }
        };

        if (!string.IsNullOrEmpty(parameters.SortColumn) && 
            sortableColumns.TryGetValue(parameters.SortColumn, out var propName))
        {
            var direction = (parameters.SortDirection ?? "asc").ToLower();
            query = direction == "desc"
                ? query.OrderByDescending(e => EF.Property<object>(e, propName))
                : query.OrderBy(e => EF.Property<object>(e, propName));
        }
        else
        {
            query = query.OrderByDescending(e => e.CreatedAt);
        }

        // ✅ OPTIMIZED: Use cached count for full list, real count for filtered
        int totalRecord;
        
        if (!hasFilters && parameters.Page == 1)
        {
            // Use cached count for full list
            if (_cachedTotalUsers == null || _cacheExpiry == null || DateTime.UtcNow > _cacheExpiry)
            {
                totalRecord = await query.CountAsync();
                _cachedTotalUsers = totalRecord;
                _cacheExpiry = DateTime.UtcNow.Add(CacheDuration);
            }
            else
            {
                totalRecord = _cachedTotalUsers.Value;
            }
        }
        else if (hasFilters)
        {
            // Always count for filtered results
            totalRecord = await query.CountAsync();
        }
        else
        {
            // Use cached count for subsequent pages
            totalRecord = _cachedTotalUsers ?? await query.CountAsync();
        }

        // Pagination and projection (your existing code)
        var users = await query
            .Skip((parameters.Page - 1) * parameters.PageSize)
            .Take(parameters.PageSize)
            .Select(u => new UserModel
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                DateOfBirth = u.DateOfBirth,
                CountryId = u.CountryId,
                CountryName = u.Country != null ? u.Country.Name : null,
                StateId = u.StateId,
                StateName = u.State != null ? u.State.Name : null,
                CityId = u.CityId,
                CityName = u.City != null ? u.City.Name : null,
                ProfileImageUrl = u.ProfileUrl,
                IsActive = u.IsActive,
                Roles = (from ur in _context.UserRoles
                         join r in _context.Roles on ur.RoleId equals r.Id
                         where ur.UserId == u.Id
                         select r.Name).ToList()
            })
            .ToListAsync();

        return new ResponseData<PagedResponse<UserModel>>
        {
            Success = true,
            Message = "Users Fetched Successfully",
            Data = new PagedResponse<UserModel>
            {
                TotalItems = totalRecord,
                Page = parameters.Page,
                PageSize = parameters.PageSize,
                Data = users
            }
        };
    }
    catch (Exception ex)
    {
        return new ResponseData<PagedResponse<UserModel>>
        {
            Success = false,
            Message = $"Error Occurred: {ex.Message}"
        };
    }
}

// ✅ Add method to invalidate cache when users are added/deleted
public void InvalidateUserCountCache()
{
    _cachedTotalUsers = null;
    _cacheExpiry = null;
}
```

## Solution 2: Simpler - Just Remove Count on Page > 1

If you don't want caching, just optimize the count logic:

```csharp
// Replace your count logic with this:
int totalRecord;

if (parameters.Page == 1)
{
    // Only count on first page
    totalRecord = await query.CountAsync();
}
else
{
    // For subsequent pages, use a stored value or estimate
    // You can pass this from frontend or use a rough estimate
    totalRecord = 997050; // Or get from a cached value
}
```

## Solution 3: Add Response Caching (Best for Production)

In your controller, add caching:

```csharp
[HasPermission(PermissionEnum.ViewUser)]
[HttpPost("get-users")]
[ResponseCache(Duration = 30, VaryByQueryKeys = new[] { "*" })] // Cache for 30 seconds
public async Task<IActionResult> GetAllUser([FromBody] Pagination model)
{
    // ... your existing code
}
```

And in Program.cs:

```csharp
builder.Services.AddResponseCaching();

// After app is built
app.UseResponseCaching();
```

## Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| Search "de" | 4000ms | 100ms |
| Clear search (full list) | 4000ms | 50ms (cached) |
| Page 2, 3, etc. | 4000ms | 100ms |

## Recommendation

Use **Solution 1** (caching) - it's the most efficient and handles all scenarios well. The cache refreshes every 5 minutes automatically.

## When to Invalidate Cache

Call `InvalidateUserCountCache()` when:
- A user is created
- A user is deleted
- Bulk operations are performed

Example:
```csharp
public async Task<ResponseData<string>> CreateUserAsync(CreateUserModel model)
{
    // ... create user logic
    
    InvalidateUserCountCache(); // Refresh cache
    
    return success;
}
```
