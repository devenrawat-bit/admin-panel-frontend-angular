# Fix Delete User - Backend Issue

## Problem
When a user is deleted, they still appear in the user list because the backend `get-users` endpoint is not filtering out deleted users.

## Solution

### Check Your Backend `get-users` Endpoint

Make sure your backend is filtering out deleted users:

```csharp
[HttpPost("get-users")]
public async Task<IActionResult> GetUsers([FromBody] UserFilterRequest request)
{
    // START WITH FILTERING OUT DELETED USERS
    var query = _userManager.Users
        .Where(u => !u.IsDeleted)  // ⚠️ THIS IS CRITICAL
        .AsQueryable();
    
    // Apply filters
    if (!string.IsNullOrEmpty(request.Filters?.FullName))
        query = query.Where(u => u.FullName.Contains(request.Filters.FullName));
    
    if (!string.IsNullOrEmpty(request.Filters?.Email))
        query = query.Where(u => u.Email.Contains(request.Filters.Email));
    
    if (!string.IsNullOrEmpty(request.Filters?.PhoneNumber))
        query = query.Where(u => u.PhoneNumber.Contains(request.Filters.PhoneNumber));
    
    if (!string.IsNullOrEmpty(request.Filters?.IsActive))
    {
        bool isActive = request.Filters.IsActive.ToLower() == "true";
        query = query.Where(u => u.IsActive == isActive);
    }
    
    // Get total count BEFORE pagination
    var totalCount = await query.CountAsync();
    
    // Apply sorting
    query = ApplySorting(query, request.SortColumn, request.SortDirection);
    
    // Apply pagination
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

## Check Your Delete Endpoint

Make sure your delete endpoint is setting `IsDeleted = true`:

```csharp
[HttpDelete("delete-user/{id}")]
public async Task<IActionResult> DeleteUser(string id)
{
    var user = await _userManager.FindByIdAsync(id);
    
    if (user == null)
        return NotFound(new { message = "User not found" });
    
    // Soft delete - set IsDeleted flag
    user.IsDeleted = true;
    user.DeletedAt = DateTime.UtcNow;
    
    var result = await _userManager.UpdateAsync(user);
    
    if (result.Succeeded)
        return Ok(new { message = "User deleted successfully" });
    
    return BadRequest(new { message = "Failed to delete user", errors = result.Errors });
}
```

## Alternative: Hard Delete (Not Recommended)

If you want to permanently delete users instead of soft delete:

```csharp
[HttpDelete("delete-user/{id}")]
public async Task<IActionResult> DeleteUser(string id)
{
    var user = await _userManager.FindByIdAsync(id);
    
    if (user == null)
        return NotFound(new { message = "User not found" });
    
    // Hard delete - permanently remove from database
    var result = await _userManager.DeleteAsync(user);
    
    if (result.Succeeded)
        return Ok(new { message = "User deleted successfully" });
    
    return BadRequest(new { message = "Failed to delete user", errors = result.Errors });
}
```

## Testing

1. Delete a user
2. Check the database - `IsDeleted` should be `1` (or `true`)
3. Refresh the user list - deleted user should NOT appear
4. Check the stats endpoint - count should decrease by 1

## Common Issues

### Issue 1: IsDeleted column doesn't exist
Add it to your ApplicationUser model:

```csharp
public class ApplicationUser : IdentityUser
{
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    // ... other properties
}
```

Then create a migration:
```
Add-Migration AddIsDeletedToUsers
Update-Database
```

### Issue 2: Old users don't have IsDeleted set
Run this SQL to fix existing data:

```sql
UPDATE AspNetUsers 
SET IsDeleted = 0 
WHERE IsDeleted IS NULL;
```

### Issue 3: Query is slow after adding filter
Make sure you have the index we created earlier:

```sql
CREATE INDEX IX_Users_IsDeleted_IsActive 
ON AspNetUsers(IsDeleted, IsActive);
```
