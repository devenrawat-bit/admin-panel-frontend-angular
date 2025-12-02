# How to Create Database Index - Step by Step

## Method 1: Using SQL Server Management Studio (SSMS) - Easiest

### Step 1: Open SSMS
- Open **SQL Server Management Studio** (SSMS)
- Connect to your SQL Server instance

### Step 2: Find Your Database
- In the left panel (Object Explorer), expand **Databases**
- Find and expand your application's database (e.g., "AdminPanelDb" or whatever your database is called)

### Step 3: Open New Query
- Right-click on your database name
- Select **New Query**

### Step 4: Run the SQL Command
- Copy and paste this command:
```sql
CREATE INDEX IX_Users_IsDeleted_IsActive 
ON AspNetUsers(IsDeleted, IsActive);
```

- Click **Execute** button (or press F5)

### Step 5: Verify
- You should see: "Command(s) completed successfully."
- To verify the index was created:
```sql
SELECT * FROM sys.indexes 
WHERE object_id = OBJECT_ID('AspNetUsers') 
AND name = 'IX_Users_IsDeleted_IsActive';
```

---

## Method 2: Using Visual Studio

### Step 1: Open SQL Server Object Explorer
- In Visual Studio, go to **View** → **SQL Server Object Explorer**

### Step 2: Connect to Your Database
- Expand **SQL Server** → **(localdb)\MSSQLLocalDB** (or your server)
- Expand **Databases** → Find your database

### Step 3: Open New Query
- Right-click on your database
- Select **New Query**

### Step 4: Run the Command
- Paste the SQL command:
```sql
CREATE INDEX IX_Users_IsDeleted_IsActive 
ON AspNetUsers(IsDeleted, IsActive);
```

- Click the green **Execute** button

---

## Method 3: Using Entity Framework Migration (Recommended for Production)

### Step 1: Open Package Manager Console
- In Visual Studio: **Tools** → **NuGet Package Manager** → **Package Manager Console**

### Step 2: Create a New Migration
```powershell
Add-Migration AddUserStatsIndex
```

### Step 3: Edit the Migration File
- Open the newly created migration file in `Migrations` folder
- Add this code in the `Up` method:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        CREATE INDEX IX_Users_IsDeleted_IsActive 
        ON AspNetUsers(IsDeleted, IsActive);
    ");
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(@"
        DROP INDEX IX_Users_IsDeleted_IsActive ON AspNetUsers;
    ");
}
```

### Step 4: Apply the Migration
```powershell
Update-Database
```

---

## Method 4: Using Command Line (sqlcmd)

### Step 1: Open Command Prompt
- Press **Win + R**, type `cmd`, press Enter

### Step 2: Connect to SQL Server
```cmd
sqlcmd -S localhost -d YourDatabaseName -E
```

Replace `YourDatabaseName` with your actual database name.

### Step 3: Run the Command
```sql
CREATE INDEX IX_Users_IsDeleted_IsActive ON AspNetUsers(IsDeleted, IsActive);
GO
```

### Step 4: Exit
```
EXIT
```

---

## Method 5: Using Azure Data Studio

### Step 1: Open Azure Data Studio
- Download from: https://aka.ms/azuredatastudio (if you don't have it)

### Step 2: Connect to Your Database
- Click **New Connection**
- Enter your server details
- Select your database

### Step 3: New Query
- Click **New Query** button

### Step 4: Run the Command
```sql
CREATE INDEX IX_Users_IsDeleted_IsActive 
ON AspNetUsers(IsDeleted, IsActive);
```

- Click **Run** or press F5

---

## Troubleshooting

### Error: "Cannot find the object 'AspNetUsers'"
Your table might have a different name. Check with:
```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%User%';
```

### Error: "Column 'IsDeleted' does not exist"
Your table might not have this column. Check columns:
```sql
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'AspNetUsers';
```

If `IsDeleted` or `IsActive` don't exist, adjust the index:
```sql
-- If only IsActive exists
CREATE INDEX IX_Users_IsActive ON AspNetUsers(IsActive);

-- If neither exists
-- You don't need the index, but performance will be slower
```

---

## Verification

After creating the index, verify it works:

```sql
-- Check if index exists
SELECT 
    i.name AS IndexName,
    COL_NAME(ic.object_id, ic.column_id) AS ColumnName
FROM sys.indexes AS i
INNER JOIN sys.index_columns AS ic 
    ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE i.object_id = OBJECT_ID('AspNetUsers')
    AND i.name = 'IX_Users_IsDeleted_IsActive';
```

---

## Recommended Method

For development: **Method 1 (SSMS)** - Quick and easy

For production: **Method 3 (EF Migration)** - Trackable and deployable
