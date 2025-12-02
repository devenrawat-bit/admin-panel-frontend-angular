-- SQL Script to Assign Guest Role to All Users Without Roles

-- Step 1: Find the Guest role ID
-- Run this first to get the Guest role ID
SELECT Id, Name FROM AspNetRoles WHERE Name = 'guest';

-- Step 2: Assign Guest role to all users who don't have any role
-- Replace 'GUEST_ROLE_ID_HERE' with the actual ID from Step 1

-- Option A: If you know the Guest role ID, use this:
INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT 
    u.Id AS UserId,
    (SELECT Id FROM AspNetRoles WHERE Name = 'guest') AS RoleId
FROM AspNetUsers u
WHERE NOT EXISTS (
    SELECT 1 
    FROM AspNetUserRoles ur 
    WHERE ur.UserId = u.Id
)
AND u.IsDeleted = 0;

-- Step 3: Verify the assignment
-- Check how many users now have the guest role
SELECT 
    COUNT(*) AS UsersWithGuestRole
FROM AspNetUserRoles ur
INNER JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE r.Name = 'guest';

-- Step 4: Check users without any role (should be 0 after running Step 2)
SELECT 
    u.Id,
    u.UserName,
    u.Email
FROM AspNetUsers u
WHERE NOT EXISTS (
    SELECT 1 
    FROM AspNetUserRoles ur 
    WHERE ur.UserId = u.Id
)
AND u.IsDeleted = 0;

-- Step 5: View all users with their roles
SELECT 
    u.UserName,
    u.Email,
    STRING_AGG(r.Name, ', ') AS Roles
FROM AspNetUsers u
LEFT JOIN AspNetUserRoles ur ON u.Id = ur.UserId
LEFT JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE u.IsDeleted = 0
GROUP BY u.UserName, u.Email
ORDER BY u.UserName;
