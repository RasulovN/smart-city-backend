# Auth Moduli - Autentifikatsiya

## Umumiy Ma'lumot

Auth moduli foydalanuvchilarni tizimga kirish, chiqish, profil ko'rish va parol o'zgartirish funksiyalarini ta'minlaydi.

## API Endpoints

### 1. Login (Kirish)
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "user_id",
      "username": "username",
      "email": "user@example.com",
      "role": "admin",
      "sector": "ecology",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here",
    "allowedRoutes": {
      "routes": ["/api/users/*", "/api/ecology/*"],
      "description": "Access to all sector APIs"
    },
    "expiresIn": "24h"
  }
}
```

### 2. Logout (Chiqish)
```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful. Please remove the token from client storage."
}
```

### 3. Get Profile (Profil olish)
```
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "username",
      "email": "user@example.com",
      "role": "admin",
      "sector": "ecology",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "allowedRoutes": {...}
  }
}
```

### 4. Change Password (Parol o'zgartirish)
```
POST /api/auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

### 5. Refresh Token
```
POST /api/auth/refresh-token
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "token": "new_jwt_token",
    "expiresIn": "24h"
  }
}
```

## Python Implementation

### routes/auth.py
```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import LoginRequest, TokenResponse, PasswordChangeRequest
from app.controllers.auth import AuthController
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    return await AuthController.login(request)

@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    return await AuthController.logout()

@router.get("/profile")
async def get_profile(current_user = Depends(get_current_user)):
    return await AuthController.get_profile(current_user)

@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user = Depends(get_current_user)
):
    return await AuthController.change_password(request, current_user)

@router.post("/refresh-token")
async def refresh_token(current_user = Depends(get_current_user)):
    return await AuthController.refresh_token(current_user)
```

### controllers/auth.py
```python
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config.settings import settings
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthController:
    
    @staticmethod
    def create_token(user_data: dict) -> str:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
        to_encode = {
            "userId": str(user_data["_id"]),
            "username": user_data["username"],
            "email": user_data["email"],
            "role": user_data["role"],
            "sector": user_data.get("sector"),
            "exp": expire
        }
        return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def get_allowed_routes(role: str, sector: str = None) -> dict:
        base_routes = {
            "super_admin": {
                "routes": ["*"],
                "description": "Full access to all APIs"
            },
            "admin": {
                "routes": [
                    "/api/users/*",
                    "/api/ecology/*",
                    "/api/health/*",
                    "/api/security/*"
                ],
                "description": "Access to all sector APIs and user management"
            },
            "sector_admin": {
                "ecology": {
                    "routes": ["/api/environment/*", "/api/ecology/*"],
                    "description": "Access to ecology and environment APIs"
                },
                "health": {
                    "routes": ["/api/health/*", "/api/hospitals/*"],
                    "description": "Access to health sector APIs"
                },
                "security": {
                    "routes": ["/api/traffic/*", "/api/security/*"],
                    "description": "Access to security and traffic APIs"
                }
            }
        }
        
        if role == "super_admin":
            return base_routes["super_admin"]
        if role == "admin":
            return base_routes["admin"]
        if role == "sector_admin" and sector:
            return base_routes["sector_admin"].get(sector, {"routes": [], "description": "No access"})
        
        return {"routes": [], "description": "No access"}
    
    @staticmethod
    async def login(request):
        from app.config.database import db
        
        user = await db.users.find_one({"email": request.email.lower()})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )
        
        if not user.get("isActive", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Contact administrator."
            )
        
        if not pwd_context.verify(request.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )
        
        # Update last login
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"lastLogin": datetime.utcnow()}}
        )
        
        token = AuthController.create_token(user)
        allowed_routes = AuthController.get_allowed_routes(user["role"], user.get("sector"))
        
        return {
            "success": True,
            "message": "Login successful.",
            "data": {
                "user": {
                    "id": str(user["_id"]),
                    "username": user["username"],
                    "email": user["email"],
                    "role": user["role"],
                    "sector": user.get("sector"),
                    "lastLogin": user.get("lastLogin")
                },
                "token": token,
                "allowedRoutes": allowed_routes,
                "expiresIn": f"{settings.JWT_EXPIRES_MINUTES}m"
            }
        }
    
    @staticmethod
    async def logout():
        return {
            "success": True,
            "message": "Logout successful. Please remove the token from client storage."
        }
    
    @staticmethod
    async def get_profile(current_user):
        from app.config.database import db
        
        user = await db.users.find_one({"_id": current_user["userId"]})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        allowed_routes = AuthController.get_allowed_routes(user["role"], user.get("sector"))
        
        return {
            "success": True,
            "data": {
                "user": {
                    "id": str(user["_id"]),
                    "username": user["username"],
                    "email": user["email"],
                    "role": user["role"],
                    "sector": user.get("sector"),
                    "isActive": user.get("isActive", True),
                    "lastLogin": user.get("lastLogin"),
                    "createdAt": user.get("createdAt")
                },
                "allowedRoutes": allowed_routes
            }
        }
    
    @staticmethod
    async def change_password(request, current_user):
        from app.config.database import db
        
        if len(request.newPassword) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters long."
            )
        
        user = await db.users.find_one({"_id": current_user["userId"]})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        if not pwd_context.verify(request.currentPassword, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect."
            )
        
        hashed_password = pwd_context.hash(request.newPassword)
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": hashed_password}}
        )
        
        return {
            "success": True,
            "message": "Password changed successfully."
        }
    
    @staticmethod
    async def refresh_token(current_user):
        from app.config.database import db
        
        user = await db.users.find_one({"_id": current_user["userId"]})
        
        if not user or not user.get("isActive", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user or account deactivated."
            )
        
        token = AuthController.create_token(user)
        
        return {
            "success": True,
            "message": "Token refreshed successfully.",
            "data": {
                "token": token,
                "expiresIn": f"{settings.JWT_EXPIRES_MINUTES}m"
            }
        }
```

### schemas/user.py (Auth qismi)
```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str

class UserResponse(BaseModel):
    id: str
    username: Optional[str]
    email: str
    role: str
    sector: Optional[str]
    isActive: bool = True
    lastLogin: Optional[datetime]
    createdAt: Optional[datetime]

class AllowedRoutes(BaseModel):
    routes: list[str]
    description: str

class TokenData(BaseModel):
    user: UserResponse
    token: str
    allowedRoutes: AllowedRoutes
    expiresIn: str

class TokenResponse(BaseModel):
    success: bool
    message: str
    data: TokenData
```

## Rollar va Huquqlar

| Rol | Tavsif | Ruxsatlar |
|-----|--------|-----------|
| `super_admin` | Tizim bosh administratori | Barcha API'larga kirish |
| `admin` | Administrator | Foydalanuvchilar va sektorlar boshqaruvi |
| `sector_admin` | Sektor administratori | Faqat o'z sektoriga kirish |

## Xavfsizlik

1. **Parol hashlash**: bcrypt algoritmi
2. **JWT Token**: HS256 algoritmi, 24 soat amal qilish muddati
3. **Token tekshirish**: Har bir himoyalangan endpoint uchun
4. **Faol foydalanuvchi tekshirish**: isActive = true bo'lishi shart
