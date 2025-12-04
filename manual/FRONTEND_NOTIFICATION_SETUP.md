# Frontend Notification System Setup Guide

## 📱 Complete Notification System for Mobile Apps & Websites

This guide shows you how to integrate the backend notification system with your frontend applications.

## 🚀 Quick Start (Vanilla JavaScript)

### 1. Basic HTML Structure
```html
<!DOCTYPE html>
<html>
<head>
    <title>Smart City Notifications</title>
    <style>
        .notification-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .notification-card.new { border-left: 4px solid #007bff; }
        .notification-card.success { border-left: 4px solid #28a745; opacity: 0.8; }
        .badge { background: #007bff; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    </style>
</head>
<body>
    <div id="notifications-container">
        <h2>Notifications</h2>
        <button onclick="loadNotifications()">Refresh</button>
        <div id="notifications"></div>
    </div>

    <script src="notification-service.js"></script>
    <script>
        // Load notifications on page load
        loadNotifications();
        
        // Auto-refresh every 5 minutes
        setInterval(loadNotifications, 5 * 60 * 1000);
        
        async function loadNotifications() {
            try {
                const response = await fetch('https://api.smart-city-qarshi.uz/api/notifications/mobile');
                const data = await response.json();
                
                const container = document.getElementById('notifications');
                container.innerHTML = data.data.map(notification => `
                    <div class="notification-card ${notification.status}">
                        <h3>${notification.title}</h3>
                        <p>${notification.message}</p>
                        <small>${formatDate(notification.created_at)}</small>
                        ${notification.status === 'new' ? '<span class="badge">NEW</span>' : ''}
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error loading notifications:', error);
            }
        }
        
        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
            
            if (diffInHours < 1) return 'Just now';
            if (diffInHours < 24) return `${diffInHours}h ago`;
            return date.toLocaleDateString();
        }
    </script>
</body>
</html>
```

## 🔧 API Service (JavaScript)

### notification-service.js
```javascript
class NotificationService {
  constructor() {
    this.baseUrl = 'https://api.smart-city-qarshi.uz/api';
  }

  // For mobile apps - no user authentication required
  async getMobileNotifications() {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/mobile`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching mobile notifications:', error);
      throw error;
    }
  }

  // For websites with user authentication
  async getUserNotifications(userId) {
    try {
      const url = userId 
        ? `${this.baseUrl}/notifications?user_id=${userId}`
        : `${this.baseUrl}/notifications`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read (manual)
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

// Export for use
const notificationService = new NotificationService();
```

## ⚛️ React Implementation

### 1. Custom Hook
```javascript
import { useState, useEffect } from 'react';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getUserNotifications(userId);
      setNotifications(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  return { notifications, loading, error, refresh: loadNotifications };
};
```

### 2. Component
```javascript
import React from 'react';
import { useNotifications } from './hooks/useNotifications';

const NotificationList = ({ userId }) => {
  const { notifications, loading, error, refresh } = useNotifications(userId);

  if (loading) return <div>Loading notifications...</div>;
  if (error) return <div>Error: {error}</div>;
  if (notifications.length === 0) return <div>No notifications</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      {notifications.map(notification => (
        <div key={notification._id} className="notification-card">
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <small>{new Date(notification.created_at).toLocaleString()}</small>
          {notification.status === 'new' && <span className="badge">NEW</span>}
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
```

## 🎯 Vue.js Implementation

### 1. Composition API
```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export const useNotifications = (userId) => {
  const notifications = ref([]);
  const loading = ref(true);
  const error = ref(null);

  const loadNotifications = async () => {
    try {
      loading.value = true;
      error.value = null;
      const response = await notificationService.getUserNotifications(userId);
      notifications.value = response.data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    loadNotifications();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    onUnmounted(() => clearInterval(interval));
  });

  return { notifications, loading, error, refresh: loadNotifications };
};
```

### 2. Component
```vue
<template>
  <div class="notifications">
    <button @click="refresh">Refresh</button>
    <div v-if="loading">Loading notifications...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="notifications.length === 0">No notifications</div>
    <div v-else>
      <div 
        v-for="notification in notifications" 
        :key="notification._id" 
        class="notification-card"
      >
        <h3>{{ notification.title }}</h3>
        <p>{{ notification.message }}</p>
        <small>{{ new Date(notification.created_at).toLocaleString() }}</small>
        <span v-if="notification.status === 'new'" class="badge">NEW</span>
      </div>
    </div>
  </div>
</template>

<script>
import { useNotifications } from './composables/useNotifications';

export default {
  name: 'NotificationList',
  props: {
    userId: String
  },
  setup(props) {
    const { notifications, loading, error, refresh } = useNotifications(props.userId);
    
    return {
      notifications,
      loading,
      error,
      refresh
    };
  }
};
</script>
```

## 📱 Mobile App Integration

### React Native
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.smart-city-qarshi.uz/api/notifications/mobile');
      const data = await response.json();
      setNotifications(data.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderNotification = ({ item }) => (
    <View style={styles.notificationCard}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
      {item.status === 'new' && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NEW</Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={notifications}
      renderItem={renderNotification}
      keyExtractor={item => item._id}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadNotifications} />
      }
    />
  );
};
```

### Flutter
```dart
import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:io';

class NotificationScreen extends StatefulWidget {
  @override
  _NotificationScreenState createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  List<dynamic> notifications = [];
  bool loading = true;

  Future<void> loadNotifications() async {
    try {
      setState(() => loading = true);
      final response = await HttpClient().getUrl(Uri.parse('https://api.smart-city-qarshi.uz/api/notifications/mobile'));
      final contents = await response.close();
      final responseBody = await contents.transform(utf8.decoder).join();
      final data = json.decode(responseBody);
      
      setState(() {
        notifications = data['data'];
        loading = false;
      });
    } catch (e) {
      print('Error loading notifications: $e');
      setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    loadNotifications();
    
    // Auto-refresh every 5 minutes
    Timer.periodic(Duration(minutes: 5), (timer) {
      loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Notifications'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: loadNotifications,
          ),
        ],
      ),
      body: loading 
        ? Center(child: CircularProgressIndicator())
        : notifications.isEmpty 
          ? Center(child: Text('No notifications'))
          : ListView.builder(
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return Card(
                  child: ListTile(
                    title: Text(notification['title']),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(notification['message']),
                        Text(
                          DateTime.parse(notification['created_at']).toLocal().toString(),
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                    trailing: notification['status'] == 'new' 
                      ? Chip(label: Text('NEW'), backgroundColor: Colors.blue)
                      : null,
                  ),
                );
              },
            ),
    );
  }
}
```

## 🔐 Admin Panel Integration

### Creating Notifications
```javascript
// Admin function to create notifications
async function createNotification(title, message, userIds = null) {
  try {
    const response = await fetch('https://api.smart-city-qarshi.uz/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers here
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title,
        message,
        user_ids: userIds // null = send to all users, or array of user IDs
      })
    });
    
    const data = await response.json();
    console.log('Notification created:', data);
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Usage examples
// Send to all users
createNotification('System Update', 'The system will be updated tonight');

// Send to specific users
createNotification('Profile Update Required', 'Please update your profile', ['user1', 'user2']);
```

## 📊 API Endpoints Reference

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/notifications/mobile` | GET | Get notifications for mobile apps | No |
| `/api/notifications` | GET | Get user notifications | No* |
| `/api/notifications` | POST | Create notification (Admin) | Yes |
| `/api/notifications/:id` | PATCH | Mark notification as read | No* |
| `/api/notifications/admin/all` | GET | Admin: Get all notifications | Yes |

*No authentication required, but can be added based on your needs

## 🎨 Styling Tips

### CSS Classes
```css
.notification-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.notification-card.new {
  border-left: 4px solid #007bff;
}

.notification-card.success {
  border-left: 4px solid #28a745;
  opacity: 0.9;
}

.notification-title {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.notification-message {
  margin: 0 0 12px 0;
  color: #666;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.badge {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.badge.success {
  background: #6c757d;
}
```

## 🚀 Performance Tips

1. **Caching**: Cache notifications for 5 minutes to reduce API calls
2. **Pagination**: For large datasets, use the admin endpoint with pagination
3. **Error Handling**: Always handle network errors gracefully
4. **Loading States**: Show loading spinners during API calls
5. **Offline Support**: Consider local storage for offline viewing

## 🔄 Auto-Refresh Setup

```javascript
// Auto-refresh every 5 minutes
setInterval(() => {
  loadNotifications();
}, 5 * 60 * 1000);

// Refresh on app resume (for mobile apps)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadNotifications();
  }
});
```

Your notification system is now ready for integration with any frontend framework! 🎉