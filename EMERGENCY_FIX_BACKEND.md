# EMERGENCY FIX - Backend Timeout Issue

## Problem
The backend is taking 10+ minutes or timing out when loading users without filters.

## Root Cause
The query is likely stuck on:
1. Counting 997,050 users
2. Loading roles for each user (expensive JOIN)
3. No query timeout set

## IMMEDIATE FIX - Add Query Timeout

In your `GetUsersAsync` method, add a timeout and simplify the query:

```csharp
public async Task<ResponseData<PagedResponse<UserModel>>> GetUsersAsync(PaginationParams parameters)
{
    try
    {
        // ✅ ADD TIMEOUT
        _context.Database.SetCommandTimeout(30); // 30 seconds max
        
        var query = _userManager.Users
            .Where(u => !u.IsDeleted)
            .AsNoTracking()
            .AsSplitQuery();

        // Apply filters (your existing code)
        if (parameters.Filters != null && parameters.Filters.Any())
        {
            // ... your filter code ...
        }

        // Sorting (your existing code)
        // ... your sorting code ...

        // ✅ EMERGENCY FIX: Skip count entirely for now
        int totalRecord = 1000; // Temporary fixed value

        // ✅ SIMPLIFIED: Load users WITHOUT roles first
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
                Roles = new List<string>() // ✅ TEMPORARY: Empty roles to speed up
            })
            .ToListAsync();

        // ✅ LOAD ROLES SEPARATELY (faster)
        var userIds = users.Select(u => u.Id).ToList();
        var userRoles = await (from ur in _context.UserRoles
                               join r in _context.Roles on ur.RoleId equals r.Id
                               where userIds.Contains(ur.UserId)
                               select new { ur.UserId, r.Name })
                              .ToListAsync();

        // Map roles to users
        foreach (var user in users)
        {
            user.Roles = userRoles
                .Where(ur => ur.UserId == user.Id)
                .Select(ur => ur.Name)
                .ToList();
        }

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
        Console.WriteLine($"ERROR in GetUsersAsync: {ex.Message}");
        return new ResponseData<PagedResponse<UserModel>>
        {
            Success = false,
            Message = $"Error Occurred: {ex.Message}"
        };
    }
}
```

## BETTER FIX - Optimize the Roles Query

The main bottleneck is loading roles. Replace your roles loading with this optimized version:

```csharp
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
        // ✅ OPTIMIZED: Load roles in a single query
        Roles = _context.UserRoles
            .Where(ur => ur.UserId == u.Id)
            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
            .ToList()
    })
    .ToListAsync();
```

## FASTEST FIX - Add Index for UserRoles

Run this SQL to speed up role loading:

```sql
-- Index for UserRoles table
CREATE INDEX IX_UserRoles_UserId 
ON AspNetUserRoles(UserId);

-- Index for Roles
CREATE INDEX IX_Roles_Id_Name 
ON AspNetRoles(Id) 
INCLUDE (Name);
```

## Check Backend Logs

1. Open your backend console/terminal
2. Look for errors or stuck queries
3. You might need to restart the backend

## If Still Stuck

1. **Restart your backend** (Ctrl+C and run again)
2. **Check SQL Server** - Open Activity Monitor in SSMS to see if queries are running
3. **Increase timeout** in your connection string:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=...;Database=...;Trusted_Connection=True;Command Timeout=60;"
}
```

## Quick Test

Try this minimal version first to see if backend responds:

```csharp
public async Task<ResponseData<PagedResponse<UserModel>>> GetUsersAsync(PaginationParams parameters)
{
    try
    {
        var users = await _userManager.Users
            .Where(u => !u.IsDeleted)
            .Take(10)
            .Select(u => new UserModel
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Roles = new List<string> { "guest" }
            })
            .ToListAsync();

        return new ResponseData<PagedResponse<UserModel>>
        {
            Success = true,
            Message = "Users Fetched Successfully",
            Data = new PagedResponse<UserModel>
            {
                TotalItems = 10,
                Page = 1,
                PageSize = 10,
                Data = users
            }
        };
    }
    catch (Exception ex)
    {
        return new ResponseData<PagedResponse<UserModel>>
        {
            Success = false,
            Message = $"Error: {ex.Message}"
        };
    }
}
```

If this works, then gradually add back the features.
