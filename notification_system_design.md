# Notification System Design

## Stage 1 — API Design

### Core actions
- Fetch all notifications
- Fetch unread notifications
- Mark a notification as read
- Mark all notifications as read
- Delete a notification
- Real-time notification delivery

### Endpoint: Fetch all notifications
- Method: `GET`
- URL: `/notifications`
- Headers:
  - `Authorization: Bearer <token>`
  - `Accept: application/json`
- Query params:
  - `limit` (integer)
  - `page` (integer)
  - `notification_type` (`Event`, `Result`, `Placement`)
- Request body: none
- Response body:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "studentId": 1042,
      "notificationType": "Result",
      "message": "Mid term grades released.",
      "createdAt": "2026-04-22T17:51:30Z",
      "isRead": false,
      "metadata": {}
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 123,
  "totalPages": 7
}
```

### Endpoint: Fetch unread notifications
- Method: `GET`
- URL: `/notifications/unread`
- Headers:
  - `Authorization: Bearer <token>`
  - `Accept: application/json`
- Query params:
  - `limit` (integer)
  - `page` (integer)
  - `notification_type` (`Event`, `Result`, `Placement`)
- Request body: none
- Response body:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "studentId": 1042,
      "notificationType": "Placement",
      "message": "New internship opportunity available.",
      "createdAt": "2026-06-01T12:00:00Z",
      "isRead": false,
      "metadata": {}
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 12,
  "totalPages": 1
}
```

### Endpoint: Mark a notification as read
- Method: `POST`
- URL: `/notifications/{notificationId}/read`
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Request body: none
- Response body:
```json
{
  "id": "uuid",
  "status": "read",
  "updatedAt": "2026-06-20T10:15:00Z"
}
```

### Endpoint: Mark all notifications as read
- Method: `POST`
- URL: `/notifications/read-all`
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Request body:
```json
{
  "studentId": 1042
}
```
- Response body:
```json
{
  "studentId": 1042,
  "updatedCount": 67,
  "status": "all read"
}
```

### Endpoint: Delete a notification
- Method: `DELETE`
- URL: `/notifications/{notificationId}`
- Headers:
  - `Authorization: Bearer <token>`
- Request body: none
- Response body:
```json
{
  "id": "uuid",
  "status": "deleted"
}
```

### Real-time notifications
- Method: `GET`
- URL: `/notifications/stream`
- Protocol: Server-Sent Events (SSE)
- Headers:
  - `Authorization: Bearer <token>`
  - `Accept: text/event-stream`
- Request body: none
- Response body example:
```text
event: notification
data: {"id":"uuid","studentId":1042,"notificationType":"Event","message":"Lab session updated.","createdAt":"2026-06-20T10:20:00Z","isRead":false}
```

#### Why SSE?
- SSE is a simple, reliable, low-overhead way to deliver notifications from server to browser.
- It supports automatic reconnection and works well for one-way notification feeds.
- It is easier to integrate into a frontend inbox than a full bidirectional WebSocket solution.

## Stage 2 — DB Design

### Recommended database
- Use a relational SQL database such as PostgreSQL.
- Structured notifications benefit from strong consistency, joins, and indexing.
- SQL is best for complex queries, filtering by student, type, and recency.

### Schema
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  student_id INTEGER NOT NULL,
  notification_type VARCHAR(16) NOT NULL CHECK (notification_type IN ('Event', 'Result', 'Placement')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_student_read_created_at
  ON notifications (student_id, is_read, created_at DESC);

CREATE INDEX idx_notifications_type_created_at
  ON notifications (notification_type, created_at DESC);
```

### Growth challenges
- Millions of rows can slow full scans.
- High-cardinality queries by student and type can stress indexes.
- Unread count queries can become expensive without support data.

### Scale solutions
- Add composite indexes for student + is_read + created_at.
- Partition by time ranges or student segments for very large datasets.
- Archive old notifications to history tables.
- Use read replicas for analytics and report queries.
- Cache counts and recent notification lists in Redis.

### SQL queries
- Fetch unread notifications for a student
```sql
SELECT id, notification_type, message, created_at, is_read
FROM notifications
WHERE student_id = 1042
  AND is_read = false
ORDER BY created_at DESC;
```

- Fetch all students who got a Placement notification in the last 7 days
```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

## Stage 3 — Query Analysis

### Query
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### What is wrong?
- It uses `SELECT *`, which returns unnecessary columns.
- It sorts ascending, showing oldest unread notifications first.
- It relies on field names that may not match the schema casing.

### Why is it slow?
- Without a composite index, the database may scan millions of rows.
- The query then sorts all matching rows by `createdAt`.
- The cost is O(N log N) on the matching set plus the scan to find matching rows.

### What to change?
- Add an index on `(studentID, isRead, createdAt)`.
- Select only required columns.
- Sort by `createdAt DESC` for the most relevant results.

### Index advice
- Adding indexes on every column is not good advice.
- Indexes improve reads but slow writes and consume storage.
- Focus on indexes that match real query patterns.

### Better query
```sql
SELECT id, notification_type, message, created_at, is_read
FROM notifications
WHERE student_id = 1042
  AND is_read = false
ORDER BY created_at DESC;
```

### Placement notifications in last 7 days
```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

## Stage 4 — Performance

### Caching
- Works by storing frequent responses in memory or Redis.
- Pros: faster reads and less DB load.
- Cons: data may become stale and requires cache invalidation.

### Pagination
- Works by loading smaller result pages instead of full tables.
- Pros: lower memory and smaller response payloads.
- Cons: requires more requests and state management.

### Lazy loading
- Works by loading additional notifications on demand.
- Pros: quicker first render and less wasted data.
- Cons: more complex UX and request logic.

### SSE instead of polling
- Works by pushing new updates through a persistent stream.
- Pros: near-real-time updates without repeated polling.
- Cons: requires persistent connection management and server resources.

### CDN/static caching
- Works for non-personalized assets or notifications metadata.
- Pros: offloads traffic and speeds static delivery.
- Cons: not suitable for user-specific notification content.

## Stage 5 — Bulk Notify + Reliability

### Shortcomings
- Sequential processing is slow for 50,000 recipients.
- Failures in the middle can leave partial state.
- There is no retry, backoff, or dead-letter handling.
- Email, DB save, and push are too tightly coupled.

### If email fails midway
- The system should not stop processing.
- Failed deliveries should be retried and recorded separately.
- A reliable design decouples actions and preserves the saved notification.

### Reliable redesign
- Persist notification records first.
- Enqueue delivery tasks for email and push.
- Process tasks asynchronously with retries.
- Use idempotency to avoid duplicate sends.

### DB + email relationship
- Saving to DB and sending email should not be synchronous together.
- DB save should happen first so the notification exists even if delivery fails.
- Delivery should be handled asynchronously for reliability.

### Revised pseudocode
```python
function notify_all(student_ids, message):
    job_id = create_bulk_notification_job(student_ids, message)
    for student_id in student_ids:
        notification_id = save_notification(student_id, message)
        enqueue_delivery({
            "jobId": job_id,
            "notificationId": notification_id,
            "studentId": student_id,
            "message": message,
        })
    return {"jobId": job_id, "status": "queued"}

function process_delivery(task):
    try:
        send_email(task.studentId, task.message)
    except TemporaryFailure:
        retry(task)
        return
    except PermanentFailure:
        log_failure(task)

    try:
        push_to_app(task.studentId, task.notificationId, task.message)
    except PushError:
        retry(task)
        return

    mark_delivery_complete(task.notificationId)
```

## Stage 6 — Priority Inbox

### Priority logic
- Use weights for notification types:
  - Placement = 3
  - Result = 2
  - Event = 1
- Combine with recency:
  - `score = weight * 1000 + timestampMs / 1000000`
- Sort unread notifications by score and show the top N.

### How new notifications are handled
- Fetch recent notifications continuously or on user action.
- Recompute scores for new items.
- Keep the top N visible.

### Tradeoffs
- This gives a fast, user-focused top list.
- It may hide lower-ranked unread notifications.
- The UX can remain responsive by limiting N and ranking in memory.

