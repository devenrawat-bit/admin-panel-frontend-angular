# FAQ Module Implementation

## Overview
Complete FAQ module with CRUD operations integrated into your admin panel.

## Files Created/Modified

### New Files Created:
1. **src/app/faq/faq.service.ts** - Service for API calls
2. **src/app/faq/faq-form.html** - Add/Edit FAQ form template
3. **src/app/faq/faq-form.scss** - Form styling
4. **src/app/faq/faq-form.ts** - Form component logic

### Modified Files:
1. **src/app/faq/faq.html** - Updated to show FAQ list with filters
2. **src/app/faq/faq.scss** - Updated with modern styling
3. **src/app/faq/faq.ts** - Updated with list logic
4. **src/app/app.routes.ts** - Added FAQ routes

## Features Implemented

### FAQ List Page (/faq)
- ✅ Display all FAQs in a table
- ✅ Search by Question
- ✅ Filter by Active/Inactive status
- ✅ Sortable columns (Question, Is Active)
- ✅ Toggle Active/Inactive status
- ✅ Edit FAQ button
- ✅ Delete FAQ button with confirmation
- ✅ Pagination (5, 10, 20, 50 items per page)
- ✅ Modern UI matching your design system

### Add FAQ Page (/faq/add)
- ✅ Question input field (required)
- ✅ Answer field with CKEditor (required)
- ✅ Status dropdown (Active/Inactive)
- ✅ Form validation
- ✅ Submit and Cancel buttons
- ✅ Breadcrumb navigation

### Edit FAQ Page (/faq/edit/:id)
- ✅ Pre-populated form with existing FAQ data
- ✅ Same fields as Add page
- ✅ Update functionality
- ✅ Breadcrumb navigation

## API Endpoints Expected

The service expects these endpoints from your backend:

```
GET    /api/Faq                    - Get all FAQs (with pagination, filters, sorting)
GET    /api/Faq/{id}               - Get single FAQ by ID
POST   /api/Faq                    - Create new FAQ
PUT    /api/Faq/{id}               - Update FAQ
DELETE /api/Faq/{id}               - Delete FAQ
PATCH  /api/Faq/{id}/toggle-active - Toggle active status
```

### Query Parameters for GET /api/Faq:
- `page` - Page number
- `pageSize` - Items per page
- `question` - Search by question
- `isActive` - Filter by status (true/false)
- `sortBy` - Field to sort by
- `sortOrder` - Sort direction (asc/desc)

### Expected Response Format:

**List Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "guid",
        "question": "string",
        "answer": "string",
        "isActive": boolean
      }
    ],
    "totalCount": number
  }
}
```

**Single FAQ Response:**
```json
{
  "success": true,
  "data": {
    "id": "guid",
    "question": "string",
    "answer": "string",
    "isActive": boolean
  }
}
```

## Design Features

### Styling
- Modern card-based design
- Consistent with your existing modules (Users, Roles, CMS)
- Responsive layout
- Smooth transitions and hover effects
- CKEditor integration with custom styling

### User Experience
- Clear breadcrumb navigation
- Confirmation dialogs for delete actions
- Loading states
- Error handling
- Form validation with visual feedback
- Toggle switches for active/inactive status

## Notes

- ❌ Display Order column excluded (as requested)
- ✅ Uses your existing sidebar and navbar
- ✅ Follows your design system (colors, spacing, typography)
- ✅ CKEditor integrated for rich text editing
- ✅ Fully responsive design

## Next Steps

1. Ensure your backend API endpoints match the expected format
2. Update the API URL in `faq.service.ts` if needed (currently: `https://localhost:7065/api/Faq`)
3. Test all CRUD operations
4. Adjust any backend response formats if they differ from expected

## Backend Integration

If your backend API differs, please share:
1. Your FAQ model/entity structure
2. API endpoint URLs
3. Request/Response formats

I can then adjust the service to match your backend implementation.
