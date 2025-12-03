# Services Moduli - Xizmatlar

## Umumiy Ma'lumot

Bu modul email yuborish, bildirishnomalar va analitika xizmatlarini tavsiflaydi.

## Email Service

### services/email.py

```python
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from app.config.settings import settings
import logging

logger = logging.getLogger("smart-city")

class EmailService:
    """
    Email yuborish xizmati
    """
    
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USER
        self.password = settings.SMTP_PASS
        self.from_email = settings.FROM_EMAIL
        self.use_tls = settings.SMTP_SECURE
    
    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Email yuborish
        """
        try:
            message = MIMEMultipart("alternative")
            message["From"] = self.from_email
            message["To"] = to
            message["Subject"] = subject
            
            if cc:
                message["Cc"] = ", ".join(cc)
            
            # Plain text
            message.attach(MIMEText(body, "plain", "utf-8"))
            
            # HTML (agar berilgan bo'lsa)
            if html:
                message.attach(MIMEText(html, "html", "utf-8"))
            
            # Recipients
            recipients = [to]
            if cc:
                recipients.extend(cc)
            if bcc:
                recipients.extend(bcc)
            
            # Send
            await aiosmtplib.send(
                message,
                hostname=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                use_tls=self.use_tls
            )
            
            logger.info(f"Email sent to {to}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {str(e)}")
            return False
    
    async def send_appeal_confirmation(self, appeal: dict) -> bool:
        """
        Murojaat qabul qilinganligi haqida xabar
        """
        if not appeal.get("email"):
            return False
        
        subject = f"Murojaatingiz qabul qilindi - #{appeal['_id']}"
        
        body = f"""
Hurmatli {appeal['firstName']} {appeal['lastName']},

Sizning murojaatingiz muvaffaqiyatli qabul qilindi.

Murojaat raqami: {appeal['_id']}
Sarlavha: {appeal['title']}
Sektor: {appeal['sector']}
Holat: Ochiq

Murojaatingiz ko'rib chiqiladi va sizga javob beriladi.

Hurmat bilan,
Smart City jamoasi
        """
        
        html = f"""
<html>
<body style="font-family: Arial, sans-serif;">
    <h2>Murojaatingiz qabul qilindi</h2>
    <p>Hurmatli {appeal['firstName']} {appeal['lastName']},</p>
    <p>Sizning murojaatingiz muvaffaqiyatli qabul qilindi.</p>
    
    <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Murojaat raqami:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{appeal['_id']}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Sarlavha:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{appeal['title']}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Sektor:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">{appeal['sector']}</td>
        </tr>
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Holat:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: green;">Ochiq</td>
        </tr>
    </table>
    
    <p>Murojaatingiz ko'rib chiqiladi va sizga javob beriladi.</p>
    
    <p>Hurmat bilan,<br>Smart City jamoasi</p>
</body>
</html>
        """
        
        return await self.send_email(appeal["email"], subject, body, html)
    
    async def send_status_update(self, appeal: dict, old_status: str) -> bool:
        """
        Murojaat holati o'zgarganligi haqida xabar
        """
        if not appeal.get("email"):
            return False
        
        status_names = {
            "open": "Ochiq",
            "in_progress": "Jarayonda",
            "waiting_response": "Javob kutilmoqda",
            "closed": "Yopilgan",
            "rejected": "Rad etilgan"
        }
        
        subject = f"Murojaat holati yangilandi - #{appeal['_id']}"
        
        body = f"""
Hurmatli {appeal['firstName']} {appeal['lastName']},

Sizning murojaatingiz holati yangilandi.

Murojaat raqami: {appeal['_id']}
Oldingi holat: {status_names.get(old_status, old_status)}
Yangi holat: {status_names.get(appeal['status'], appeal['status'])}

{f"Admin javobi: {appeal.get('adminResponse', {}).get('message', '')}" if appeal.get('adminResponse') else ""}

Hurmat bilan,
Smart City jamoasi
        """
        
        return await self.send_email(appeal["email"], subject, body)

# Singleton instance
email_service = EmailService()
```

## Notification Service

### services/notification.py

```python
import asyncio
from datetime import datetime
from typing import Optional
from app.services.email import email_service
from app.config.database import mongo
from app.config.sectorAdmins import SECTOR_ADMIN_EMAILS
import logging

logger = logging.getLogger("smart-city")

class NotificationService:
    """
    Bildirishnomalar xizmati
    """
    
    async def process_new_appeal(self, appeal: dict) -> dict:
        """
        Yangi murojaat uchun bildirishnomalar
        """
        results = {
            "user_notification": False,
            "admin_notification": False
        }
        
        try:
            # Foydalanuvchiga xabar
            if appeal.get("email"):
                results["user_notification"] = await email_service.send_appeal_confirmation(appeal)
            
            # Sektor adminga xabar
            sector = appeal.get("sector")
            if sector and sector in SECTOR_ADMIN_EMAILS:
                admin_email = SECTOR_ADMIN_EMAILS[sector]
                results["admin_notification"] = await self._notify_sector_admin(
                    admin_email, appeal
                )
            
            logger.info(f"Notifications processed for appeal {appeal['_id']}: {results}")
            
        except Exception as e:
            logger.error(f"Error processing notifications: {str(e)}")
        
        return results
    
    async def process_status_update(self, appeal: dict, old_status: str) -> dict:
        """
        Holat o'zgarishi uchun bildirishnomalar
        """
        results = {
            "user_notification": False
        }
        
        try:
            if appeal.get("email"):
                results["user_notification"] = await email_service.send_status_update(
                    appeal, old_status
                )
            
            logger.info(f"Status update notification for appeal {appeal['_id']}: {results}")
            
        except Exception as e:
            logger.error(f"Error processing status update notification: {str(e)}")
        
        return results
    
    async def _notify_sector_admin(self, admin_email: str, appeal: dict) -> bool:
        """
        Sektor adminga yangi murojaat haqida xabar
        """
        subject = f"Yangi murojaat - {appeal['sector']} sektori"
        
        body = f"""
Yangi murojaat kelib tushdi.

Murojaat raqami: {appeal['_id']}
Sarlavha: {appeal['title']}
Turi: {appeal['type']}
Ustuvorlik: {appeal['priority']}
Yuboruvchi: {appeal['firstName']} {appeal['lastName']}

Iltimos, murojaatni ko'rib chiqing.
        """
        
        return await email_service.send_email(admin_email, subject, body)
    
    async def health_check(self) -> dict:
        """
        Xizmat holatini tekshirish
        """
        return {
            "status": "healthy",
            "email_configured": bool(email_service.host and email_service.username),
            "timestamp": datetime.utcnow().isoformat()
        }

# Singleton instance
notification_service = NotificationService()
```

## Analytics Service

### services/analytics.py

```python
from datetime import datetime, timedelta
from typing import Optional
from app.config.database import mongo
import logging

logger = logging.getLogger("smart-city")

class AnalyticsService:
    """
    Analitika xizmati
    """
    
    async def get_dashboard_stats(self, period: int = 30, user_role: str = None) -> dict:
        """
        Dashboard uchun umumiy statistika
        """
        days_ago = datetime.utcnow() - timedelta(days=period)
        
        # Umumiy statistika
        total_appeals = await mongo.db.appeals.count_documents({
            "createdAt": {"$gte": days_ago}
        })
        
        # Holat bo'yicha
        status_pipeline = [
            {"$match": {"createdAt": {"$gte": days_ago}}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_stats = await mongo.db.appeals.aggregate(status_pipeline).to_list(10)
        
        # Kunlik trend
        daily_pipeline = [
            {"$match": {"createdAt": {"$gte": days_ago}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        daily_trend = await mongo.db.appeals.aggregate(daily_pipeline).to_list(100)
        
        # O'rtacha javob vaqti
        response_time_pipeline = [
            {
                "$match": {
                    "status": "closed",
                    "adminResponse.respondedAt": {"$exists": True}
                }
            },
            {
                "$project": {
                    "responseTime": {
                        "$subtract": ["$adminResponse.respondedAt", "$createdAt"]
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avgResponseTime": {"$avg": "$responseTime"}
                }
            }
        ]
        response_time = await mongo.db.appeals.aggregate(response_time_pipeline).to_list(1)
        
        avg_response_hours = 0
        if response_time:
            avg_response_hours = response_time[0]["avgResponseTime"] / (1000 * 60 * 60)
        
        return {
            "overview": {
                "totalAppeals": total_appeals,
                "period": f"{period} kun",
                "avgResponseTime": f"{avg_response_hours:.1f} soat"
            },
            "byStatus": {item["_id"]: item["count"] for item in status_stats},
            "dailyTrend": daily_trend
        }
    
    async def get_location_analytics(self, days: int = 30) -> dict:
        """
        Joylashuv bo'yicha analitika
        """
        days_ago = datetime.utcnow() - timedelta(days=days)
        
        pipeline = [
            {"$match": {"createdAt": {"$gte": days_ago}}},
            {
                "$group": {
                    "_id": "$location.district",
                    "count": {"$sum": 1},
                    "types": {"$push": "$type"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        location_stats = await mongo.db.appeals.aggregate(pipeline).to_list(100)
        
        return {
            "byDistrict": location_stats,
            "period": f"{days} kun"
        }
    
    async def get_performance_metrics(self, days: int = 30) -> dict:
        """
        Ishlash ko'rsatkichlari
        """
        days_ago = datetime.utcnow() - timedelta(days=days)
        
        # Yopilgan murojaatlar foizi
        total = await mongo.db.appeals.count_documents({"createdAt": {"$gte": days_ago}})
        closed = await mongo.db.appeals.count_documents({
            "createdAt": {"$gte": days_ago},
            "status": "closed"
        })
        
        closure_rate = (closed / total * 100) if total > 0 else 0
        
        # O'rtacha baho
        rating_pipeline = [
            {"$match": {"rating.score": {"$exists": True}}},
            {
                "$group": {
                    "_id": None,
                    "avgRating": {"$avg": "$rating.score"},
                    "totalRatings": {"$sum": 1}
                }
            }
        ]
        rating_stats = await mongo.db.appeals.aggregate(rating_pipeline).to_list(1)
        
        return {
            "closureRate": f"{closure_rate:.1f}%",
            "totalProcessed": closed,
            "totalReceived": total,
            "avgRating": rating_stats[0]["avgRating"] if rating_stats else 0,
            "totalRatings": rating_stats[0]["totalRatings"] if rating_stats else 0,
            "period": f"{days} kun"
        }
    
    async def get_user_engagement(self, days: int = 30) -> dict:
        """
        Foydalanuvchi faolligi
        """
        days_ago = datetime.utcnow() - timedelta(days=days)
        
        # Takroriy murojaatlar
        repeat_pipeline = [
            {"$match": {"createdAt": {"$gte": days_ago}}},
            {"$group": {"_id": "$email", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}},
            {"$count": "repeatUsers"}
        ]
        repeat_users = await mongo.db.appeals.aggregate(repeat_pipeline).to_list(1)
        
        # Murojaat turlari
        type_pipeline = [
            {"$match": {"createdAt": {"$gte": days_ago}}},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}}
        ]
        type_stats = await mongo.db.appeals.aggregate(type_pipeline).to_list(10)
        
        return {
            "repeatUsers": repeat_users[0]["repeatUsers"] if repeat_users else 0,
            "byType": {item["_id"]: item["count"] for item in type_stats},
            "period": f"{days} kun"
        }
    
    async def generate_analytics_report(
        self,
        report_type: str,
        start_date: datetime,
        end_date: datetime,
        options: dict = None
    ) -> dict:
        """
        Batafsil hisobot yaratish
        """
        filter_query = {
            "createdAt": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        
        # Umumiy statistika
        total = await mongo.db.appeals.count_documents(filter_query)
        
        # Holat bo'yicha
        status_pipeline = [
            {"$match": filter_query},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        by_status = await mongo.db.appeals.aggregate(status_pipeline).to_list(10)
        
        # Sektor bo'yicha
        sector_pipeline = [
            {"$match": filter_query},
            {"$group": {"_id": "$sector", "count": {"$sum": 1}}}
        ]
        by_sector = await mongo.db.appeals.aggregate(sector_pipeline).to_list(20)
        
        # Ustuvorlik bo'yicha
        priority_pipeline = [
            {"$match": filter_query},
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
        ]
        by_priority = await mongo.db.appeals.aggregate(priority_pipeline).to_list(10)
        
        return {
            "reportType": report_type,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "totalAppeals": total
            },
            "breakdown": {
                "byStatus": {item["_id"]: item["count"] for item in by_status},
                "bySector": {item["_id"]: item["count"] for item in by_sector},
                "byPriority": {item["_id"]: item["count"] for item in by_priority}
            },
            "generatedAt": datetime.utcnow().isoformat()
        }

# Singleton instance
analytics_service = AnalyticsService()
```

## Sector Admin Emails Configuration

### config/sectorAdmins.py

```python
# Sektor adminlarining email manzillari
SECTOR_ADMIN_EMAILS = {
    "infrastructure": "infrastructure@smartcity.uz",
    "environment": "environment@smartcity.uz",
    "ecology": "ecology@smartcity.uz",
    "transport": "transport@smartcity.uz",
    "health": "health@smartcity.uz",
    "education": "education@smartcity.uz",
    "social": "social@smartcity.uz",
    "economic": "economic@smartcity.uz",
    "utilities": "utilities@smartcity.uz",
    "other": "admin@smartcity.uz"
}

# Yoki environment variable'dan olish
import os

def get_sector_admin_email(sector: str) -> str:
    """
    Sektor admin emailini olish
    """
    env_key = f"SECTOR_ADMIN_EMAIL_{sector.upper()}"
    return os.getenv(env_key, SECTOR_ADMIN_EMAILS.get(sector, "admin@smartcity.uz"))
```

## Xizmatlarni Ishlatish

### Controller'da ishlatish

```python
from app.services.notification import notification_service
from app.services.analytics import analytics_service
from app.services.email import email_service
import asyncio

class AppealsController:
    
    async def create_appeal(self, request):
        # ... appeal yaratish logikasi
        
        # Bildirishnomalarni asinxron yuborish
        asyncio.create_task(
            notification_service.process_new_appeal(appeal)
        )
        
        return {"success": True, "data": appeal}
    
    async def get_dashboard(self, period: int):
        stats = await analytics_service.get_dashboard_stats(period)
        return {"success": True, "data": stats}
```
