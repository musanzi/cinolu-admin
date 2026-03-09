# Project Participations API Integration Guide

## Overview

The Project Participations API manages user participation in projects, including enrollment, phase assignments, upvoting, and bulk participant management via CSV imports.

---

## Base Routes

- **Base Path**: `/projects`
- **Participations**: `/projects/:projectId/participations`
- **User Participations**: `/projects/me/participations`

---

## Endpoints

### 1. Participate in Project

**POST** `/projects/:projectId/participate`

Enroll the current user in a project with optional venture association.

**Authorization**: Authenticated user

**Params**:

- `projectId` (UUID) - Project identifier

**Body** (`ParticipateProjectDto`):

```json
{
  "ventureId": "uuid" // Optional - Associate a venture with participation
}
```

**Response**: `204 No Content`

---

### 2. Get User Participations

**GET** `/projects/me/participations`

Retrieve all projects the current user is participating in.

**Authorization**: Authenticated user

**Response** (`ProjectParticipation[]`):

```json
[
  {
    "id": "uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string"
    },
    "project": {
      "id": "uuid",
      "title": "string",
      "phases": [/* Phase objects */]
    },
    "venture": {
      "id": "uuid",
      "name": "string"
    } | null,
    "phases": [
      {
        "id": "uuid",
        "name": "string",
        "order": number
      }
    ]
  }
]
```

---

### 3. Get Project Participations

**GET** `/projects/:projectId/participations`

Retrieve all participants for a specific project with filtering and pagination.

**Authorization**: Public

**Params**:

- `projectId` (UUID) - Project identifier

**Query** (`FilterParticipationsDto`):

- `page` (number) - Page number (default: 1, 20 items per page)
- `phaseId` (UUID) - Filter participants by phase
- `q` (string) - Search by user name or email

**Response**:

```json
[
  [
    /* Array of ProjectParticipation objects */
  ],
  123 // Total count
]
```

**ProjectParticipation Object**:

```json
{
  "id": "uuid",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string"
  },
  "venture": {
    "id": "uuid",
    "name": "string"
  } | null,
  "project": { /* Project object */ },
  "phases": [/* Phase objects */],
  "upvotesCount": number  // Virtual field - count of upvotes
}
```

---

### 4. Move Participants to Phase

**POST** `/projects/participants/move`

Add multiple participants to a specific project phase.

**Authorization**: `projects:update`

**Body** (`MoveParticipantsDto`):

```json
{
  "ids": ["uuid1", "uuid2"], // Required - Array of participation IDs
  "phaseId": "uuid" // Required - Target phase ID
}
```

**Response**: `204 No Content`

**Behavior**:

- Skips participants already in the target phase
- Appends phase to existing phase assignments
- Does not remove from other phases

---

### 5. Remove Participants from Phase

**POST** `/projects/participants/remove`

Remove multiple participants from a specific project phase.

**Authorization**: `projects:update`

**Body** (`MoveParticipantsDto`):

```json
{
  "ids": ["uuid1", "uuid2"], // Required - Array of participation IDs
  "phaseId": "uuid" // Required - Phase ID to remove from
}
```

**Response**: `204 No Content`

**Behavior**:

- Removes only the specified phase
- Keeps participants in other phases
- Does not delete the participation record

---

### 6. Upvote Participation

**POST** `/projects/participations/:participationId/upvote`

Add an upvote to a project participation.

**Authorization**: Authenticated user

**Params**:

- `participationId` (UUID) - Participation identifier

**Response**: `204 No Content`

**Notes**:

- Each user can upvote once per participation
- Duplicate upvotes throw error (unique constraint)

---

### 7. Remove Upvote

**DELETE** `/projects/participations/:participationId/upvote`

Remove the current user's upvote from a participation.

**Authorization**: Authenticated user

**Params**:

- `participationId` (UUID) - Participation identifier

**Response**: `204 No Content`

---

### 8. Import Participants from CSV

**POST** `/projects/:projectId/participants/import-csv`

Bulk import participants from a CSV file.

**Authorization**: `projects:update`

**Params**:

- `projectId` (UUID) - Project identifier

**Body** (multipart/form-data):

- `file` (File) - CSV file with user data

**Response**: `204 No Content`

**CSV Format**:
The CSV should contain user information (exact columns depend on `parseUsersCsv` helper implementation).

**Behavior**:

- Creates users if they don't exist (via `findOrCreate`)
- Skips existing participants
- Sets participation `created_at` to project's `started_at`

---

## Data Transfer Objects

### ParticipateProjectDto

```typescript
{
  ventureId?: string;  // Optional - UUID of associated venture
}
```

### MoveParticipantsDto

```typescript
{
  ids: string[];       // Required - Array of participation UUIDs
  phaseId: string;     // Required - Phase UUID
}
```

### FilterParticipationsDto

```typescript
{
  page?: number;       // Optional - Page number (default: 1)
  phaseId?: string;    // Optional - Filter by phase UUID
  q?: string;          // Optional - Search query (name/email)
}
```

---

## Response Schema

### ProjectParticipation Entity

```typescript
{
  id: string;                              // UUID
  created_at: Date;
  updated_at: Date;
  user: User;                              // Participant user
  project: Project;                        // Associated project
  venture: Venture | null;                 // Optional venture
  phases: Phase[];                         // Assigned phases
  deliverable_submissions: DeliverableSubmission[];
  upvotes: ProjectParticipationUpvote[];
  upvotesCount?: number;                   // Virtual field in queries
}
```

### ProjectParticipationUpvote Entity

```typescript
{
  id: string; // UUID
  created_at: Date;
  updated_at: Date;
  user: User; // User who upvoted
  participation: ProjectParticipation; // Upvoted participation
}
```

**Constraints**:

- One participation per user per project (unique: user + project)
- One upvote per user per participation (unique: user + participation)

---

## Integration Examples

### User Enrollment Flow

```typescript
// Step 1: User participates in project
await fetch('/projects/abc-123/participate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer <token>'
  },
  body: JSON.stringify({
    ventureId: 'venture-uuid' // Optional
  })
});

// Step 2: Check user's participations
const participations = await fetch('/projects/me/participations', {
  headers: { Authorization: 'Bearer <token>' }
}).then((r) => r.json());
```

### Query Participations with Filters

```typescript
// Get all participants in a specific phase, page 2
const response = await fetch('/projects/abc-123/participations?phaseId=phase-uuid&page=2').then((r) => r.json());

const [participations, totalCount] = response;

// Search participants by name
const searchResults = await fetch('/projects/abc-123/participations?q=john').then((r) => r.json());
```

### Manage Phase Assignments

```typescript
// Move participants to a new phase
await fetch('/projects/participants/move', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer <token>'
  },
  body: JSON.stringify({
    ids: ['participation-1', 'participation-2'],
    phaseId: 'new-phase-uuid'
  })
});

// Remove participants from a phase
await fetch('/projects/participants/remove', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer <token>'
  },
  body: JSON.stringify({
    ids: ['participation-1', 'participation-2'],
    phaseId: 'phase-to-remove-uuid'
  })
});
```

### Upvoting System

```typescript
// Upvote a participation
await fetch('/projects/participations/abc-123/upvote', {
  method: 'POST',
  headers: { Authorization: 'Bearer <token>' }
});

// Remove upvote
await fetch('/projects/participations/abc-123/upvote', {
  method: 'DELETE',
  headers: { Authorization: 'Bearer <token>' }
});
```

### CSV Import

```typescript
// Import participants from CSV
const formData = new FormData();
formData.append('file', csvFile);

await fetch('/projects/abc-123/participants/import-csv', {
  method: 'POST',
  headers: { Authorization: 'Bearer <token>' },
  body: formData
});
```

---

## Authorization

Endpoint access requirements:

- **Participate**: Authenticated user
- **Get User Participations**: Authenticated user
- **Get Project Participations**: Public
- **Move/Remove Participants**: `projects:update`
- **Upvote/Unvote**: Authenticated user
- **CSV Import**: `projects:update`

---

## Notes

- Pagination returns 20 items per page for participations list
- Participation records use soft cascade deletes with project/user
- Upvotes have unique constraint per user-participation pair
- CSV imports skip duplicate participants automatically
- Phase assignments are cumulative (participants can be in multiple phases)
- `upvotesCount` is a virtual field loaded via query builder
- Search query (`q`) applies to both user name and email
