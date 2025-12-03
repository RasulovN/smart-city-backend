# Models Moduli - Ma'lumotlar Modellari

## Umumiy Ma'lumot

Bu modul loyihadagi barcha ma'lumotlar modellarini tavsiflaydi. MongoDB uchun Motor/Pydantic va PostgreSQL uchun SQLAlchemy ishlatiladi.

## MongoDB Modellari

### 1. User Model (Foydalanuvchi)

```python
# models/user.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(None, min_length=9, max_length=15)
    password: str = Field(..., min_length=6)
    role: str = Field(default="sector_admin", pattern="^(super_admin|admin|sector_admin)$")
    sector: Optional[str] = Field(
        default=None,
        pattern="^(ecology|health|security|all|appeals|tasks|healthcare|education|transport|infrastructure|social|economic|management|utilities|other)$"
    )
    isActive: bool = True
    lastLogin: Optional[datetime] = None
    createdBy: Optional[PyObjectId] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "username": "admin_user",
                "email": "admin@example.com",
                "password": "password123",
                "role": "admin",
                "sector": "all"
            }
        }

# MongoDB Collection Schema
USER_COLLECTION_SCHEMA = {
    "validator": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["email", "password"],
            "properties": {
                "username": {
                    "bsonType": "string",
                    "minLength": 3,
                    "maxLength": 50
                },
                "email": {
                    "bsonType": "string",
                    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                },
                "phone": {
                    "bsonType": "string"
                },
                "password": {
                    "bsonType": "string",
                    "minLength": 6
                },
                "role": {
                    "bsonType": "string",
                    "enum": ["super_admin", "admin", "sector_admin"]
                },
                "sector": {
                    "bsonType": ["string", "null"],
                    "enum": [
                        "ecology", "health", "security", "all", "appeals",
                        "tasks", "healthcare", "education", "transport",
                        "infrastructure", "social", "economic", "management",
                        "utilities", "other", None
                    ]
                },
                "isActive": {"bsonType": "bool"},
                "lastLogin": {"bsonType": ["date", "null"]},
                "createdBy": {"bsonType": ["objectId", "null"]},
                "createdAt": {"bsonType": "date"},
                "updatedAt": {"bsonType": "date"}
            }
        }
    }
}

# Indexes
USER_INDEXES = [
    {"keys": [("email", 1)], "unique": True},
    {"keys": [("username", 1)], "unique": True, "sparse": True},
    {"keys": [("role", 1)]},
    {"keys": [("sector", 1)]},
    {"keys": [("isActive", 1)]}
]
```

### 2. Sector Model (Sektor)

```python
# models/sector.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId

class SectorModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., min_length=3, max_length=50)
    slug: str = Field(..., pattern="^[a-z0-9-]+$")
    description: str = Field(..., min_length=3, max_length=500)
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Indexes
SECTOR_INDEXES = [
    {"keys": [("slug", 1)], "unique": True},
    {"keys": [("name", 1)], "unique": True},
    {"keys": [("isActive", 1)]}
]
```

### 3. Company Model (Kompaniya)

```python
# models/company.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

class AddressModel(BaseModel):
    fullAddress: Optional[str] = None
    long: Optional[float] = None
    lat: Optional[float] = None

class CompanyModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., min_length=3, max_length=50)
    slug: str = Field(..., pattern="^[a-z0-9-]+$")
    description: str = Field(..., min_length=3, max_length=500)
    sector: str = Field(
        ...,
        pattern="^(infrastructure|environment|transport|health|education|social|economic|other|ecology|utilities)$"
    )
    email: Optional[EmailStr] = None
    phone: Optional[int] = None
    inn: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(government|nongovernment|other)$")
    address: Optional[AddressModel] = None
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Indexes
COMPANY_INDEXES = [
    {"keys": [("slug", 1)], "unique": True},
    {"keys": [("sector", 1)]},
    {"keys": [("type", 1)]},
    {"keys": [("isActive", 1)]}
]
```

### 4. Appeal Model (Murojaat)

```python
# models/appeal.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

class CoordinatesModel(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocationModel(BaseModel):
    district: Optional[str] = None
    address: Optional[str] = None
    coordinates: Optional[CoordinatesModel] = None

class AttachmentModel(BaseModel):
    filename: str
    originalName: str
    mimetype: str
    size: int
    uploadDate: datetime = Field(default_factory=datetime.utcnow)

class AdminResponseModel(BaseModel):
    message: Optional[str] = Field(None, max_length=1000)
    respondedBy: Optional[PyObjectId] = None
    respondedAt: Optional[datetime] = None

class RatingModel(BaseModel):
    score: Optional[int] = Field(None, ge=1, le=5)
    feedback: Optional[str] = None
    ratedAt: Optional[datetime] = None

class AppealModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    
    # Personal Information
    firstName: str = Field(..., min_length=2, max_length=50)
    lastName: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r"^[\+]?[0-9\s\-\(\)]{10,}$")
    
    # Appeal Information
    title: str = Field(..., min_length=5, max_length=200)
    message: str = Field(..., min_length=10, max_length=2000)
    
    # Classification
    type: str = Field(
        ...,
        pattern="^(complaint|suggestion|question|request|appreciation|other)$"
    )
    sector: str = Field(
        ...,
        pattern="^(infrastructure|environment|ecology|transport|health|education|social|economic|utilities|other)$"
    )
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    
    # Status
    status: str = Field(
        default="open",
        pattern="^(open|in_progress|waiting_response|closed|rejected)$"
    )
    
    # Admin Response
    adminResponse: Optional[AdminResponseModel] = None
    
    # Location
    location: Optional[LocationModel] = None
    
    # Attachments
    attachments: List[AttachmentModel] = []
    
    # Follow-up
    followUpRequired: bool = False
    followUpDate: Optional[datetime] = None
    
    # Metadata
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    
    # Statistics
    viewCount: int = 0
    
    # Rating
    rating: Optional[RatingModel] = None
    
    # Timestamps
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
    
    # Virtual fields
    @property
    def fullName(self) -> str:
        return f"{self.firstName} {self.lastName}"
    
    @property
    def isOverdue(self) -> bool:
        if not self.followUpDate:
            return False
        return datetime.utcnow() > self.followUpDate

# Indexes
APPEAL_INDEXES = [
    {"keys": [("status", 1), ("createdAt", -1)]},
    {"keys": [("type", 1), ("sector", 1)]},
    {"keys": [("email", 1)]},
    {"keys": [("priority", 1), ("status", 1)]},
    {"keys": [("sector", 1)]},
    {"keys": [("createdAt", -1)]}
]
```

## PostgreSQL Modellari (SQLAlchemy)

### pg_models.py

```python
# models/pg_models.py
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    ForeignKey, Numeric, Text
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class TestModel(Base):
    """Test model - namuna uchun"""
    __tablename__ = "test_models"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PgUser(Base):
    """PostgreSQL User model"""
    __tablename__ = "pg_users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Category(Base):
    """Category model"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = relationship("Product", back_populates="category")

class Product(Base):
    """Product model"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("Category", back_populates="products")
```

## Database Configuration

### config/database.py

```python
# config/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings

# MongoDB
class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

mongo = MongoDB()

async def connect_mongodb():
    mongo.client = AsyncIOMotorClient(settings.MONGO_URL)
    mongo.db = mongo.client.get_database("smart-city")
    print("✅ MongoDB connected")

async def close_mongodb():
    if mongo.client:
        mongo.client.close()
        print("MongoDB disconnected")

# Shortcut
db = property(lambda self: mongo.db)

# PostgreSQL
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=True)

async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_pg_session() -> AsyncSession:
    async with async_session() as session:
        yield session

async def connect_postgres():
    try:
        async with engine.begin() as conn:
            # Test connection
            await conn.run_sync(lambda conn: None)
        print("✅ PostgreSQL connected")
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        raise

async def close_postgres():
    await engine.dispose()
    print("PostgreSQL disconnected")
```

## Enum Values Summary

### Roles
| Value | Description |
|-------|-------------|
| `super_admin` | Tizim bosh administratori |
| `admin` | Administrator |
| `sector_admin` | Sektor administratori |

### Sectors
| Value | Description |
|-------|-------------|
| `ecology` | Ekologiya |
| `health` | Sog'liqni saqlash |
| `security` | Xavfsizlik |
| `infrastructure` | Infrastruktura |
| `transport` | Transport |
| `education` | Ta'lim |
| `social` | Ijtimoiy |
| `economic` | Iqtisodiy |
| `utilities` | Kommunal xizmatlar |
| `other` | Boshqa |
| `all` | Barcha sektorlar |

### Appeal Types
| Value | Description |
|-------|-------------|
| `complaint` | Shikoyat |
| `suggestion` | Taklif |
| `question` | Savol |
| `request` | So'rov |
| `appreciation` | Minnatdorchilik |
| `other` | Boshqa |

### Appeal Status
| Value | Description |
|-------|-------------|
| `open` | Ochiq |
| `in_progress` | Jarayonda |
| `waiting_response` | Javob kutilmoqda |
| `closed` | Yopilgan |
| `rejected` | Rad etilgan |

### Priority
| Value | Description |
|-------|-------------|
| `low` | Past |
| `medium` | O'rta |
| `high` | Yuqori |
| `urgent` | Shoshilinch |

### Company Types
| Value | Description |
|-------|-------------|
| `government` | Davlat |
| `nongovernment` | Nodavlat |
| `other` | Boshqa |
