# Appeals Moduli - Murojaatlar Tizimi

## Umumiy Ma'lumot

Appeals moduli fuqarolarning murojaatlarini qabul qilish, ko'rish, boshqarish va statistika olish funksiyalarini ta'minlaydi. Bu tizimning asosiy moduli hisoblanadi.

## API Endpoints

### Public Endpoints (Autentifikatsiyasiz)

#### 1. Create Appeal (Murojaat yaratish)
```
POST /api/sectors/appeals
```

**Request Body:**
```json
{
  "firstName": "Alisher",
  "lastName": "Navoiy",
  "email": "alisher@example.com",
  "phone": "+998901234567",
  "title": "Yo'l ta'mirlash kerak",
  "message": "Chilonzor tumanida yo'l buzilgan, ta'mirlash kerak",
  "type": "complaint",
  "sector": "infrastructure",
  "priority": "high",
  "location": {
    "district": "Chilonzor",
    "address": "Bunyodkor ko'chasi 15",
    "coordinates": {
      "latitude": 41.3111,
      "longitude": 69.2401
    }
  }
}
```

**Type qiymatlari:**
- `complaint` - Shikoyat
- `suggestion` - Taklif
- `question` - Savol
- `request` - So'rov
- `appreciation` - Minnatdorchilik
- `other` - Boshqa

**Sector qiymatlari:**
- `infrastructure` - Infrastruktura
- `environment` - Atrof-muhit
- `ecology` - Ekologiya
- `transport` - Transport
- `health` - Sog'liqni saqlash
- `education` - Ta'lim
- `social` - Ijtimoiy
- `economic` - Iqtisodiy
- `other` - Boshqa

**Priority qiymatlari:**
- `low` - Past
- `medium` - O'rta (default)
- `high` - Yuqori
- `urgent` - Shoshilinch

**Response (201):**
```json
{
  "success": true,
  "message": "Murojaatingiz muvaffaqiyatli yuborildi",
  "data": {
    "id": "appeal_id",
    "referenceNumber": "appeal_id",
    "status": "open",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Get All Appeals (Barcha murojaatlar)
```
GET /api/sectors/appeals?page=1&limit=10&status=open&type=complaint&sector=infrastructure&priority=high&search=yo'l&sortBy=createdAt&sortOrder=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "appeal_id",
      "firstName": "Alisher",
      "lastName": "Navoiy",
      "email": "alisher@example.com",
      "title": "Yo'l ta'mirlash kerak",
      "message": "...",
      "type": "complaint",
      "sector": "infrastructure",
      "priority": "high",
      "status": "open",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalCount": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### 3. Get Appeal by ID
```
GET /api/sectors/appeals/:id
```

#### 4. Get My Appeals (O'z murojaatlarim)
```
GET /api/sectors/appeals/my?email=user@example.com
```

#### 5. Rate Appeal (Murojaat baholash)
```
POST /api/sectors/appeals/:id/rate
```

**Request Body:**
```json
{
  "score": 5,
  "feedback": "Juda yaxshi xizmat ko'rsatildi"
}
```

### Protected Endpoints (Admin uchun)

#### 6. Get Available Sectors
```
GET /api/sectors/appeals/sectors
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Mavjud sektorlar va ularning statistikalari",
  "data": {
    "sectors": [
      {
        "sector": "infrastructure",
        "sectorName": "Infrastruktura",
        "counts": {
          "total": 50,
          "open": 20,
          "inProgress": 15,
          "closed": 15
        },
        "percentage": {
          "open": "40.0",
          "inProgress": "30.0",
          "closed": "30.0"
        }
      }
    ],
    "userAccess": {
      "role": "admin",
      "sector": "all",
      "canAccessAll": true,
      "sectorRestricted": false
    }
  }
}
```

#### 7. Get Sector Admin Appeals
```
GET /api/sectors/appeals/sector-appeals/:sector?page=1&limit=10
Authorization: Bearer <token>
```

#### 8. Update Appeal Status
```
PUT /api/sectors/appeals/:id/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "in_progress",
  "adminResponse": "Murojaatingiz ko'rib chiqilmoqda",
  "followUpRequired": true,
  "followUpDate": "2024-01-15"
}
```

**Status qiymatlari:**
- `open` - Ochiq
- `in_progress` - Jarayonda
- `waiting_response` - Javob kutilmoqda
- `closed` - Yopilgan
- `rejected` - Rad etilgan

#### 9. Delete Appeal
```
DELETE /api/sectors/appeals/:id
Authorization: Bearer <token>
```

#### 10. Get Statistics
```
GET /api/sectors/appeals/admin/statistics?period=30
Authorization: Bearer <token>
```

#### 11. Export Appeals
```
GET /api/sectors/appeals/admin/export?format=csv&status=open
Authorization: Bearer <token>
```

#### 12. Dashboard Analytics
```
GET /api/sectors/appeals/admin/dashboard?period=30
Authorization: Bearer <token>
```

#### 13. Location Analytics
```
GET /api/sectors/appeals/admin/location?days=30
Authorization: Bearer <token>
```

#### 14. Performance Metrics
```
GET /api/sectors/appeals/admin/performance?days=30
Authorization: Bearer <token>
```

#### 15. User Engagement
```
GET /api/sectors/appeals/admin/engagement?days=30
Authorization: Bearer <token>
```

#### 16. Generate Report
```
GET /api/sectors/appeals/admin/report?type=monthly&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### 17. Follow-up Appeals
```
GET /api/sectors/appeals/admin/follow-up?priority=high&daysOverdue=7
Authorization: Bearer <token>
```

#### 18. Bulk Update Status
```
PATCH /api/sectors/appeals/admin/bulk-status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "appealIds": ["id1", "id2", "id3"],
  "status": "closed",
  "adminResponse": "Barcha murojaatlar ko'rib chiqildi"
}
```

## Python Implementation

### routes/appeals.py
```python
from fastapi import APIRouter, Depends, Query, Path
from typing import Optional, List
from app.schemas.appeal import (
    AppealCreate, AppealResponse, AppealListResponse,
    StatusUpdate, RatingRequest, BulkStatusUpdate
)
from app.controllers.appeals import AppealsController
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/sectors/appeals", tags=["Appeals"])

# Public routes
@router.post("/", response_model=AppealResponse, status_code=201)
async def create_appeal(request: AppealCreate):
    return await AppealsController.create_appeal(request)

@router.get("/", response_model=AppealListResponse)
async def get_appeals(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    type: Optional[str] = None,
    sector: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    sortBy: str = "createdAt",
    sortOrder: str = "desc"
):
    return await AppealsController.get_appeals(
        page, limit, status, type, sector, priority, search, sortBy, sortOrder
    )

@router.get("/my")
async def get_my_appeals(email: str = Query(...)):
    return await AppealsController.get_my_appeals(email)

@router.get("/{appeal_id}")
async def get_appeal_by_id(appeal_id: str = Path(...)):
    return await AppealsController.get_appeal_by_id(appeal_id)

@router.post("/{appeal_id}/rate")
async def rate_appeal(
    appeal_id: str = Path(...),
    request: RatingRequest = ...
):
    return await AppealsController.rate_appeal(appeal_id, request)

# Protected routes
@router.get("/sectors")
async def get_available_sectors(current_user = Depends(get_current_user)):
    return await AppealsController.get_available_sectors(current_user)

@router.get("/sector-appeals/{sector}")
async def get_sector_appeals(
    sector: str = Path(...),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    return await AppealsController.get_sector_appeals(
        sector, page, limit, status, current_user
    )

@router.put("/{appeal_id}/status")
async def update_status(
    appeal_id: str = Path(...),
    request: StatusUpdate = ...,
    current_user = Depends(require_admin)
):
    return await AppealsController.update_status(appeal_id, request, current_user)

@router.delete("/{appeal_id}")
async def delete_appeal(
    appeal_id: str = Path(...),
    current_user = Depends(require_admin)
):
    return await AppealsController.delete_appeal(appeal_id, current_user)

@router.get("/admin/statistics")
async def get_statistics(
    period: int = Query(30, ge=1, le=365),
    current_user = Depends(require_admin)
):
    return await AppealsController.get_statistics(period)

@router.get("/admin/export")
async def export_appeals(
    format: str = Query("csv"),
    status: Optional[str] = None,
    current_user = Depends(require_admin)
):
    return await AppealsController.export_appeals(format, status)

@router.patch("/admin/bulk-status")
async def bulk_update_status(
    request: BulkStatusUpdate,
    current_user = Depends(require_admin)
):
    return await AppealsController.bulk_update_status(request, current_user)
```

### controllers/appeals.py
```python
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse
from app.config.database import db
import io
import csv

SECTOR_NAMES = {
    "infrastructure": "Infrastruktura",
    "environment": "Atrof-muhit",
    "ecology": "Ekologiya",
    "transport": "Transport",
    "health": "Sog'liqni saqlash",
    "education": "Ta'lim",
    "social": "Ijtimoiy",
    "economic": "Iqtisodiy",
    "other": "Boshqa"
}

class AppealsController:
    
    @staticmethod
    async def create_appeal(request):
        appeal_data = {
            "firstName": request.firstName,
            "lastName": request.lastName,
            "email": request.email,
            "phone": request.phone,
            "title": request.title,
            "message": request.message,
            "type": request.type,
            "sector": request.sector,
            "priority": request.priority or "medium",
            "status": "open",
            "location": request.location.dict() if request.location else None,
            "viewCount": 0,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.appeals.insert_one(appeal_data)
        
        # TODO: Send notification email asynchronously
        
        return {
            "success": True,
            "message": "Murojaatingiz muvaffaqiyatli yuborildi",
            "data": {
                "id": str(result.inserted_id),
                "referenceNumber": str(result.inserted_id),
                "status": "open",
                "createdAt": appeal_data["createdAt"]
            }
        }
    
    @staticmethod
    async def get_appeals(page, limit, status, type, sector, priority, search, sort_by, sort_order):
        filter_query = {}
        
        if status:
            filter_query["status"] = status
        if type:
            filter_query["type"] = type
        if sector:
            filter_query["sector"] = sector
        if priority:
            filter_query["priority"] = priority
        
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"message": {"$regex": search, "$options": "i"}},
                {"firstName": {"$regex": search, "$options": "i"}},
                {"lastName": {"$regex": search, "$options": "i"}}
            ]
        
        skip = (page - 1) * limit
        sort_direction = -1 if sort_order == "desc" else 1
        
        cursor = db.appeals.find(filter_query).skip(skip).limit(limit).sort(sort_by, sort_direction)
        appeals = await cursor.to_list(length=limit)
        
        total = await db.appeals.count_documents(filter_query)
        total_pages = (total + limit - 1) // limit
        
        # Convert ObjectId to string
        for appeal in appeals:
            appeal["_id"] = str(appeal["_id"])
        
        return {
            "success": True,
            "data": appeals,
            "pagination": {
                "currentPage": page,
                "totalPages": total_pages,
                "totalCount": total,
                "hasNextPage": page < total_pages,
                "hasPrevPage": page > 1
            }
        }
    
    @staticmethod
    async def get_appeal_by_id(appeal_id):
        try:
            appeal = await db.appeals.find_one({"_id": ObjectId(appeal_id)})
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Noto'g'ri ID format"
            )
        
        if not appeal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Murojaat topilmadi"
            )
        
        # Increment view count
        await db.appeals.update_one(
            {"_id": ObjectId(appeal_id)},
            {"$inc": {"viewCount": 1}}
        )
        
        appeal["_id"] = str(appeal["_id"])
        
        return {
            "success": True,
            "data": appeal
        }
    
    @staticmethod
    async def get_my_appeals(email):
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email manzili kerak"
            )
        
        cursor = db.appeals.find({"email": email}).sort("createdAt", -1)
        appeals = await cursor.to_list(length=100)
        
        for appeal in appeals:
            appeal["_id"] = str(appeal["_id"])
        
        return {
            "success": True,
            "data": appeals
        }
    
    @staticmethod
    async def rate_appeal(appeal_id, request):
        appeal = await db.appeals.find_one({"_id": ObjectId(appeal_id)})
        
        if not appeal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Murojaat topilmadi"
            )
        
        if appeal["status"] != "closed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faqat yopilgan murojaatlarni baholashingiz mumkin"
            )
        
        await db.appeals.update_one(
            {"_id": ObjectId(appeal_id)},
            {"$set": {
                "rating": {
                    "score": request.score,
                    "feedback": request.feedback,
                    "ratedAt": datetime.utcnow()
                }
            }}
        )
        
        return {
            "success": True,
            "message": "Baholash qo'shildi"
        }
    
    @staticmethod
    async def get_available_sectors(current_user):
        pipeline = [
            {
                "$group": {
                    "_id": "$sector",
                    "totalAppeals": {"$sum": 1},
                    "openAppeals": {
                        "$sum": {"$cond": [{"$eq": ["$status", "open"]}, 1, 0]}
                    },
                    "inProgressAppeals": {
                        "$sum": {"$cond": [{"$eq": ["$status", "in_progress"]}, 1, 0]}
                    },
                    "closedAppeals": {
                        "$sum": {"$cond": [{"$eq": ["$status", "closed"]}, 1, 0]}
                    }
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        sector_counts = await db.appeals.aggregate(pipeline).to_list(length=100)
        
        sectors_data = []
        for item in sector_counts:
            total = item["totalAppeals"]
            sectors_data.append({
                "sector": item["_id"],
                "sectorName": SECTOR_NAMES.get(item["_id"], item["_id"]),
                "counts": {
                    "total": total,
                    "open": item["openAppeals"],
                    "inProgress": item["inProgressAppeals"],
                    "closed": item["closedAppeals"]
                },
                "percentage": {
                    "open": f"{(item['openAppeals'] / total * 100):.1f}" if total > 0 else "0",
                    "inProgress": f"{(item['inProgressAppeals'] / total * 100):.1f}" if total > 0 else "0",
                    "closed": f"{(item['closedAppeals'] / total * 100):.1f}" if total > 0 else "0"
                }
            })
        
        # Filter by user sector if sector_admin
        if current_user["role"] == "sector_admin":
            sectors_data = [s for s in sectors_data if s["sector"] == current_user.get("sector")]
        
        return {
            "success": True,
            "message": "Mavjud sektorlar va ularning statistikalari",
            "data": {
                "sectors": sectors_data,
                "userAccess": {
                    "role": current_user["role"],
                    "sector": current_user.get("sector"),
                    "canAccessAll": current_user["role"] in ["super_admin", "admin"],
                    "sectorRestricted": current_user["role"] == "sector_admin"
                }
            }
        }
    
    @staticmethod
    async def update_status(appeal_id, request, current_user):
        appeal = await db.appeals.find_one({"_id": ObjectId(appeal_id)})
        
        if not appeal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Murojaat topilmadi"
            )
        
        update_data = {
            "status": request.status,
            "updatedAt": datetime.utcnow()
        }
        
        if request.adminResponse:
            update_data["adminResponse"] = {
                "message": request.adminResponse,
                "respondedBy": ObjectId(current_user["userId"]),
                "respondedAt": datetime.utcnow()
            }
        
        if request.followUpRequired is not None:
            update_data["followUpRequired"] = request.followUpRequired
        
        if request.followUpDate:
            update_data["followUpDate"] = request.followUpDate
        
        await db.appeals.update_one(
            {"_id": ObjectId(appeal_id)},
            {"$set": update_data}
        )
        
        # TODO: Send notification email
        
        return {
            "success": True,
            "message": "Murojaat holati yangilandi"
        }
    
    @staticmethod
    async def get_statistics(period):
        days_ago = datetime.utcnow() - timedelta(days=period)
        
        filter_query = {"createdAt": {"$gte": days_ago}}
        
        # Total appeals
        total = await db.appeals.count_documents(filter_query)
        
        # By status
        status_pipeline = [
            {"$match": filter_query},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_stats = await db.appeals.aggregate(status_pipeline).to_list(length=10)
        
        # By type
        type_pipeline = [
            {"$match": filter_query},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}}
        ]
        type_stats = await db.appeals.aggregate(type_pipeline).to_list(length=10)
        
        # By sector
        sector_pipeline = [
            {"$match": filter_query},
            {"$group": {"_id": "$sector", "count": {"$sum": 1}}}
        ]
        sector_stats = await db.appeals.aggregate(sector_pipeline).to_list(length=20)
        
        # Average rating
        rating_pipeline = [
            {"$match": {"rating.score": {"$exists": True}}},
            {"$group": {
                "_id": None,
                "avgRating": {"$avg": "$rating.score"},
                "totalRatings": {"$sum": 1}
            }}
        ]
        rating_stats = await db.appeals.aggregate(rating_pipeline).to_list(length=1)
        
        return {
            "success": True,
            "data": {
                "overview": {
                    "totalAppeals": total,
                    "averageRating": rating_stats[0]["avgRating"] if rating_stats else 0,
                    "totalRatings": rating_stats[0]["totalRatings"] if rating_stats else 0
                },
                "statistics": {
                    "byStatus": status_stats,
                    "byType": type_stats,
                    "bySector": sector_stats
                }
            }
        }
    
    @staticmethod
    async def export_appeals(format, status):
        filter_query = {}
        if status:
            filter_query["status"] = status
        
        cursor = db.appeals.find(filter_query).sort("createdAt", -1)
        appeals = await cursor.to_list(length=10000)
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            "ID", "First Name", "Last Name", "Email", "Phone",
            "Title", "Type", "Sector", "Priority", "Status",
            "Created At", "Updated At"
        ])
        
        for appeal in appeals:
            writer.writerow([
                str(appeal["_id"]),
                appeal.get("firstName", ""),
                appeal.get("lastName", ""),
                appeal.get("email", ""),
                appeal.get("phone", ""),
                appeal.get("title", ""),
                appeal.get("type", ""),
                appeal.get("sector", ""),
                appeal.get("priority", ""),
                appeal.get("status", ""),
                appeal.get("createdAt", ""),
                appeal.get("updatedAt", "")
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=appeals-{datetime.now().timestamp()}.csv"}
        )
```

### schemas/appeal.py
```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AppealType(str, Enum):
    complaint = "complaint"
    suggestion = "suggestion"
    question = "question"
    request = "request"
    appreciation = "appreciation"
    other = "other"

class AppealSector(str, Enum):
    infrastructure = "infrastructure"
    environment = "environment"
    ecology = "ecology"
    transport = "transport"
    health = "health"
    education = "education"
    social = "social"
    economic = "economic"
    other = "other"

class AppealPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class AppealStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    waiting_response = "waiting_response"
    closed = "closed"
    rejected = "rejected"

class Coordinates(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Location(BaseModel):
    district: Optional[str] = None
    address: Optional[str] = None
    coordinates: Optional[Coordinates] = None

class AppealCreate(BaseModel):
    firstName: str = Field(..., min_length=2, max_length=50)
    lastName: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    title: str = Field(..., min_length=5, max_length=200)
    message: str = Field(..., min_length=10, max_length=2000)
    type: AppealType
    sector: AppealSector
    priority: Optional[AppealPriority] = AppealPriority.medium
    location: Optional[Location] = None

class StatusUpdate(BaseModel):
    status: AppealStatus
    adminResponse: Optional[str] = Field(None, max_length=1000)
    followUpRequired: Optional[bool] = None
    followUpDate: Optional[datetime] = None

class RatingRequest(BaseModel):
    score: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = Field(None, max_length=500)

class BulkStatusUpdate(BaseModel):
    appealIds: List[str]
    status: AppealStatus
    adminResponse: Optional[str] = None

class AppealResponse(BaseModel):
    success: bool
    message: str
    data: dict

class AppealListResponse(BaseModel):
    success: bool
    data: List[dict]
    pagination: dict
```

## Validation Rules

| Maydon | Qoida |
|--------|-------|
| firstName | 2-50 belgi |
| lastName | 2-50 belgi |
| email | Valid email format |
| phone | 10+ raqam |
| title | 5-200 belgi |
| message | 10-2000 belgi |
| score | 1-5 |
| feedback | max 500 belgi |
