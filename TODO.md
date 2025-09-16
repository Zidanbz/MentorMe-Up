# TODO: Implement Role-Based Access and Type Differentiation for Grievances

## 1. Update Types (src/types/index.ts)
- [x] Add `type` field to `Grievance` type
- [x] Add `type` field to `GrievanceClientData` type

## 2. Update Grievance Service (src/services/grievanceService.ts)
- [x] Modify `addGrievance` to accept and store the grievance type
- [x] Add role check to prevent CEO from adding grievances
- [x] Update `getGrievances` to filter by grievance type based on workspaceId

## 3. Update UI (src/app/grievances/page.tsx)
- [x] Enforce role-based UI: Show add grievance dialog only for non-CEO roles
- [x] Automatically set grievance type based on userProfile.workspaceId
- [x] Update grievance list to show only grievances of the user's workspace type

## 4. Testing
- [x] Test role-based access (CEO can view, others can add)
- [x] Test automatic type assignment based on workspace
- [x] Test grievance filtering by type
