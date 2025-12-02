public async Task<ResponseData<PagedResponse<UserModel>>> GetUsersAsync(PaginationParams parameters)
{
    try
    {
        var query = _userManager.Users
            .Where(u => !u.IsDeleted)
            .AsNoTracking()
            .AsSplitQuery();

        // Apply filters
        if (parameters.Filters != null && parameters.Filters.Any())
        {
            if (parameters.Filters.TryGetValue("id", out var userId) && !string.IsNullOrWhiteSpace(userId))
            {
                query = query.Where(e => e.Id == userId);
            }

            if (parameters.Filters.TryGetValue("fullName", out var fn) && !string.IsNullOrWhiteSpace(fn))
            {
                // ✅ OPTIMIZED: Use StartsWith for better index usage
                var searchTerm = fn.ToLower();
                query = query.Where(e => e.FullName.ToLower().StartsWith(searchTerm));
            }

            if (parameters.Filters.TryGetValue("email", out var em) && !string.IsNullOrWhiteSpace(em))
            {
                // ✅ OPTIMIZED: Use StartsWith for better index usage
                var searchTerm = em.ToLower();
                query = query.Where(e => e.Email.ToLower().StartsWith(searchTerm));
            }

            if (parameters.Filters.TryGetValue("phoneNumber", out var pn) && !string.IsNullOrWhiteSpace(pn))
            {
                // ✅ OPTIMIZED: Use StartsWith for better index usage
                query = query.Where(e => e.PhoneNumber.StartsWith(pn));
            }

            if (parameters.Filters.TryGetValue("isActive", out var ia) && !string.IsNullOrWhiteSpace(ia))
            {
                if (bool.TryParse(ia, out bool active))
                {
                    query = query.Where(e => e.IsActive == active);
                }
            }

            if (parameters.Filters.TryGetValue("country", out var c) && !string.IsNullOrWhiteSpace(c))
            {
                // ✅ OPTIMIZED: Use StartsWith for better index usage
                var searchTerm = c.ToLower();
                query = query.Where(e => e.Country != null && e.Country.Name.ToLower().StartsWith(searchTerm));
            }

            if (parameters.Filters.TryGetValue("roles", out var roleFilters) && !string.IsNullOrWhiteSpace(roleFilters))
            {
                var rf = roleFilters.ToLower();
                query = query.Where(u => _context.UserRoles
                    .Join(_context.Roles, 
                        ur => ur.RoleId, 
                        r => r.Id, 
                        (ur, r) => new { ur.UserId, Name = r.Name })
                    .Any(ur => ur.UserId == u.Id && (ur.Name ?? "").ToLower().Contains(rf)));
            }
        }

        // Sorting
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
            query = query.OrderByDescending(e => e.CreatedAt); // ✅ OPTIMIZED: Default to DESC for newest first
        }

        // ✅ OPTIMIZED: Always get total count (more reliable)
        var totalRecord = await query.CountAsync();

        // Pagination and projection
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
