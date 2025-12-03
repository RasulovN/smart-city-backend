# Sector Moduli

## Umumiy Ma'lumot

Sector moduli sektorlarni boshqarish va sektor bo'yicha murojaatlarni ko'rish funksiyalarini ta'minlaydi.

## API Endpoints

### 1. Sector Routes (Asosiy)
```
GET /api/sectors/appeals          - Murojaatlar (appeals.md ga qarang)
GET /api/sectors/tasks            - Vazifalar (kelajakda)
```

### 2. Admin Sector Routes
```
POST   /api/admin/sectors         - Sektor yaratish
GET    /api/admin/sectors         - Barcha sektorlar
GET    /api/admin/sectors/:id     - Sektor ID bo'yicha
GET    /api/admin/sectors/slug/:slug - Sektor slug bo'yicha
PUT    /api/admin/sectors/:id     - Sektor yangilash
DELETE /api/admin/sectors/:id     - Sektor o'chirish
PATCH  /api/admin/sectors/:id/deactivate - Deaktivatsiya
PATCH  /api/admin/sectors/:id/activate   - Aktivatsiya
```

## Python Implementation

### routes/sector.py

```python
from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.schemas.sector import SectorCreate, SectorUpdate
from app.controllers.sector import SectorController
from app.middleware.auth import require_admin

router = APIRouter(prefix="/admin/sectors", tags=["Sectors"])

@router.post("/")
async def create_sector(
    request: SectorCreate,
    current_user = Depends(require_admin)
):
    return await SectorController.create_sector(request)

@router.get("/")
async def get_all_sectors(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    isActive: Optional[bool] = None
):
    return await SectorController.get_all_sectors(page, limit, isActive)

@router.get("/{sector_id}")
async def get_sector_by_id(sector_id: str):
    return await SectorController.get_sector_by_id(sector_id)

@router.get("/slug/{slug}")
async def get_sector_by_slug(slug: str):
    return await SectorController.get_sector_by_slug(slug)

@router.put("/{sector_id}")
async def update_sector(
    sector_id: str,
    request: SectorUpdate,
    current_user = Depends(require_admin)
):
    return await SectorController.update_sector(sector_id, request)

@router.delete("/{sector_id}")
async def delete_sector(
    sector_id: str,
    current_user = Depends(require_admin)
):
    return await SectorController.delete_sector(sector_id)

@router.patch("/{sector_id}/deactivate")
async def deactivate_sector(
    sector_id: str,
    current_user = Depends(require_admin)
):
    return await SectorController.deactivate_sector(sector_id)

@router.patch("/{sector_id}/activate")
async def activate_sector(
    sector_id: str,
    current_user = Depends(require_admin)
):
    return await SectorController.activate_sector(sector_id)
```

### controllers/sector.py

```python
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.config.database import mongo
import re

class SectorController:
    
    @staticmethod
    async def create_sector(request):
        # Validate slug format
        if not re.match(r'^[a-z0-9-]+$', request.slug):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slug must contain only lowercase letters, numbers, and hyphens."
            )
        
        # Check existing
        existing = await mongo.db.sectors.find_one({
            "$or": [
                {"slug": request.slug.lower()},
                {"name": request.name.strip()}
            ]
        })
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Sector with this name or slug already exists."
            )
        
        sector_data = {
            "name": request.name.strip(),
            "slug": request.slug.lower(),
            "description": request.description.strip(),
            "isActive": request.isActive if request.isActive is not None else True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await mongo.db.sectors.insert_one(sector_data)
        
        return {
            "success": True,
            "message": "Sector created successfully.",
            "data": {
                "id": str(result.inserted_id),
                "name": sector_data["name"],
                "slug": sector_data["slug"],
                "description": sector_data["description"],
                "isActive": sector_data["isActive"],
                "createdAt": sector_data["createdAt"],
                "updatedAt": sector_data["updatedAt"]
            }
        }
    
    @staticmethod
    async def get_all_sectors(page: int, limit: int, is_active: bool = None):
        filter_query = {}
        if is_active is not None:
            filter_query["isActive"] = is_active
        
        skip = (page - 1) * limit
        
        cursor = mongo.db.sectors.find(filter_query).skip(skip).limit(limit).sort("createdAt", -1)
        sectors = await cursor.to_list(length=limit)
        
        total = await mongo.db.sectors.count_documents(filter_query)
        
        for sector in sectors:
            sector["id"] = str(sector.pop("_id"))
        
        return {
            "success": True,
            "data": {
                "sectors": sectors,
                "pagination": {
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "pages": (total + limit - 1) // limit
                }
            }
        }
    
    @staticmethod
    async def get_sector_by_id(sector_id: str):
        try:
            sector = await mongo.db.sectors.find_one({"_id": ObjectId(sector_id)})
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sector ID format."
            )
        
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sector not found."
            )
        
        sector["id"] = str(sector.pop("_id"))
        
        return {
            "success": True,
            "data": sector
        }
    
    @staticmethod
    async def get_sector_by_slug(slug: str):
        sector = await mongo.db.sectors.find_one({"slug": slug.lower()})
        
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sector not found."
            )
        
        sector["id"] = str(sector.pop("_id"))
        
        return {
            "success": True,
            "data": sector
        }
    
    @staticmethod
    async def update_sector(sector_id: str, request):
        sector = await mongo.db.sectors.find_one({"_id": ObjectId(sector_id)})
        
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sector not found."
            )
        
        update_data = {"updatedAt": datetime.utcnow()}
        
        if request.name:
            update_data["name"] = request.name.strip()
        
        if request.slug:
            if not re.match(r'^[a-z0-9-]+$', request.slug):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Slug must contain only lowercase letters, numbers, and hyphens."
                )
            update_data["slug"] = request.slug.lower()
        
        if request.description:
            update_data["description"] = request.description.strip()
        
        if request.isActive is not None:
            update_data["isActive"] = request.isActive
        
        # Check for duplicates
        if request.name or request.slug:
            existing = await mongo.db.sectors.find_one({
                "_id": {"$ne": ObjectId(sector_id)},
                "$or": [
                    {"name": update_data.get("name", sector["name"])},
                    {"slug": update_data.get("slug", sector["slug"])}
                ]
            })
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Sector with this name or slug already exists."
                )
        
        await mongo.db.sectors.update_one(
            {"_id": ObjectId(sector_id)},
            {"$set": update_data}
        )
        
        updated_sector = await mongo.db.sectors.find_one({"_id": ObjectId(sector_id)})
        updated_sector["id"] = str(updated_sector.pop("_id"))
        
        return {
            "success": True,
            "message": "Sector updated successfully.",
            "data": updated_sector
        }
    
    @staticmethod
    async def delete_sector(sector_id: str):
        sector = await mongo.db.sectors.find_one({"_id": ObjectId(sector_id)})
        
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sector not found."
            )
        
        await mongo.db.sectors.delete_one({"_id": ObjectId(sector_id)})
        
        return {
            "success": True,
            "message": "Sector deleted successfully."
        }
    
    @staticmethod
    async def deactivate_sector(sector_id: str):
        sector = await mongo.db.sectors.find_one({"_id": ObjectId(sector_id)})
        
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sector not found."
            )
        
        await mongo.db.sectors.update_one(
            {"_id": ObjectId(sector_id)},
            {"$set": {"isActive": False, "updatedAt": datetime.utcnow()}}
        )
        
        return {
            "success": True,
            "message": "Sector deactivated successfully."
        }
    
    @staticmethod
    async def activate_sector(sector_id: str):
        sector = await mongo.db.sectors.find_one({"_id": ObjectId(sector_id)})
        
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sector not found."
            )
        
        await mongo.db.sectors.update_one(
            {"_id": ObjectId(sector_id)},
            {"$set": {"isActive": True, "updatedAt": datetime.utcnow()}}
        )
        
        return {
            "success": True,
            "message": "Sector activated successfully."
        }
```

### schemas/sector.py

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SectorCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    slug: str = Field(..., pattern=r'^[a-z0-9-]+$')
    description: str = Field(..., min_length=3, max_length=500)
    isActive: Optional[bool] = True

class SectorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)
    slug: Optional[str] = Field(None, pattern=r'^[a-z0-9-]+$')
    description: Optional[str] = Field(None, min_length=3, max_length=500)
    isActive: Optional[bool] = None

class SectorResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

class SectorListResponse(BaseModel):
    success: bool
    data: dict
```

## Sektor Turlari

| Slug | Nomi | Tavsif |
|------|------|--------|
| `infrastructure` | Infrastruktura | Yo'llar, ko'priklar, binolar |
| `environment` | Atrof-muhit | Ekologiya, tabiat muhofazasi |
| `ecology` | Ekologiya | Ekologik muammolar |
| `transport` | Transport | Jamoat transporti |
| `health` | Sog'liqni saqlash | Tibbiyot muassasalari |
| `education` | Ta'lim | Maktablar, universitetlar |
| `social` | Ijtimoiy | Ijtimoiy xizmatlar |
| `economic` | Iqtisodiy | Iqtisodiy masalalar |
| `utilities` | Kommunal | Suv, gaz, elektr |
| `other` | Boshqa | Boshqa sohalar |
