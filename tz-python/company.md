# Company Moduli - Kompaniyalar/Tashkilotlar

## Umumiy Ma'lumot

Company moduli davlat va nodavlat tashkilotlarni boshqarish funksiyalarini ta'minlaydi.

## API Endpoints

### Admin Routes
```
POST   /api/admin/companies              - Kompaniya yaratish
GET    /api/admin/companies              - Barcha kompaniyalar
GET    /api/admin/companies/:id          - Kompaniya ID bo'yicha
GET    /api/admin/companies/slug/:slug   - Kompaniya slug bo'yicha
PUT    /api/admin/companies/:id          - Kompaniya yangilash
DELETE /api/admin/companies/:id          - Soft delete
DELETE /api/admin/companies/:id/hard     - Hard delete (super_admin)
PATCH  /api/admin/companies/:id/toggle-status - Status o'zgartirish
GET    /api/admin/companies/sector/:sector    - Sektor bo'yicha
GET    /api/admin/companies/type/:type        - Tur bo'yicha
GET    /api/admin/companies/statistics        - Statistika
```

### UI Routes (Public)
```
GET /api/ui/companies - Kompaniyalar ro'yxati (public)
```

## Python Implementation

### routes/company.py

```python
from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.controllers.company import CompanyController
from app.middleware.auth import require_admin, require_super_admin

router = APIRouter(prefix="/admin/companies", tags=["Companies"])

@router.post("/")
async def create_company(
    request: CompanyCreate,
    current_user = Depends(require_admin)
):
    return await CompanyController.create_company(request)

@router.get("/")
async def get_all_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sector: Optional[str] = None,
    type: Optional[str] = None,
    isActive: Optional[bool] = None,
    search: Optional[str] = None,
    sortBy: str = "createdAt",
    sortOrder: str = "desc",
    current_user = Depends(require_admin)
):
    return await CompanyController.get_all_companies(
        page, limit, sector, type, isActive, search, sortBy, sortOrder
    )

@router.get("/statistics")
async def get_statistics(current_user = Depends(require_admin)):
    return await CompanyController.get_statistics()

@router.get("/sector/{sector}")
async def get_by_sector(
    sector: str,
    current_user = Depends(require_admin)
):
    return await CompanyController.get_by_sector(sector)

@router.get("/type/{type}")
async def get_by_type(
    type: str,
    current_user = Depends(require_admin)
):
    return await CompanyController.get_by_type(type)

@router.get("/{company_id}")
async def get_company_by_id(
    company_id: str,
    current_user = Depends(require_admin)
):
    return await CompanyController.get_company_by_id(company_id)

@router.get("/slug/{slug}")
async def get_company_by_slug(
    slug: str,
    current_user = Depends(require_admin)
):
    return await CompanyController.get_company_by_slug(slug)

@router.put("/{company_id}")
async def update_company(
    company_id: str,
    request: CompanyUpdate,
    current_user = Depends(require_admin)
):
    return await CompanyController.update_company(company_id, request)

@router.delete("/{company_id}")
async def delete_company(
    company_id: str,
    current_user = Depends(require_admin)
):
    return await CompanyController.soft_delete_company(company_id)

@router.delete("/{company_id}/hard")
async def hard_delete_company(
    company_id: str,
    current_user = Depends(require_super_admin)
):
    return await CompanyController.hard_delete_company(company_id)

@router.patch("/{company_id}/toggle-status")
async def toggle_status(
    company_id: str,
    current_user = Depends(require_admin)
):
    return await CompanyController.toggle_status(company_id)
```

### controllers/company.py

```python
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.config.database import mongo

VALID_SECTORS = [
    "infrastructure", "environment", "transport", "health",
    "education", "social", "economic", "other", "ecology", "utilities"
]

VALID_TYPES = ["government", "nongovernment", "other"]

class CompanyController:
    
    @staticmethod
    async def create_company(request):
        # Validate sector
        if request.sector not in VALID_SECTORS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sector. Allowed: {', '.join(VALID_SECTORS)}"
            )
        
        # Validate type
        if request.type and request.type not in VALID_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid type. Allowed: {', '.join(VALID_TYPES)}"
            )
        
        # Check existing slug
        existing = await mongo.db.companies.find_one({"slug": request.slug.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Company with this slug already exists."
            )
        
        company_data = {
            "name": request.name.strip(),
            "slug": request.slug.lower(),
            "description": request.description.strip(),
            "sector": request.sector,
            "email": request.email,
            "phone": request.phone,
            "inn": request.inn,
            "type": request.type,
            "address": request.address.dict() if request.address else None,
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await mongo.db.companies.insert_one(company_data)
        
        return {
            "success": True,
            "message": "Company created successfully.",
            "data": {
                "id": str(result.inserted_id),
                **{k: v for k, v in company_data.items() if k != "_id"}
            }
        }
    
    @staticmethod
    async def get_all_companies(
        page, limit, sector, type, is_active, search, sort_by, sort_order
    ):
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
        
        cursor = mongo.db.companies.find(filter_query).skip(skip).limit(limit).sort(sort_by, sort_direction)
        companies = await cursor.to_list(length=limit)
        
        total = await mongo.db.companies.count_documents(filter_query)
        
        for company in companies:
            company["id"] = str(company.pop("_id"))
        
        return {
            "success": True,
            "message": "Organizations retrieved successfully",
            "data": {
                "companies": companies,
                "pagination": {
                    "currentPage": page,
                    "totalPages": (total + limit - 1) // limit,
                    "totalItems": total,
                    "itemsPerPage": limit,
                    "hasNextPage": page < (total + limit - 1) // limit,
                    "hasPrevPage": page > 1
                }
            }
        }
    
    @staticmethod
    async def get_company_by_id(company_id: str):
        try:
            company = await mongo.db.companies.find_one({"_id": ObjectId(company_id)})
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid company ID format."
            )
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found."
            )
        
        company["id"] = str(company.pop("_id"))
        
        return {
            "success": True,
            "data": company
        }
    
    @staticmethod
    async def get_company_by_slug(slug: str):
        company = await mongo.db.companies.find_one({"slug": slug.lower()})
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found."
            )
        
        company["id"] = str(company.pop("_id"))
        
        return {
            "success": True,
            "data": company
        }
    
    @staticmethod
    async def update_company(company_id: str, request):
        company = await mongo.db.companies.find_one({"_id": ObjectId(company_id)})
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found."
            )
        
        update_data = {"updatedAt": datetime.utcnow()}
        
        if request.name:
            update_data["name"] = request.name.strip()
        if request.slug:
            # Check for duplicate slug
            existing = await mongo.db.companies.find_one({
                "_id": {"$ne": ObjectId(company_id)},
                "slug": request.slug.lower()
            })
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Company with this slug already exists."
                )
            update_data["slug"] = request.slug.lower()
        if request.description:
            update_data["description"] = request.description.strip()
        if request.sector:
            update_data["sector"] = request.sector
        if request.email is not None:
            update_data["email"] = request.email
        if request.phone is not None:
            update_data["phone"] = request.phone
        if request.inn is not None:
            update_data["inn"] = request.inn
        if request.type:
            update_data["type"] = request.type
        if request.address:
            update_data["address"] = request.address.dict()
        if request.isActive is not None:
            update_data["isActive"] = request.isActive
        
        await mongo.db.companies.update_one(
            {"_id": ObjectId(company_id)},
            {"$set": update_data}
        )
        
        updated = await mongo.db.companies.find_one({"_id": ObjectId(company_id)})
        updated["id"] = str(updated.pop("_id"))
        
        return {
            "success": True,
            "message": "Company updated successfully.",
            "data": updated
        }
    
    @staticmethod
    async def soft_delete_company(company_id: str):
        company = await mongo.db.companies.find_one({"_id": ObjectId(company_id)})
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found."
            )
        
        await mongo.db.companies.update_one(
            {"_id": ObjectId(company_id)},
            {"$set": {"isActive": False, "updatedAt": datetime.utcnow()}}
        )
        
        return {
            "success": True,
            "message": "Company deactivated successfully."
        }
    
    @staticmethod
    async def hard_delete_company(company_id: str):
        company = await mongo.db.companies.find_one({"_id": ObjectId(company_id)})
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found."
            )
        
        await mongo.db.companies.delete_one({"_id": ObjectId(company_id)})
        
        return {
            "success": True,
            "message": "Company permanently deleted."
        }
    
    @staticmethod
    async def toggle_status(company_id: str):
        company = await mongo.db.companies.find_one({"_id": ObjectId(company_id)})
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found."
            )
        
        new_status = not company.get("isActive", True)
        
        await mongo.db.companies.update_one(
            {"_id": ObjectId(company_id)},
            {"$set": {"isActive": new_status, "updatedAt": datetime.utcnow()}}
        )
        
        return {
            "success": True,
            "message": f"Company {'activated' if new_status else 'deactivated'} successfully.",
            "data": {"isActive": new_status}
        }
    
    @staticmethod
    async def get_by_sector(sector: str):
        if sector not in VALID_SECTORS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sector. Allowed: {', '.join(VALID_SECTORS)}"
            )
        
        cursor = mongo.db.companies.find({"sector": sector, "isActive": True})
        companies = await cursor.to_list(length=1000)
        
        for company in companies:
            company["id"] = str(company.pop("_id"))
        
        return {
            "success": True,
            "data": companies
        }
    
    @staticmethod
    async def get_by_type(type: str):
        if type not in VALID_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid type. Allowed: {', '.join(VALID_TYPES)}"
            )
        
        cursor = mongo.db.companies.find({"type": type, "isActive": True})
        companies = await cursor.to_list(length=1000)
        
        for company in companies:
            company["id"] = str(company.pop("_id"))
        
        return {
            "success": True,
            "data": companies
        }
    
    @staticmethod
    async def get_statistics():
        # By sector
        sector_pipeline = [
            {"$group": {"_id": "$sector", "count": {"$sum": 1}}}
        ]
        by_sector = await mongo.db.companies.aggregate(sector_pipeline).to_list(20)
        
        # By type
        type_pipeline = [
            {"$group": {"_id": "$type", "count": {"$sum": 1}}}
        ]
        by_type = await mongo.db.companies.aggregate(type_pipeline).to_list(10)
        
        # Total
        total = await mongo.db.companies.count_documents({})
        active = await mongo.db.companies.count_documents({"isActive": True})
        
        return {
            "success": True,
            "data": {
                "total": total,
                "active": active,
                "inactive": total - active,
                "bySector": {item["_id"]: item["count"] for item in by_sector},
                "byType": {item["_id"]: item["count"] for item in by_type}
            }
        }
```

### schemas/company.py

```python
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class AddressSchema(BaseModel):
    fullAddress: Optional[str] = None
    long: Optional[float] = None
    lat: Optional[float] = None

class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    slug: str = Field(..., pattern=r'^[a-z0-9-]+$')
    description: str = Field(..., min_length=3, max_length=500)
    sector: str
    email: Optional[EmailStr] = None
    phone: Optional[int] = None
    inn: Optional[str] = None
    type: Optional[str] = None
    address: Optional[AddressSchema] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)
    slug: Optional[str] = Field(None, pattern=r'^[a-z0-9-]+$')
    description: Optional[str] = Field(None, min_length=3, max_length=500)
    sector: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[int] = None
    inn: Optional[str] = None
    type: Optional[str] = None
    address: Optional[AddressSchema] = None
    isActive: Optional[bool] = None

class CompanyResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    sector: str
    email: Optional[str]
    phone: Optional[int]
    inn: Optional[str]
    type: Optional[str]
    address: Optional[AddressSchema]
    isActive: bool
    createdAt: datetime
    updatedAt: datetime
```

## Kompaniya Turlari

| Type | Tavsif |
|------|--------|
| `government` | Davlat tashkiloti |
| `nongovernment` | Nodavlat tashkilot |
| `other` | Boshqa |
