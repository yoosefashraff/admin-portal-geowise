# Netlify Timeout Solution for Auto-Dispatch

## Problem

Netlify has a **hard limit of 26 seconds** for serverless functions. The auto-dispatch feature calls `generateBookings()` which makes a backend API request that can take longer than 26 seconds, causing timeouts.

## Solution: Batch Processing

### Current Implementation

The auto-dispatch feature now processes credit IDs in **batches of 5** to ensure each batch completes within Netlify's 26-second timeout limit.

### How It Works

1. **Split credit IDs into batches** (5 credit IDs per batch)
2. **Process batches sequentially** with a 20-second timeout per batch
3. **Aggregate results** from all batches
4. **Provide real-time feedback** to the user

### Benefits

- ✅ Works within Netlify's 26-second limit
- ✅ No backend changes required
- ✅ Clear progress feedback for users
- ✅ Handles partial failures gracefully

## Long-Term Solution: Backend Async API

For better scalability and UX, the backend should implement an **asynchronous API**:

### Backend Changes Needed

1. **New endpoint:** `POST /ApprovedUserCredits/GenerateBookingsAsync`
   - Returns immediately with a `jobId`
   - Processes bookings in background

2. **Status endpoint:** `GET /ApprovedUserCredits/JobStatus/{jobId}`
   - Returns job status: `pending`, `processing`, `completed`, `failed`
   - Includes progress percentage and results when complete

3. **Webhook/SSE support** (optional):
   - Push updates to frontend when job completes
   - Better than polling for real-time updates

### Frontend Changes for Async API

1. Call `GenerateBookingsAsync` → get `jobId`
2. Poll `JobStatus` endpoint every 2-3 seconds
3. Update progress page with real-time status
4. Show completion when job status is `completed` or `failed`

## Current Workaround

The batching solution is a **workaround** that works with the current synchronous backend API. For production at scale, implement the async backend API.
