# UI Moduli - Public API

## Umumiy Ma'lumot

UI moduli frontend uchun public API endpointlarini ta'minlaydi. Bu endpointlar autentifikatsiyasiz ishlaydi.

## API Endpoints

```
GET /api/ui/sectors    - Faol sektorlar ro'yxati
GET /api/ui/companies  - Kompaniyalar ro'yxati
GET /api/ui/statistika - Umumiy statistika
```

## Python Implementation

### routes/ui.py

```python
from fastapi import APIRouter, Query
from typing import Optional
from app.controllers.ui import UIController

router = APIRouter(prefix="/ui", tags=["UI - Public"])

@router.get("/sectors")
async def get_sectors():
    """
    Faol sektorlar ro'yxatini olish (faqat name va slug)
    """
    return await UIController.get_all_sectors()

@router.get("/companies")
async def get_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sector: Optional[str] = None,
    type: Optional[str] = None,
    isActive: Optional[bool] = True,
    search: Optional[str] = None,
    sortBy: str = "createdAt",
    sortOrder: str = "desc"
):
    """
    Kompaniyalar ro'yxatini olish (faqat asosiy ma'lumotlar)
    """
    return await UIController.get_all_companies(
        page, limit, sector, type, isActive, search, sortBy, sortOrder
    )

@router.get("/statistika")
async def get_statistics():
    """
    Umumiy statistika
    """
    return await UIController.get_statistics()
```

### controllers/ui.py

```python
from datetime import datetime
from app.config.database import mongo

class UIController:
    
    @staticmethod
    async def get_all_sectors():
        """
        Faqat faol sektorlarni olish (name va slug)
        """
        cursor = mongo.db.sectors.find(
            {"isActive": True},
            {"name": 1, "slug": 1, "_id": 0}  # Projection
        ).sort("name", 1)
        
        sectors = await cursor.to_list(length=100)
        
        return {
            "success": True,
            "data": {
                "sectors": sectors,
                "total": len(sectors)
            },
            "message": "Faol sektorlar ro'yxati muvaffaqiyatli olindi"
        }
    
    @staticmethod
    async def get_all_companies(
        page: int,
        limit: int,
        sector: str = None,
        type: str = None,
        is_active: bool = True,
        search: str = None,
        sort_by: str = "createdAt",
        sort_order: str = "desc"
    ):
        """
        Kompaniyalar ro'yxatini olish (faqat asosiy ma'lumotlar)
        """
        filter_query = {}
        
        if sector:
            filter_query["sector"] = sector
        if type:
            filter_query["type"] = type
        if is_active is not None:
            filter_query["isActive"] = is_active
        
        if search:
            filter_query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"inn": {"$regex": search, "$options": "i"}}
            ]
        
        skip = (page - 1) * limit
        sort_direction = -1 if sort_order == "desc" else 1
        
        # Faqat kerakli fieldlarni olish
        projection = {
            "name": 1,
            "slug": 1,
            "description": 1,
            "sector": 1,
            "_id": 0
        }
        
        cursor = mongo.db.companies.find(
            filter_query, projection
        ).skip(skip).limit(limit).sort(sort_by, sort_direction)
        
        companies = await cursor.to_list(length=limit)
        total = await mongo.db.companies.count_documents(filter_query)
        total_pages = (total + limit - 1) // limit
        
        return {
            "success": True,
            "message": "Organizations retrieved successfully",
            "data": {
                "companies": companies,
                "pagination": {
                    "currentPage": page,
                    "totalPages": total_pages,
                    "totalItems": total,
                    "itemsPerPage": limit,
                    "hasNextPage": page < total_pages,
                    "hasPrevPage": page > 1
                }
            }
        }
    
    @staticmethod
    async def get_statistics():
        """
        Umumiy statistika
        """
        # Sektorlar soni
        sectors_count = await mongo.db.sectors.count_documents({"isActive": True})
        
        # Kompaniyalar soni
        companies_count = await mongo.db.companies.count_documents({"isActive": True})
        
        # Murojaatlar statistikasi
        appeals_pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        appeals_stats = await mongo.db.appeals.aggregate(appeals_pipeline).to_list(10)
        
        total_appeals = sum(item["count"] for item in appeals_stats)
        
        # Sektor bo'yicha murojaatlar
        sector_pipeline = [
            {
                "$group": {
                    "_id": "$sector",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        top_sectors = await mongo.db.appeals.aggregate(sector_pipeline).to_list(5)
        
        return {
            "success": True,
            "data": {
                "overview": {
                    "totalSectors": sectors_count,
                    "totalCompanies": companies_count,
                    "totalAppeals": total_appeals
                },
                "appealsByStatus": {
                    item["_id"]: item["count"] for item in appeals_stats
                },
                "topSectors": [
                    {"sector": item["_id"], "count": item["count"]}
                    for item in top_sectors
                ],
                "timestamp": datetime.utcnow().isoformat()
            },
            "message": "Statistika muvaffaqiyatli olindi"
        }
```

## Response Examples

### GET /api/ui/sectors
```json
{
  "success": true,
  "data": {
    "sectors": [
      {"name": "Ekologiya", "slug": "ecology"},
      {"name": "Infrastruktura", "slug": "infrastructure"},
      {"name": "Sog'liqni saqlash", "slug": "health"},
      {"name": "Ta'lim", "slug": "education"},
      {"name": "Transport", "slug": "transport"}
    ],
    "total": 5
  },
  "message": "Faol sektorlar ro'yxati muvaffaqiyatli olindi"
}
```

### GET /api/ui/companies
```json
{
  "success": true,
  "message": "Organizations retrieved successfully",
  "data": {
    "companies": [
      {
        "name": "Toshkent shahar hokimligi",
        "slug": "toshkent-shahar-hokimligi",
        "description": "Toshkent shahar hokimligi",
        "sector": "infrastructure"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### GET /api/ui/statistika
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSectors": 10,
      "totalCompanies": 50,
      "totalAppeals": 1500
    },
    "appealsByStatus": {
      "open": 200,
      "in_progress": 150,
      "closed": 1100,
      "rejected": 50
    },
    "topSectors": [
      {"sector": "infrastructure", "count": 500},
      {"sector": "transport", "count": 300},
      {"sector": "health", "count": 250}
    ],
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "message": "Statistika muvaffaqiyatli olindi"
}
```

## Xususiyatlar

1. **Autentifikatsiyasiz** - Bu endpointlar public
2. **Minimal ma'lumot** - Faqat kerakli fieldlar qaytariladi
3. **Caching** - Kelajakda Redis cache qo'shish mumkin
4. **Rate limiting** - Kelajakda rate limit qo'shish tavsiya etiladi
