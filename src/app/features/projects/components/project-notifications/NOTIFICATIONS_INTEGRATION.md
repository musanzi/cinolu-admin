# Notifications API Integration Guide

## Overview

The Notifications API enables creating, managing, and sending notifications within projects. Notifications can target specific project phases, mentors, or staff members.

---

## Base Routes

### Project-Scoped Notifications

- **Base Path**: `/projects/:projectId/notifications`
- **Query Notifications**: `/notifications/project/:projectId`

---

## Endpoints

### 1. Create Notification

**POST** `/projects/:projectId/notifications`

Create a new notification for a project.

**Authorization**: `projects:update`

**Params**:

- `projectId` (UUID) - Project identifier

**Body** (`CreateNotificationDto`):

```json
{
  "title": "string",           // Required
  "body": "string",             // Required
  "phase_id": "uuid",           // Optional - Target specific phase
  "notify_mentors": boolean,    // Optional - Notify all mentors
  "notify_staff": boolean       // Optional - Notify all staff
}
```

**Response** (`Notification`):

```json
{
  "id": "uuid",
  "title": "string",
  "body": "string",
  "status": "draft" | "sent",
  "notify_mentors": boolean | null,
  "notify_staff": boolean | null,
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "sender": {
    "id": "uuid",
    "name": "string",
    "email": "string"
  },
  "project": {
    "id": "uuid",
    "title": "string"
  },
  "phase": {
    "id": "uuid",
    "name": "string"
  } | null,
  "attachments": []
}
```

---

### 2. Send Notification

**POST** `/projects/notifications/:notificationId/send`

Send a draft notification to recipients.

**Authorization**: `projects:update`

**Params**:

- `notificationId` (UUID) - Notification identifier

**Response**: Same as Create Notification with `status: "sent"`

**Recipients Logic**:

- If `notify_staff = true` → All staff members
- If `notify_mentors = true` → All mentors assigned to phase
- If `phase_id` provided → All participants in that phase
- Otherwise → All project participants

---

### 3. Get Project Notifications

**GET** `/notifications/project/:projectId`

Retrieve all notifications for a project with filtering.

**Authorization**: `projects:read`

**Params**:

- `projectId` (UUID) - Project identifier

**Query** (`FilterNotificationsDto`):

- `page` (number) - Page number (default: 1, 10 items per page)
- `phaseId` (UUID) - Filter by phase
- `status` (enum) - Filter by status: `draft` | `sent`

**Response**:

```json
[
  [
    /* Array of Notification objects */
  ],
  123 // Total count
]
```

---

### 4. Update Notification

**PATCH** `/notifications/:notificationId`

Update a notification (only drafts should be edited).

**Authorization**: `notifications:update`

**Params**:

- `notificationId` (UUID) - Notification identifier

**Body** (`UpdateNotificationDto`):

```json
{
  "title": "string",           // Optional
  "body": "string",             // Optional
  "phase_id": "uuid",           // Optional
  "notify_mentors": boolean,    // Optional
  "notify_staff": boolean       // Optional
}
```

**Response**: Updated `Notification` object

---

### 5. Add Attachments

**POST** `/notifications/:notificationId/attachments`

Upload attachments to a notification (max 10 files).

**Authorization**: `notifications:update`

**Params**:

- `notificationId` (UUID) - Notification identifier

**Body** (multipart/form-data):

- `attachments` (File[]) - Array of files (max 10)

**Response** (`NotificationAttachment[]`):

```json
[
  {
    "id": "uuid",
    "filename": "document.pdf",
    "mimetype": "application/pdf",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

**Upload Location**: `./uploads/notifications/`

---

### 6. Delete Notification

**DELETE** `/notifications/:notificationId`

Permanently delete a notification.

**Authorization**: `notifications:delete`

**Params**:

- `notificationId` (UUID) - Notification identifier

**Response**: `204 No Content`

---

## Data Transfer Objects

### CreateNotificationDto

```typescript
{
  title: string;            // Required - Notification title
  body: string;             // Required - Notification content
  phase_id?: string;        // Optional - Phase UUID to target
  notify_mentors?: boolean; // Optional - Flag to notify mentors
  notify_staff?: boolean;   // Optional - Flag to notify staff
}
```

### UpdateNotificationDto

All fields from `CreateNotificationDto` are optional.

### FilterNotificationsDto

```typescript
{
  page?: number;            // Pagination - page number (default: 1)
  phaseId?: string;         // Filter by phase UUID
  status?: 'draft' | 'sent'; // Filter by notification status
}
```

---

## Response Schema

### Notification Entity

```typescript
{
  id: string;                           // UUID
  title: string;
  body: string;
  status: 'draft' | 'sent';
  notify_mentors: boolean | null;
  notify_staff: boolean | null;
  created_at: Date;
  updated_at: Date;
  sender: User;                         // User who created notification
  project: Project;
  phase: Phase | null;
  attachments: NotificationAttachment[];
}
```

### NotificationAttachment Entity

```typescript
{
  id: string; // UUID
  filename: string;
  mimetype: string;
  created_at: Date;
  updated_at: Date;
  notification: Notification;
}
```

---

## Enums

### NotificationStatus

```typescript
enum NotificationStatus {
  DRAFT = 'draft',
  SENT = 'sent'
}
```

---

## Integration Examples

### Create and Send Notification

```typescript
// Step 1: Create notification
const notification = await fetch('/projects/abc-123/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer <token>'
  },
  body: JSON.stringify({
    title: 'Project Update',
    body: 'Important updates about the project timeline.',
    phase_id: 'phase-uuid',
    notify_mentors: false,
    notify_staff: false
  })
});

// Step 2: Add attachments (optional)
const formData = new FormData();
formData.append('attachments', file1);
formData.append('attachments', file2);

await fetch(`/notifications/${notification.id}/attachments`, {
  method: 'POST',
  body: formData
});

// Step 3: Send notification
await fetch(`/projects/notifications/${notification.id}/send`, {
  method: 'POST'
});
```

### Query Notifications with Filters

```typescript
// Get all sent notifications for a specific phase
const response = await fetch('/notifications/project/abc-123?phaseId=phase-uuid&status=sent&page=1', {
  headers: { Authorization: 'Bearer <token>' }
});

const [notifications, totalCount] = await response.json();
```

---

## Authorization

All endpoints require authentication and specific RBAC permissions:

- **Create/Send**: `projects:update`
- **Read**: `projects:read`
- **Update**: `notifications:update`
- **Delete**: `notifications:delete`

---

## Notes

- Notifications are created in `draft` status by default
- Sending triggers the `notify.participants` event for email delivery
- Pagination returns 10 items per page
- Attachments are stored in `./uploads/notifications/`
- Deleting a notification cascades to attachments
- Maximum 10 files per attachment upload
