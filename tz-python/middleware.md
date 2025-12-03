# Middleware Moduli

## Umumiy Ma'lumot

Bu modul autentifikatsiya, avtorizatsiya va logging middleware'larini tavsiflaydi.

## Auth Middleware

### middleware/auth.py

```python
from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from bson import ObjectId
from app.config.settings import settings
from app.config.database import mongo

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    JWT tokenni tekshirish va foydalanuvchi ma'lumotlarini olish
    """
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id = payload.get("userId")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token."
            )
        
        # Foydalanuvchini bazadan tekshirish
        user = await mongo.db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token. User not found."
            )
        
        if not user.get("isActive", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated."
            )
        
        return {
            "userId": str(user["_id"]),
            "username": user.get("username"),
            "email": user["email"],
            "role": user["role"],
            "sector": user.get("sector")
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
) -> Optional[dict]:
    """
    Ixtiyoriy autentifikatsiya - token bo'lmasa ham xato bermaydi
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

def require_role(*allowed_roles: str):
    """
    Belgilangan rollarga ega foydalanuvchilarni tekshirish
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Insufficient permissions."
            )
        return current_user
    return role_checker

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Admin yoki super_admin rolini talab qilish
    """
    if current_user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return current_user

async def require_super_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Faqat super_admin rolini talab qilish
    """
    if current_user["role"] != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Super admin only."
        )
    return current_user

def check_sector_access(sector_param: str = None):
    """
    Sektor bo'yicha kirish huquqini tekshirish
    """
    async def sector_checker(
        current_user: dict = Depends(get_current_user),
        sector: str = sector_param
    ):
        # Super admin va admin barcha sektorlarga kirishi mumkin
        if current_user["role"] in ["super_admin", "admin"]:
            return current_user
        
        # Sector admin faqat o'z sektoriga kirishi mumkin
        if current_user["role"] == "sector_admin":
            if sector and current_user.get("sector") != sector:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. You can only access {current_user.get('sector')} sector data."
                )
        
        return current_user
    return sector_checker

class RoleChecker:
    """
    Class-based role checker for more flexibility
    """
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles
    
    async def __call__(self, current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(self.allowed_roles)}"
            )
        return current_user

# Convenience instances
admin_required = RoleChecker(["admin", "super_admin"])
super_admin_required = RoleChecker(["super_admin"])
sector_admin_required = RoleChecker(["admin", "super_admin", "sector_admin"])
```

## Logger Middleware

### middleware/logger.py

```python
import time
import logging
from datetime import datetime
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# Logger sozlash
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("smart-city")

class LoggerMiddleware(BaseHTTPMiddleware):
    """
    Barcha so'rovlarni log qilish middleware
    """
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # So'rov boshlanish vaqti
        start_time = time.time()
        
        # Request ma'lumotlari
        request_id = f"{datetime.utcnow().timestamp()}"
        method = request.method
        url = str(request.url)
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Log request
        logger.info(f"[{request_id}] {method} {url} - IP: {client_ip}")
        
        try:
            # So'rovni bajarish
            response = await call_next(request)
            
            # Javob vaqti
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                f"[{request_id}] {method} {url} - "
                f"Status: {response.status_code} - "
                f"Time: {process_time:.3f}s"
            )
            
            # Response headerga vaqtni qo'shish
            response.headers["X-Process-Time"] = str(process_time)
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Xatoni log qilish
            process_time = time.time() - start_time
            logger.error(
                f"[{request_id}] {method} {url} - "
                f"Error: {str(e)} - "
                f"Time: {process_time:.3f}s"
            )
            raise

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """
    Batafsil request/response logging
    """
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Request body (agar kerak bo'lsa)
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                # Body ni qayta o'qish uchun
                request._body = body
            except:
                pass
        
        # Log request details
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client_ip": request.client.host if request.client else None,
        }
        
        if body:
            try:
                log_data["body_size"] = len(body)
            except:
                pass
        
        logger.debug(f"Request: {log_data}")
        
        response = await call_next(request)
        
        return response
```

## Error Handler Middleware

### middleware/error_handler.py

```python
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import traceback
import logging

logger = logging.getLogger("smart-city")

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Global xatolarni ushlash va formatlash
    """
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
            
        except HTTPException as e:
            # FastAPI HTTPException
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "success": False,
                    "message": e.detail,
                    "error_code": e.status_code
                }
            )
            
        except ValueError as e:
            # Validation xatolari
            logger.warning(f"Validation error: {str(e)}")
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": str(e),
                    "error_code": "VALIDATION_ERROR"
                }
            )
            
        except Exception as e:
            # Kutilmagan xatolar
            logger.error(f"Unexpected error: {str(e)}")
            logger.error(traceback.format_exc())
            
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Server xatosi yuz berdi",
                    "error_code": "INTERNAL_SERVER_ERROR"
                }
            )
```

## CORS Middleware

### main.py da CORS sozlash

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings

app = FastAPI(
    title="Smart City API",
    description="Smart City Backend API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Custom middlewares
from app.middleware.logger import LoggerMiddleware
from app.middleware.error_handler import ErrorHandlerMiddleware

app.add_middleware(LoggerMiddleware)
app.add_middleware(ErrorHandlerMiddleware)
```

## Middleware Ishlatish Misollari

### Route'larda ishlatish

```python
from fastapi import APIRouter, Depends
from app.middleware.auth import (
    get_current_user,
    require_admin,
    require_super_admin,
    check_sector_access,
    RoleChecker
)

router = APIRouter()

# Oddiy autentifikatsiya
@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}

# Admin talab qilish
@router.post("/users")
async def create_user(current_user: dict = Depends(require_admin)):
    return {"message": "User created"}

# Super admin talab qilish
@router.delete("/users/{id}/hard")
async def hard_delete(current_user: dict = Depends(require_super_admin)):
    return {"message": "User deleted permanently"}

# Custom role checker
@router.get("/sector-data")
async def get_sector_data(
    current_user: dict = Depends(RoleChecker(["admin", "sector_admin"]))
):
    return {"data": "sector data"}

# Sektor tekshirish
@router.get("/appeals/{sector}")
async def get_sector_appeals(
    sector: str,
    current_user: dict = Depends(check_sector_access())
):
    return {"appeals": []}
```

## Middleware Ketma-ketligi

```
Request
    ↓
[CORS Middleware]
    ↓
[Logger Middleware]
    ↓
[Error Handler Middleware]
    ↓
[Auth Middleware (route level)]
    ↓
Route Handler
    ↓
Response
```
