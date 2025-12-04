# Internal Notification System API

## Overview
Complete internal notification system using only your Node.js server and MongoDB. No external services (Firebase, FCM, OneSignal, etc.).

## Features
✅ Admin can create/send notifications to users  
✅ Notifications stored in MongoDB with TTL (auto-delete after 30 days)  
✅ Only `status="new"` notifications returned to clients  
✅ Status remains "new" for 30 days (no automatic change)  
✅ MongoDB TTL index + cron job for cleanup  
✅ Simple mobile app API (no user_id required)  
✅ Scalable REST API endpoints  

## API Endpoints

### 1. Create/Send Notification (Admin)
**POST** `/api/notifications`

**Request Body:**
```json
{
  "title": "System Maintenance",
  "message": "The system will be under maintenance tomorrow from 2-4 AM",
  "user_ids": null  // null = send to all users, or array of specific user IDs
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6750b2c4d4f5c1e8b2a1b2c3",
    "title": "System Maintenance",
    "message": "The system will be under maintenance tomorrow from 2-4 AM",
    "user_ids": null,
    "status": "new",
    "created_at": "2025-12-04T08:40:00.000Z",
    "updated_at": "2025-12-04T08:40:00.000Z"
  },
  "message": "Notification created and sent successfully"
}
```

### 2. Get Notifications for User
**GET** `/api/notifications?user_id=USER_ID`

**Query Parameters:**
- `user_id` (optional): Specific user ID
  - **With user_id:** Returns notifications for all users + user-specific notifications
  - **Without user_id:** Returns only notifications meant for all users

**Important:** Notifications remain "status: new" for 30 days and do NOT change after being retrieved.

**Examples:**

*GET `/api/notifications` (no user_id - general notifications):*
```json
{
  "success": true,
  "data": [
    {
      "_id": "6750b2c4d4f5c1e8b2a1b2c3",
      "title": "System Maintenance",
      "message": "The system will be under maintenance tomorrow from 2-4 AM",
      "user_ids": null,
      "status": "new",
      "created_at": "2025-12-04T08:40:00.000Z",
      "updated_at": "2025-12-04T08:40:00.000Z"
    }
  ],
  "count": 1
}
```

*GET `/api/notifications?user_id=user123` (with specific user):*
```json
{
  "success": true,
  "data": [
    {
      "_id": "6750b2c4d4f5c1e8b2a1b2c3",
      "title": "System Maintenance",
      "message": "The system will be under maintenance tomorrow from 2-4 AM",
      "user_ids": null,
      "status": "new",
      "created_at": "2025-12-04T08:40:00.000Z",
      "updated_at": "2025-12-04T08:40:00.000Z"
    },
    {
      "_id": "6750b2c4d4f5c1e8b2a1b2c4",
      "title": "Account Update Required",
      "message": "Please update your profile information",
      "user_ids": ["user123"],
      "status": "new",
      "created_at": "2025-12-04T08:41:00.000Z",
      "updated_at": "2025-12-04T08:41:00.000Z"
    }
  ],
  "count": 2
}
```

### 3. Simple Mobile App Notifications (No User ID Required)
**GET** `/api/notifications/mobile`

Perfect for mobile apps that don't require user authentication. Returns all notifications meant for all users.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6750b2c4d4f5c1e8b2a1b2c3",
      "title": "New App Update Available",
      "message": "Version 2.1.0 is now available with new features",
      "user_ids": null,
      "status": "new",
      "created_at": "2025-12-04T08:42:00.000Z",
      "updated_at": "2025-12-04T08:42:00.000Z"
    }
  ],
  "count": 1
}
```

### 4. Update Notification Status (Manual)
**PATCH** `/api/notifications/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6750b2c4d4f5c1e8b2a1b2c3",
    "title": "System Maintenance",
    "message": "The system will be under maintenance tomorrow from 2-4 AM",
    "user_ids": null,
    "status": "success",
    "created_at": "2025-12-04T08:40:00.000Z",
    "updated_at": "2025-12-04T08:40:17.000Z"
  },
  "message": "Notification status updated successfully"
}
```

### 5. Get All Notifications (Admin)
**GET** `/api/notifications/admin/all?status=new&page=1&limit=50`

**Query Parameters:**
- `status` (optional): Filter by status ("new" or "success")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 120,
    "limit": 50
  }
}
```

## Database Schema

### Notification Collection
```javascript
{
  _id: ObjectId,
  title: String (required, max 255 chars),
  message: String (required, max 1000 chars),
  user_ids: [ObjectId] or null, // null = send to all users
  status: "new" | "success", // default: "new"
  created_at: Date, // default: now, indexed for TTL
  updated_at: Date // default: now
}
```

### Indexes
1. **TTL Index:** `created_at: 1` (expires after 30 days = 2,592,000 seconds)
2. **Status Index:** `status: 1` (for fast filtering)
3. **Compound Index:** `created_at: 1, status: 1` (for queries)

## Auto-Delete System

### MongoDB TTL Index
- Notifications automatically deleted after 30 days from `created_at`
- No manual cleanup required for basic functionality

### Cron Job (Backup)
- **Schedule:** Daily at 2:00 AM
- **Purpose:** Manual cleanup and statistics logging
- **Logs:** Shows number of expired notifications deleted

### Statistics Monitoring
- **Schedule:** Hourly
- **Purpose:** Monitor notification counts and health
- **Output:** Console logs showing total, new, and success notification counts

## Usage Examples

### Send to All Users
```javascript
// Admin creates notification for all users
const notification = {
  title: "New Feature Available",
  message: "Check out our new dashboard!",
  user_ids: null  // null = all users
};
```

### Send to Specific Users
```javascript
// Admin creates notification for specific users
const notification = {
  title: "Account Update Required",
  message: "Please update your profile information",
  user_ids: ["user1_id", "user2_id", "user3_id"]
};
```

### Client Fetches Notifications
```javascript
// Web/app client gets their notifications
const response = await fetch('/api/notifications?user_id=USER_ID');
const { data: notifications } = await response.json();

// Notifications remain "new" and can be retrieved multiple times
// They will expire after 30 days automatically
```

### Mobile App Usage (No User ID Required)
```javascript
// Simple mobile app notification fetch
const response = await fetch('/api/notifications/mobile');
const { data: notifications } = await response.json();

// Returns notifications meant for all users
```

## Error Handling

### Common Responses
- `200`: Success
- `400`: Bad Request (missing fields, invalid data)
- `404`: Not Found (notification doesn't exist)
- `500`: Internal Server Error

### Example Error Response
```json
{
  "success": false,
  "message": "Title and message are required",
  "error": "ValidationError"
}
```

## Security Notes
- Add authentication middleware to admin routes
- Validate user permissions for creating notifications
- Sanitize input data to prevent XSS
- Use HTTPS in production

## Performance Optimizations
1. **TTL Index:** MongoDB handles automatic deletion
2. **Status Indexing:** Fast filtering of "new" notifications
3. **30-Day Retention:** Notifications available for 30 days from creation
4. **Pagination:** Admin endpoints support pagination for large datasets

## Testing

### Create Test Notification
```bash
curl -X POST http://localhost:4000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test notification",
    "user_ids": null
  }'
```

### Get Notifications (General)
```bash
curl "http://localhost:4000/api/notifications"
```

### Get Notifications (Specific User)
```bash
curl "http://localhost:4000/api/notifications?user_id=USER_ID"
```

### Get Mobile Notifications
```bash
curl "http://localhost:4000/api/notifications/mobile"
```

## Files Structure
```
📁 models/
  📄 notification.js          # MongoDB schema + TTL index

📁 controller/
  📄 notificationController.js # API endpoints logic

📁 routes/
  📄 notification.route.js     # Route definitions

📁 services/
  📄 notification.service.js   # Business logic layer

📁 cron/
  📄 cleanup.js                # Scheduled cleanup jobs

📄 index.js                    # App integration
```

## Key Changes for Mobile Apps

1. **No Status Change:** Notifications stay "new" for 30 days
2. **Simple Mobile API:** `/api/notifications/mobile` for apps without user auth
3. **Persistent Notifications:** Apps can fetch same notifications multiple times
4. **30-Day Retention:** Notifications expire automatically after 30 days

## Next Steps
1. Add authentication middleware to secure admin routes
2. Implement WebSocket support for real-time notifications
3. Add notification templates for common messages
4. Create admin dashboard for notification management
5. Add delivery analytics and tracking
6. Implement notification scheduling (send later)
7. Add push notification integration (if needed later)
8. Create mobile app SDK for easy integration