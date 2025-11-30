# FAQ Backend Integration Guide

## ✅ Updated to Match Your Backend API

The FAQ module has been updated to work with your exact backend API structure.

## API Endpoints Used

### 1. Get All FAQs
```
POST /api/Faq/get-faq
```

**Request Body:**
```json
{
  "page": 1,
  "pageSize": 10,
  "searchColumn": "Question",
  "searchValue": "search term",
  "sortColumn": "CreatedAt",
  "sortDirection": "asc",
  "additionalProp1": "string",
  "additionalProp2": "string",
  "additionalProp3": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "question": "string",
        "answer": "string",
        "content": "string",
        "isActive": true
      }
    ],
    "totalCount": 100
  },
  "message": "string"
}
```

### 2. Create FAQ
```
POST /api/Faq/add-faq
```

**Request Body:**
```json
{
  "question": "string",
  "answer": "stringtest",
  "isActive": true,
  "content": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FAQ created successfully"
}
```

### 3. Update FAQ
```
PUT /api/Faq/update-faq/{id}
```

**Request Body:**
```json
{
  "question": "string",
  "answer": "stringtest",
  "isActive": true,
  "content": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FAQ updated successfully"
}
```

### 4. Delete FAQ
```
DELETE /api/Faq/delete-faq/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "FAQ deleted successfully"
}
```

## Key Changes Made

### 1. FAQ Service (`faq.service.ts`)
- ✅ Changed ID type from `string` to `number` (int32)
- ✅ Updated `getFaqs()` to use POST `/get-faq` with pagination body
- ✅ Updated `createFaq()` to use POST `/add-faq`
- ✅ Updated `updateFaq()` to use PUT `/update-faq/{id}`
- ✅ Updated `deleteFaq()` to use DELETE `/delete-faq/{id}`
- ✅ Added support for both `answer` and `content` fields

### 2. FAQ Component (`faq.ts`)
- ✅ Updated toggle active to use full update endpoint
- ✅ Handles both `answer` and `content` fields from backend

### 3. FAQ Form Component (`faq-form.ts`)
- ✅ Changed ID type to number
- ✅ Updated to fetch FAQ by getting all and filtering by ID
- ✅ Sends both `answer` and `content` fields to backend
- ✅ Handles success/error messages from backend

## Important Notes

### Missing GET by ID Endpoint
Your backend doesn't have a dedicated `GET /api/Faq/{id}` endpoint. The current implementation:
- Fetches all FAQs using POST `/get-faq`
- Filters the result on the frontend to find the specific FAQ by ID

**Recommendation:** Add a GET endpoint in your backend for better performance:
```csharp
[HttpGet("{id}")]
public async Task<IActionResult> GetFaqById(int id)
{
    var result = await _faqService.GetFaqByIdAsync(id);
    return result.Success ? Ok(result) : NotFound(result.Message);
}
```

### Answer vs Content Field
Your backend seems to have both `answer` and `content` fields. The current implementation:
- Uses the CKEditor value for both fields
- Displays whichever field has data when loading

**Clarification Needed:** 
- Are both fields required?
- Should they have different content?
- Can we use just one field?

### Toggle Active Optimization
Currently, toggling active status requires sending all FAQ data. Consider adding a dedicated endpoint:
```csharp
[HttpPatch("toggle-active/{id}")]
public async Task<IActionResult> ToggleActive(int id, [FromBody] bool isActive)
{
    var result = await _faqService.ToggleActiveAsync(id, isActive);
    return result.Success ? Ok(result.Message) : BadRequest(result.Message);
}
```

## Testing Checklist

- [ ] List FAQs - Verify pagination works
- [ ] Search by question - Test search functionality
- [ ] Filter by Active/Inactive - Test status filter
- [ ] Sort by columns - Test sorting
- [ ] Create new FAQ - Test add functionality
- [ ] Edit existing FAQ - Test update functionality
- [ ] Toggle active status - Test status toggle
- [ ] Delete FAQ - Test delete with confirmation
- [ ] CKEditor - Verify rich text editing works

## Troubleshooting

### Issue: "Invalid Data" error when creating/updating
**Solution:** Check that all required fields are being sent:
- question (required)
- answer (required)
- content (required)
- isActive (required)

### Issue: FAQ not loading in edit mode
**Solution:** 
1. Check browser console for errors
2. Verify the FAQ ID exists in the database
3. Check that the get-faq endpoint returns the FAQ

### Issue: Toggle active not working
**Solution:** 
1. Ensure the FAQ has both answer and content fields populated
2. Check backend logs for validation errors
3. Consider adding the dedicated toggle endpoint

## API URL Configuration

Current API URL: `https://localhost:7065/api/Faq`

To change the API URL, update `src/app/faq/faq.service.ts`:
```typescript
private apiUrl = 'YOUR_API_URL/api/Faq';
```

## Permissions

Your backend uses these permissions:
- `ViewFaq` - Required to view FAQ list
- `AddFaq` - Required to create FAQ
- `EditFaq` - Required to update FAQ
- `DeleteFaq` - Required to delete FAQ

Make sure the logged-in user has these permissions assigned.
