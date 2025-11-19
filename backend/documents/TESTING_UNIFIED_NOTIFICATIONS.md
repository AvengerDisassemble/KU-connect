# Testing the Unified Notification System

## 🎯 What's New?

### **Unified API - All Notifications in One Place**
Previously, you had to call different endpoints for announcements vs. application notifications. Now everything is unified:

- ✅ **One endpoint** to get ALL notifications (announcements + job applications)
- ✅ **Type filtering** to see only specific notification types
- ✅ **Consistent API** across all notification types
- ✅ **Rich metadata** including sender info, job links, application links

---

## 🔧 Available Endpoints

### **1. Get All Notifications**
```bash
GET http://localhost:3000/api/notifications

# With filters
GET http://localhost:3000/api/notifications?unreadOnly=true
GET http://localhost:3000/api/notifications?type=APPLICATION_STATUS
GET http://localhost:3000/api/notifications?type=EMPLOYER_APPLICATION
GET http://localhost:3000/api/notifications?type=ANNOUNCEMENT
GET http://localhost:3000/api/notifications?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "clxy123abc",
        "userId": "user_student_123",
        "type": "APPLICATION_STATUS",
        "title": "Application Update",
        "message": "Your application for 'Senior Developer' has been qualified.",
        "priority": "HIGH",
        "isRead": false,
        "createdAt": "2025-11-18T10:30:00.000Z",
        "senderId": "user_employer_456",
        "jobId": "job_789",
        "applicationId": "app_101",
        "sender": {
          "id": "user_employer_456",
          "name": "John",
          "surname": "Doe",
          "role": "EMPLOYER"
        }
      },
      {
        "id": "clxy456def",
        "userId": "user_student_123",
        "type": "ANNOUNCEMENT",
        "title": "System Maintenance",
        "message": "The platform will undergo maintenance on Nov 20.",
        "priority": "MEDIUM",
        "isRead": false,
        "createdAt": "2025-11-18T09:00:00.000Z",
        "announcementId": "announce_999",
        "announcement": {
          "id": "announce_999",
          "title": "System Maintenance",
          "content": "The platform will undergo maintenance on Nov 20.",
          "priority": "MEDIUM",
          "audience": "ALL"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

---

### **2. Get Unread Count**
```bash
GET http://localhost:3000/api/notifications/unread/count

# Count only application notifications
GET http://localhost:3000/api/notifications/unread/count?type=APPLICATION_STATUS
```

**Response:**
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "count": 5
  }
}
```

---

### **3. Mark as Read**
```bash
PATCH http://localhost:3000/api/notifications/clxy123abc/read
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "clxy123abc",
    "isRead": true,
    "..."
  }
}
```

---

### **4. Mark All as Read**
```bash
PATCH http://localhost:3000/api/notifications/read-all

# Mark only announcements as read
PATCH http://localhost:3000/api/notifications/read-all?type=ANNOUNCEMENT
```

**Response:**
```json
{
  "success": true,
  "message": "Marked 5 notification(s) as read",
  "data": {
    "count": 5
  }
}
```

---

### **5. Delete Notification**
```bash
DELETE http://localhost:3000/api/notifications/clxy123abc
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": { ... }
}
```

---

### **6. Get Statistics**
```bash
GET http://localhost:3000/api/notifications/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Notification statistics retrieved successfully",
  "data": {
    "total": 25,
    "unread": 8,
    "byType": [
      {
        "type": "ANNOUNCEMENT",
        "count": 10,
        "unread": 2
      },
      {
        "type": "APPLICATION_STATUS",
        "count": 8,
        "unread": 4
      },
      {
        "type": "EMPLOYER_APPLICATION",
        "count": 7,
        "unread": 2
      }
    ]
  }
}
```

---

## 🧪 Testing with cURL (PowerShell)

### **Setup - Get Access Token**
First, login to get your access token:

```powershell
# Login as student
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"student@example.com","password":"password123"}' `
  -SessionVariable session

$token = $loginResponse.data.accessToken
Write-Host "Token: $token"
```

### **Test 1: Get All Notifications**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" } | ConvertTo-Json -Depth 10
```

### **Test 2: Get Only Unread Notifications**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications?unreadOnly=true" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" } | ConvertTo-Json -Depth 10
```

### **Test 3: Get Only Application Notifications**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications?type=APPLICATION_STATUS" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" } | ConvertTo-Json -Depth 10
```

### **Test 4: Get Unread Count**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/unread/count" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" } | ConvertTo-Json -Depth 10
```

### **Test 5: Mark Notification as Read**
```powershell
# Replace with actual notification ID
$notificationId = "clxy123abc"

Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/$notificationId/read" `
  -Method PATCH `
  -Headers @{ "Authorization" = "Bearer $token" } | ConvertTo-Json -Depth 10
```

### **Test 6: Mark All as Read**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/read-all" `
  -Method PATCH `
  -Headers @{ "Authorization" = "Bearer $token" } | ConvertTo-Json -Depth 10
```

### **Test 7: Get Statistics**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/stats" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" } | ConvertTo-Json -Depth 10
```

---

## 🔄 Testing the Full Flow

### **Scenario 1: Student Applies to Job → Employer Gets Notification**

```powershell
# 1. Student applies to a job (this triggers notification)
$applicationResponse = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/jobs/job_123/apply" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $studentToken" } `
  -ContentType "application/json" `
  -Body '{"coverLetter":"I am interested..."}'

# 2. Check employer's notifications
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/notifications?type=EMPLOYER_APPLICATION" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $employerToken" } | ConvertTo-Json -Depth 10

# Should see: "Student X has applied for your job post 'Job Title'."
```

---

### **Scenario 2: Employer Updates Application → Student Gets Notification**

```powershell
# 1. Employer updates application status (triggers notification)
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/jobs/job_123/applications/app_456" `
  -Method PATCH `
  -Headers @{ "Authorization" = "Bearer $employerToken" } `
  -ContentType "application/json" `
  -Body '{"status":"QUALIFIED"}'

# 2. Check student's notifications
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/notifications?type=APPLICATION_STATUS" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $studentToken" } | ConvertTo-Json -Depth 10

# Should see: "Your application for 'Job Title' has been qualified."
```

---

### **Scenario 3: Admin Creates Announcement → All Users Get Notification**

```powershell
# 1. Admin creates announcement (triggers bulk notifications)
$announcementResponse = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/admin/announcements" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $adminToken" } `
  -ContentType "application/json" `
  -Body '{"title":"System Update","content":"New features available!","audience":"ALL","priority":"HIGH"}'

# 2. Check any user's notifications
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/notifications?type=ANNOUNCEMENT" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $anyUserToken" } | ConvertTo-Json -Depth 10

# Should see: "System Update - New features available!"
```

---

## 🎨 Frontend Usage

In your React components, the notifications are automatically fetched:

```typescript
// Already works with your existing components!
import { useNotifications } from '@/hooks/useNotifications';

function NotificationBell() {
  const { 
    notifications,      // ALL notifications (all types)
    unreadCount,       // Total unread count
    markAsReadMutation 
  } = useNotifications(userId);

  // Filter by type if needed
  const applicationNotifs = notifications.filter(
    n => n.notificationType === 'APPLICATION_STATUS' || 
         n.notificationType === 'EMPLOYER_APPLICATION'
  );

  const announcementNotifs = notifications.filter(
    n => n.notificationType === 'ANNOUNCEMENT'
  );

  return (
    <div>
      {notifications.map(notif => (
        <div key={notif.id}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          <span>Type: {notif.notificationType}</span>
          {notif.data?.sender && (
            <span>From: {notif.data.sender.name}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 What's Different?

### **Before:**
```bash
# Old system - separate endpoints
GET /api/notifications              # Only announcements
GET /api/user-notifications         # Only application updates (NOT VISIBLE IN UI!)

# Result: Students never saw application status updates!
```

### **After (Now):**
```bash
# New unified system
GET /api/notifications               # ALL notification types
GET /api/notifications?type=...      # Filter by specific type

# Result: All notifications visible in one feed!
```

---

## ✅ Quick Test Checklist

- [ ] Start backend: `npm start`
- [ ] Login as student and get token
- [ ] Get all notifications: `GET /api/notifications`
- [ ] Check unread count: `GET /api/notifications/unread/count`
- [ ] Apply to a job (as student)
- [ ] Check employer got notification (as employer)
- [ ] Update application status (as employer)
- [ ] Check student got notification (as student)
- [ ] Mark notification as read
- [ ] Verify unread count decreased
- [ ] Get statistics: `GET /api/notifications/stats`

---

## 🐛 Troubleshooting

**No notifications showing?**
1. Check database has notifications: `npx prisma studio`
2. Verify Prisma client regenerated: `npx prisma generate`
3. Check token is valid in Authorization header

**Getting 404 errors?**
1. Ensure server is running on correct port
2. Check route registration in `src/routes/`
3. Verify middleware allows the endpoint

**Notifications not being created?**
1. Check job application flow triggers `notifyEmployerOfApplication()`
2. Verify status update triggers `notifyStudentOfApproval()`
3. Check announcement creation calls `createAnnouncementNotifications()`

---

**Ready to test!** 🚀 Start with getting all notifications for your user.
