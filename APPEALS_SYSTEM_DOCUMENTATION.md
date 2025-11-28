# Smart City Appeals System - Complete Documentation

## Overview

The appeals system has been completely redesigned and enhanced to provide a comprehensive solution for citizen complaints, suggestions, and requests. This system now includes advanced features such as email notifications, analytics, reporting, and automated follow-up mechanisms.

## Features Added

### 1. Enhanced Data Model
- **Comprehensive Appeal Schema** with validation
- **Personal Information**: First name, last name, email, phone
- **Appeal Classification**: Type, category, priority levels
- **Status Tracking**: Multiple status options (open, in_progress, waiting_response, closed, rejected)
- **Admin Response System**: Track who responded and when
- **Location Data**: District, address, coordinates
- **File Attachments**: Support for multiple file uploads
- **Follow-up Tracking**: Schedule and track follow-up actions
- **Rating System**: User satisfaction ratings after resolution
- **Metadata**: IP address, user agent, view count

### 2. Advanced Notification System
- **Email Notifications**: Automated emails for all important events
- **User Confirmations**: When appeal is submitted
- **Admin Alerts**: When new appeals arrive
- **Status Updates**: When appeal status changes
- **Follow-up Reminders**: Automated reminders for overdue appeals
- **Daily Summaries**: Daily reports for administrators
- **SLA Alerts**: Notifications when appeals approach SLA limits

### 3. Comprehensive Analytics
- **Dashboard Statistics**: Real-time overview of all appeals
- **Trend Analysis**: Daily, weekly, monthly trends
- **Performance Metrics**: Response times, resolution rates
- **User Engagement**: Satisfaction ratings, repeat users
- **Location Analytics**: Geographic distribution of appeals
- **Export Functionality**: CSV export for external analysis

### 4. Advanced Admin Features
- **Bulk Operations**: Update multiple appeals at once
- **Advanced Filtering**: Filter by multiple criteria
- **Search Functionality**: Full-text search across all fields
- **Role-based Access**: Different permissions for different user roles
- **Audit Trail**: Track all changes and actions
- **Health Monitoring**: System health checks and alerts

## API Endpoints

### Public Endpoints

#### Create New Appeal
```
POST /api/sectors/appeals
Content-Type: application/json

{
  "firstName": "Ali",
  "lastName": "Valiyev",
  "email": "ali@example.com",
  "phone": "+998901234567",
  "title": "Yo'l chetidagi chiroqlar ishlamaydi",
  "message": "Bizning mahalla yo'l chetidagi chiroqlar bir necha kundan beri ishlamayapti...",
  "type": "complaint",
  "category": "infrastructure",
  "priority": "high",
  "location": {
    "district": "Chilanzar",
    "address": "Amir Temur ko'chasi, 123-uy",
    "coordinates": {
      "latitude": 41.2995,
      "longitude": 69.2401
    }
  }
}
```

#### Get All Appeals (with filters)
```
GET /api/sectors/appeals?status=open&type=complaint&priority=high&page=1&limit=10&search=yo'l&sortBy=createdAt&sortOrder=desc
```

#### Get Single Appeal
```
GET /api/sectors/appeals/:id
```

#### Rate Appeal
```
POST /api/sectors/appeals/:id/rate
Content-Type: application/json

{
  "score": 5,
  "feedback": "Muammo tezda hal qilindi, rahmat!"
}
```

#### Get User's Appeals
```
GET /api/sectors/appeals/my?email=user@example.com
```

### Admin Endpoints

#### Update Appeal Status
```
PUT /api/sectors/appeals/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "adminResponse": "Murojaatingiz ko'rib chiqilmoqda, tez orada natija bo'ladi.",
  "followUpRequired": true,
  "followUpDate": "2025-12-01"
}
```

#### Delete Appeal
```
DELETE /api/sectors/appeals/:id
Authorization: Bearer <token>
```

#### Get Dashboard Analytics
```
GET /api/sectors/appeals/admin/dashboard?period=30
Authorization: Bearer <token>
```

#### Get Location Analytics
```
GET /api/sectors/appeals/admin/location?days=30
Authorization: Bearer <token>
```

#### Get Performance Metrics
```
GET /api/sectors/appeals/admin/performance?days=30
Authorization: Bearer <token>
```

#### Get User Engagement
```
GET /api/sectors/appeals/admin/engagement?days=30
Authorization: Bearer <token>
```

#### Generate Report
```
GET /api/sectors/appeals/admin/report?type=weekly&startDate=2025-11-01&endDate=2025-11-30
Authorization: Bearer <token>
```

#### Export Appeals
```
GET /api/sectors/appeals/admin/export?status=open&format=csv
Authorization: Bearer <token>
```

#### Bulk Update Status
```
PATCH /api/sectors/appeals/admin/bulk-status
Authorization: Bearer <token>
Content-Type: application/json

{
  "appealIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "status": "closed",
  "adminResponse": "Barcha murojaatlar hal qilindi."
}
```

#### Get Follow-up Appeals
```
GET /api/sectors/appeals/admin/follow-up?priority=high&daysOverdue=7
Authorization: Bearer <token>
```

#### Notification Health Check
```
GET /api/sectors/appeals/admin/notification-health
Authorization: Bearer <token>
```

## Data Models

### Appeal Schema

```javascript
{
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: false, trim: true, lowercase: true },
  phone: { type: String, required: false, trim: true },
  
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  
  type: { 
    type: String, 
    required: true, 
    enum: ['complaint', 'suggestion', 'question', 'request', 'appreciation', 'other'] 
  },
  category: { 
    type: String, 
    required: true, 
    enum: ['infrastructure', 'environment', 'transport', 'health', 'education', 'social', 'economic', 'other'] 
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'waiting_response', 'closed', 'rejected'], 
    default: 'open' 
  },
  
  adminResponse: {
    message: { type: String, maxlength: 1000 },
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date }
  },
  
  location: {
    district: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now }
  }],
  
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  
  ipAddress: String,
  userAgent: String,
  viewCount: { type: Number, default: 0 },
  
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedAt: Date
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## Notification Templates

### Email Templates
1. **Appeal Confirmation** - Sent to user when appeal is submitted
2. **Admin Notification** - Sent to admin when new appeal arrives
3. **Status Update** - Sent to user when appeal status changes
4. **Follow-up Reminder** - Sent to user about follow-up actions
5. **Daily Summary** - Sent to admin with daily statistics

### Scheduled Notifications
- **Hourly**: Follow-up reminders check
- **Daily (8 AM)**: Daily summary to admin
- **Every 30 minutes**: Urgent appeals processing
- **Every 4 hours**: SLA alerts check

## Analytics and Reporting

### Dashboard Metrics
- Total appeals count
- Appeals by status, type, category, priority
- Growth trends
- Average response time
- User satisfaction ratings
- Recent activity

### Location Analytics
- Appeals distribution by district
- Geographic heat mapping
- Coordinates-based clustering
- Average priority by location

### Performance Metrics
- Average resolution time
- Average response time
- Backlog statistics
- SLA compliance rates

### User Engagement
- Unique vs repeat users
- User satisfaction scores
- Rating distributions
- Resolution satisfaction

## Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/smartcity

# Server
PORT=3000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@smartcity.uz
ADMIN_EMAIL=admin@smartcity.uz

# Frontend URLs
ADMIN_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080

# Environment
NODE_ENV=development
```

## Security Features

### Validation
- Input validation for all endpoints
- Email format validation
- Phone number format validation
- MongoDB ObjectId validation
- Length and format checks

### Authentication
- JWT-based authentication
- Role-based access control
- Admin-only endpoints protection
- API key validation

### Rate Limiting
- Request rate limiting
- Bulk operation restrictions
- Search query limitations

### Data Protection
- IP address logging for security
- User agent tracking
- Input sanitization
- SQL injection prevention

## Installation and Setup

1. **Install Dependencies**
```bash
npm install express-validator nodemailer
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Make sure MongoDB is running
mongod
```

4. **Start Application**
```bash
npm start
# or for development
npm run dev
```

5. **Create Super Admin**
```bash
node seed.js
```

## API Testing Examples

### Create Appeal via cURL
```bash
curl -X POST http://localhost:3000/api/sectors/appeals \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ali",
    "lastName": "Valiyev",
    "email": "ali@example.com",
    "phone": "+998901234567",
    "title": "Yo'l chetidagi chiroqlar ishlamaydi",
    "message": "Bizning mahalla yo'l chetidagi chiroqlar bir necha kundan beri ishlamayapti...",
    "type": "complaint",
    "category": "infrastructure",
    "priority": "high"
  }'
```

### Get Dashboard Stats
```bash
curl -X GET "http://localhost:3000/api/sectors/appeals/admin/dashboard?period=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Monitoring and Maintenance

### Health Checks
- Server health endpoint
- Database connection check
- Email service connectivity
- Notification service status

### Logging
- Request/response logging
- Error tracking
- Performance monitoring
- User action audit logs

### Maintenance Tasks
- Automated cleanup of old data
- Database optimization
- Log rotation
- Performance monitoring

## Best Practices

### Data Management
- Regular database backups
- Data archiving for old appeals
- Index optimization
- Query performance monitoring

### Security
- Regular security updates
- API key rotation
- Access log monitoring
- Vulnerability assessments

### Performance
- Database indexing strategy
- Caching implementation
- Query optimization
- Resource monitoring

## Troubleshooting

### Common Issues

1. **Email notifications not working**
   - Check SMTP configuration
   - Verify email credentials
   - Test email service connectivity

2. **Analytics data not loading**
   - Check database connection
   - Verify query indexes
   - Review aggregation pipeline

3. **Notifications not sending**
   - Check notification service status
   - Verify scheduled tasks running
   - Review error logs

### Debug Mode
```bash
NODE_ENV=development DEBUG=* npm start
```

### Log Analysis
```bash
# View recent logs
tail -f logs/app.log

# Check error logs
grep "ERROR" logs/app.log | tail -20
```

## Future Enhancements

### Planned Features
1. **Mobile App Integration**
   - Push notifications
   - Location-based services
   - Photo upload from mobile

2. **Advanced Analytics**
   - Machine learning predictions
   - Sentiment analysis
   - Automated categorization

3. **Integration Capabilities**
   - Third-party API integrations
   - Webhook support
   - Real-time notifications

4. **Enhanced UI/UX**
   - Interactive dashboards
   - Real-time updates
   - Mobile-responsive design

### Scalability Improvements
1. **Database Optimization**
   - Sharding implementation
   - Read replicas
   - Connection pooling

2. **Caching Layer**
   - Redis integration
   - Query result caching
   - Session management

3. **Load Balancing**
   - Multiple server instances
   - Load balancer configuration
   - Auto-scaling setup

## Support and Contact

For technical support or questions about the appeals system:

- **Documentation**: Check this file and API documentation
- **Issues**: Review error logs and debugging section
- **Performance**: Monitor health checks and metrics
- **Security**: Follow security best practices

## License

This project is part of the Smart City platform and follows the same licensing terms.

---

**Last Updated**: November 28, 2025  
**Version**: 2.0.0  
**Author**: Smart City Development Team