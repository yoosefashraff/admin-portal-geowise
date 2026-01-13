# Backend Import Fix Required

## Problem
The backend import endpoint (`/ApprovedUserCredits/import`) is **automatically converting imported records to bookings immediately**. This is incorrect behavior.

## Expected Behavior
1. Import Excel file → Backend creates **pending service requests** (not bookings)
2. Pending service requests appear in the Service Requests list
3. User can review, edit, or dispatch them manually
4. OR user can run auto-dispatch to convert them to bookings
5. Only then should they become actual bookings/callouts

## Current (Incorrect) Behavior
1. Import Excel file → Backend **immediately converts to bookings**
2. Records appear in regular callouts list
3. No way to review/edit before dispatch
4. Bypasses the pending service requests workflow

## Frontend Changes Made
The frontend now sends these parameters to prevent auto-conversion:

### Query Parameters:
- `?autoConvert=false`
- `?createBookings=false`

### Form Data Fields:
- `autoConvert=false`
- `createBookings=false`
- `keepAsPending=true`

## Backend Changes Required

### Option 1: Support the Parameters (Recommended)
Update the `/ApprovedUserCredits/import` endpoint to:
1. Accept `autoConvert`, `createBookings`, or `keepAsPending` parameters
2. When `autoConvert=false` or `keepAsPending=true`:
   - Create records in a **pending service requests** table
   - Do NOT create bookings/callouts
   - Return the imported records with their IDs

### Option 2: Separate Endpoints
Create two endpoints:
- `/ApprovedUserCredits/import` - Creates pending service requests (default)
- `/ApprovedUserCredits/importAndConvert` - Creates bookings immediately (for backward compatibility)

### Option 3: Change Default Behavior
Change the default behavior to NOT auto-convert:
- Import creates pending service requests by default
- Add a parameter `autoConvert=true` for immediate conversion (if needed)

## Database Structure Needed

The backend needs a table/collection for **pending service requests**:
- Stores imported records before they become bookings
- Fields: Patient_Name, Approved Service, Mobile_Number, Address, Credits, etc.
- Status: Pending, Approved, Rejected
- Can be queried separately from bookings

## API Endpoints Needed

1. **GET /ServiceRequests/Pending** - List pending service requests
2. **POST /ServiceRequests/Dispatch** - Convert pending request to booking
3. **POST /ServiceRequests/BulkDispatch** - Convert multiple pending requests to bookings
4. **DELETE /ServiceRequests/Pending/:id** - Delete pending request

## Testing
After backend fix:
1. Import Excel file
2. Verify records appear in Service Requests list (not bookings)
3. Verify they have "Pending" status
4. Verify they can be dispatched manually or via auto-dispatch
5. Verify they only become bookings after dispatch

## Notes
- The frontend is already sending parameters to prevent auto-conversion
- If backend doesn't support these parameters yet, it will ignore them (current behavior continues)
- Once backend supports them, the fix will work automatically
- The `generateBookings` endpoint should work with pending service requests, not just credits
