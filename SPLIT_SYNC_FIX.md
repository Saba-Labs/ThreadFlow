# Split Model Database Sync Issue - FIXED

## Problem Identified
The split model functionality in the All Models page was **NOT syncing with Neon database**. 

### Symptoms:
- Split models appeared in UI immediately (local state update)
- Changes were NOT persisted to Neon database
- Refreshing the page would lose the split models
- Only the original parent model remained in database

### Root Cause
The `splitOrder` function in `client/hooks/useProductionPipeline.ts` (lines 472-525) only updated client-side state using `setStore()` but made **NO API calls** to persist the changes to the database.

## Solution Implemented

### Changes Made:

#### 1. **client/hooks/useProductionPipeline.ts** - Updated `splitOrder` callback
- Made the function `async` to support database operations
- Maintained optimistic UI updates for immediate user feedback
- Added API calls to persist changes:
  - `PUT /api/pipeline/orders/{orderId}` - Update parent order with remainder quantity
  - `POST /api/pipeline/orders` - Create child orders in database
- Added server synchronization via `fetchFromServer()` to ensure consistency
- Added error handling with automatic rollback on failure

#### 2. **client/components/pipeline/ModelList.tsx** - Updated split handling
- Updated `handleSplit()` to properly await the async `onSplit` operation
- Added error handling to prevent UI issues on split failure
- Updated the `ModelListProps` interface to reflect `onSplit` as `Promise<void>`

### How It Works Now:

1. User enters split quantities and confirms
2. `handleSplit()` calls `props.onSplit(parentId, validQuantities)` and awaits it
3. `splitOrder` callback:
   - Updates local state immediately (UI shows split models)
   - Persists parent order update to database
   - Creates new child orders in database
   - Fetches fresh data from server to sync UI with database
4. On error: automatically reverts local state and refetches from server

## Database Persistence Flow

```
Split Action
    ↓
Local State Update (UI updates immediately)
    ↓
API Call: Update Parent Order
    ├─ Quantity = Remainder
    ├─ Current Step Index = Same
    └─ Steps = Same
    ↓
API Calls: Create Child Orders
    ├─ For each split quantity
    ├─ ParentId = Original Order ID
    ├─ Fresh step IDs
    └─ New createdAt timestamp
    ↓
Server Sync: Fetch Updated Orders
    ├─ Ensures UI reflects database state
    └─ Prevents stale data issues
    ↓
Complete - Split models now persisted to Neon database
```

## Files Modified
1. `client/hooks/useProductionPipeline.ts` - Core fix
2. `client/components/pipeline/ModelList.tsx` - UI handling update

## Testing Recommendations
1. Create a model with quantity > 20
2. Click split button
3. Enter two quantities (e.g., 10 and 5)
4. Confirm split
5. Verify:
   - Parent model quantity updated to remainder (15)
   - Two child models created with correct quantities
   - All changes persist after page refresh
   - Check database to confirm all three orders exist

## Database Tables Affected
- `work_orders` - Parent quantity updated, child records created
- `path_steps` - Child orders get new step IDs (as designed)

## Future Improvements
- Could add transaction support for atomic operations
- Could implement undo functionality
- Could add split operation logging/audit trail
