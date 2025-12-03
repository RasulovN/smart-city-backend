# Admin Moduli - Foydalanuvchilar va Tizim Boshqaruvi

## Umumiy Ma'lumot

Admin moduli foydalanuvchilarni yaratish, o'zgartirish, o'chirish va boshqarish funksiyalarini ta'minlaydi. Shuningdek, sektorlar va kompaniyalarni boshqarish imkoniyatini beradi.

## API Endpoints

### Foydalanuvchi Boshqaruvi

#### 1. Register (Ro'yxatdan o'tish)
```
POST /api/admin/register
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "username": "admin_user",
  "role": "admin",
  "sector": "ecology",
  "adminCode": "admin2025"
}
```

**Admin Kodlari:**
- `admin2025` → admin roli
- `sector-admin` → sector_admin roli

**Response (201):**
```json
{
  "success": true,
  "message": "Admin registered successfully.",
  "data": {
    "id": "user_id",
    "username": "admin_user",
    "email": "admin@example.com",
    "role": "admin",
    "sector": "all",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Create User (Foydalanuvchi yaratish)
```
POST /api/admin/users
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "new_user",
  "email": "user@example.com",
  "phone": "+998901234567",
  "password": "password123",
  "role": "sector_admin",
  "sector": "health"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "id": "user_id",
    "username": "new_user",
    "email": "user@example.com",
    "phone": "+998901234567",
    "role": "sector_admin",
    "sector": "health",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 3. Get All Users (Barcha foydalanuvchilar)
```
GET /api/admin/users?page=1&limit=10&role=admin&sector=ecology&isActive=true
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

#### 4. Get User by ID
```
GET /api/admin/users/:id
Authorization: Bearer <token>
```

#### 5. Update User
```
PUT /api/admin/users/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "updated_name",
  "email": "updated@example.com",
  "role": "admin",
  "sector": "all",
  "isActive": true
}
```

#### 6. Delete User
```
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

#### 7. Deactivate User
```
PATCH /api/admin/users/:id/deactivate
Authorization: Bearer <token>
```

#### 8. Activate User
```
PATCH /api/admin/users/:id/activate
Authorization: Bearer <token>
```

#### 9. Reset User Password
```
POST /api/admin/users/:id/reset-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "newPassword": "new_password123"
}
```

#### 10. Get Users by Sector
```
GET /api/admin/users/sector/:sector
Authorization: Bearer <token>
```

### Sektor Boshqaruvi

#### 11. Create Sector
```
POST /api/admin/sectors
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Ekologiya",
  "slug": "ecology",
  "description": "Ekologiya sektori",
  "isActive": true
}
```

#### 12. Get All Sectors
```
GET /api/admin/sectors?page=1&limit=10&isActive=true
```

#### 13. Get Sector by ID
```
GET /api/admin/sectors/:id
```

#### 14. Get Sector by Slug
```
GET /api/admin/sectors/slug/:slug
```

#### 15. Update Sector
```
PUT /api/admin/sectors/:id
Authorization: Bearer <token>
```

#### 16. Delete Sector
```
DELETE /api/admin/sectors/:id
Authorization: Bearer <token>
```

#### 17. Deactivate/Activate Sector
```
PATCH /api/admin/sectors/:id/deactivate
PATCH /api/admin/sectors/:id/activate
Authorization: Bearer <token>
```

### Kompaniya Boshqaruvi

#### 18. Create Company
```
POST /api/admin/companies
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Kompaniya nomi",
  "slug": "kompaniya-slug",
  "description": "Kompaniya tavsifi",
  "sector": "ecology",
  "email": "company@example.com",
  "phone": 998901234567,
  "inn": "123456789",
  "type": "government",
  "address": {
    "fullAddress": "Toshkent, Chilonzor",
    "long": 69.2401,
    "lat": 41.3111
  }
}
```

#### 19. Get All Companies
```
GET /api/admin/companies?page=1&limit=10&sector=ecology&type=government
Authorization: Bearer <token>
```

#### 20. Get Company by ID/Slug
```
GET /api/admin/companies/:id
GET /api/admin/companies/slug/:slug
Authorization: Bearer <token>
```

#### 21. Update Company
```
PUT /api/admin/companies/:id
Authorization: Bearer <token>
```

#### 22. Delete Company (Soft/Hard)
```
DELETE /api/admin/companies/:id
DELETE /api/admin/companies/:id/hard  # Super admin only
Authorization: Bearer <token>
```

#### 23. Toggle Company Status
```
PATCH /api/admin/companies/:id/toggle-status
Authorization: Bearer <token>
```

#### 24. Get Companies by Sector/Type
```
GET /api/admin/companies/sector/:sector
GET /api/admin/companies/type/:type
Authorization: Bearer <token>
```

## Python Implementation

### routes/admin.py
```python
from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.schemas.user import (
    RegisterRequest, CreateUserRequest, UpdateUserRequest,
    ResetPasswordRequest, UserListResponse
)
from app.schemas.sector import SectorCreate, SectorUpdate, SectorListResponse
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyListResponse
from app.controllers.admin import AdminController
from app.middleware.auth import get_current_user, require_admin, require_super_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

# User Management
@router.post("/register")
async def register(request: RegisterRequest):
    return await AdminController.register(request)

@router.post("/users")
async def create_user(
    request: CreateUserRequest,
    current_user = Depends(require_admin)
):
    return await AdminController.create_user(request, current_user)

@router.get("/users", response_model=UserListResponse)
async def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    role: Optional[str] = None,
    sector: Optional[str] = None,
    isActive: Optional[bool] = None,
    current_user = Depends(require_admin)
):
    return await AdminController.get_all_users(page, limit, role, sector, isActive)

@router.get("/users/{user_id}")
async def get_user_by_id(
    user_id: str,
    current_user = Depends(require_admin)
):
    return await AdminController.get_user_by_id(user_id)

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    current_user = Depends(require_admin)
):
    return await AdminController.update_user(user_id, request, current_user)

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user = Depends(require_admin)
):
    return await AdminController.delete_user(user_id, current_user)

@router.patch("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    current_user = Depends(require_admin)
):
    return await AdminController.deactivate_user(user_id, current_user)

@router.patch("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user = Depends(require_admin)
):
    return await AdminController.activate_user(user_id, current_user)

@router.post("/users/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    request: ResetPasswordRequest,
    current_user = Depends(require_admin)
):
    return await AdminController.reset_user_password(user_id, request, current_user)

@router.get("/users/sector/{sector}")
async def get_users_by_sector(
    sector: str,
    current_user = Depends(require_admin)
):
    return await AdminController.get_users_by_sector(sector)

# Sector Management
@router.post("/sectors")
async def create_sector(
    request: SectorCreate,
    current_user = Depends(require_admin)
):
    return await AdminController.create_sector(request)

@router.get("/sectors")
async def get_all_sectors(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    isActive: Optional[bool] = None
):
    return await AdminController.get_all_sectors(page, limit, isActive)

@router.get("/sectors/{sector_id}")
async def get_sector_by_id(sector_id: str):
    return await AdminController.get_sector_by_id(sector_id)

@router.get("/sectors/slug/{slug}")
async def get_sector_by_slug(slug: str):
    return await AdminController.get_sector_by_slug(slug)

@router.put("/sectors/{sector_id}")
async def update_sector(
    sector_id: str,
    request: SectorUpdate,
    current_user = Depends(require_admin)
):
    return await AdminController.update_sector(sector_id, request)

@router.delete("/sectors/{sector_id}")
async def delete_sector(
    sector_id: str,
    current_user = Depends(require_admin)
):
    return await AdminController.delete_sector(sector_id)

# Company Management
@router.post("/companies")
async def create_company(
    request: CompanyCreate,
    current_user = Depends(require_admin)
):
    return await AdminController.create_company(request)

@router.get("/companies")
async def get_all_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sector: Optional[str] = None,
    type: Optional[str] = None,
    current_user = Depends(require_admin)
):
    return await AdminController.get_all_companies(page, limit, sector, type)

@router.delete("/companies/{company_id}/hard")
async def hard_delete_company(
    company_id: str,
    current_user = Depends(require_super_admin)
):
    return await AdminController.hard_delete_company(company_id)
```

### controllers/admin.py
```python
from datetime import datetime
from bson import ObjectId
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.config.database import db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

VALID_ADMIN_CODES = {
    "admin2025": "admin",
    "sector-admin": "sector_admin"
}

VALID_SECTORS = [
    "ecology", "health", "security", "all", "appeals", "tasks",
    "healthcare", "education", "transport", "infrastructure",
    "social", "economic", "management", "utilities", "other"
]

VALID_ROLES = ["admin", "sector_admin", "super_admin"]

class AdminController:
    
    @staticmethod
    async def register(request):
        # Validate admin code
        if not request.adminCode or request.adminCode not in VALID_ADMIN_CODES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid admin registration code."
            )
        
        requested_role = VALID_ADMIN_CODES[request.adminCode]
        
        # Validate sector for sector_admin
        if requested_role == "sector_admin" and request.sector not in VALID_SECTORS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sector is required for sector_admin."
            )
        
        # Check existing user
        existing = await db.users.find_one({"email": request.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists."
            )
        
        # Generate username if not provided
        username = request.username
        if not username:
            email_prefix = request.email.lower().split("@")[0]
            timestamp = hex(int(datetime.utcnow().timestamp()))[2:]
            username = f"{email_prefix}_{timestamp}"
        
        # Create user
        user_data = {
            "username": username,
            "email": request.email.lower(),
            "password": pwd_context.hash(request.password),
            "role": requested_role,
            "sector": "all" if requested_role == "admin" else request.sector,
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.users.insert_one(user_data)
        
        return {
            "success": True,
            "message": "Admin registered successfully.",
            "data": {
                "id": str(result.inserted_id),
                "username": username,
                "email": request.email.lower(),
                "role": requested_role,
                "sector": user_data["sector"],
                "isActive": True,
                "createdAt": user_data["createdAt"]
            }
        }
    
    @staticmethod
    async def create_user(request, current_user):
        current_role = current_user["role"]
        
        # Role validation
        if current_role == "super_admin":
            valid_roles = ["admin", "sector_admin", "super_admin"]
        else:
            valid_roles = ["admin", "sector_admin"]
        
        if request.role and request.role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Allowed: {', '.join(valid_roles)}"
            )
        
        # Only super_admin can create super_admin
        if request.role == "super_admin" and current_role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super_admin can assign super_admin role."
            )
        
        # Check existing
        existing = await db.users.find_one({"email": request.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists."
            )
        
        # Generate username
        username = request.username
        if not username:
            email_prefix = request.email.lower().split("@")[0]
            timestamp = hex(int(datetime.utcnow().timestamp()))[2:]
            username = f"{email_prefix}_{timestamp}"
        
        user_data = {
            "username": username,
            "email": request.email.lower(),
            "phone": request.phone,
            "password": pwd_context.hash(request.password),
            "role": request.role or "sector_admin",
            "sector": "all" if request.role == "admin" else request.sector,
            "isActive": True,
            "createdBy": ObjectId(current_user["userId"]),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.users.insert_one(user_data)
        
        return {
            "success": True,
            "message": "User created successfully.",
            "data": {
                "id": str(result.inserted_id),
                "username": username,
                "email": request.email.lower(),
                "phone": request.phone,
                "role": user_data["role"],
                "sector": user_data["sector"],
                "isActive": True,
                "createdAt": user_data["createdAt"]
            }
        }
    
    @staticmethod
    async def get_all_users(page, limit, role, sector, is_active):
        filter_query = {"role": {"$ne": "super_admin"}}
        
        if role:
            filter_query["role"] = role
        if sector:
            filter_query["sector"] = sector
        if is_active is not None:
            filter_query["isActive"] = is_active
        
        skip = (page - 1) * limit
        
        cursor = db.users.find(filter_query).skip(skip).limit(limit).sort("createdAt", -1)
        users = await cursor.to_list(length=limit)
        
        total = await db.users.count_documents(filter_query)
        
        # Remove password from response
        for user in users:
            user["id"] = str(user.pop("_id"))
            user.pop("password", None)
            if "createdBy" in user:
                user["createdBy"] = str(user["createdBy"])
        
        return {
            "success": True,
            "data": {
                "users": users,
                "pagination": {
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "pages": (total + limit - 1) // limit
                }
            }
        }
    
    @staticmethod
    async def delete_user(user_id, current_user):
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        if user["role"] == "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete super admin."
            )
        
        # Admin cannot delete other admins
        if current_user["role"] == "admin" and user["role"] == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin cannot delete other admin users."
            )
        
        await db.users.delete_one({"_id": ObjectId(user_id)})
        
        return {
            "success": True,
            "message": "User deleted successfully."
        }
```

## Huquqlar Matritsasi

| Amal | super_admin | admin | sector_admin |
|------|-------------|-------|--------------|
| Foydalanuvchi yaratish | ✅ | ✅ | ❌ |
| super_admin yaratish | ✅ | ❌ | ❌ |
| admin o'chirish | ✅ | ❌ | ❌ |
| sector_admin o'chirish | ✅ | ✅ | ❌ |
| Sektor yaratish | ✅ | ✅ | ❌ |
| Kompaniya yaratish | ✅ | ✅ | ❌ |
| Hard delete | ✅ | ❌ | ❌ |
