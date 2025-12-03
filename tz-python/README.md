# Smart City Backend - Python Texnik Topshiriq

Bu loyiha Node.js (Express) da yozilgan Smart City backend tizimini Python (FastAPI) ga o'tkazish uchun texnik hujjatdir.

## Loyiha Tuzilishi

```
smart-city-python/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py         # Environment variables
│   │   └── database.py         # MongoDB & PostgreSQL connections
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # User model (MongoDB)
│   │   ├── sector.py           # Sector model (MongoDB)
│   │   ├── company.py          # Company model (MongoDB)
│   │   ├── appeal.py           # Appeal model (MongoDB)
│   │   └── pg_models.py        # PostgreSQL models (SQLAlchemy)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # Pydantic schemas
│   │   ├── sector.py
│   │   ├── company.py
│   │   └── appeal.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication routes
│   │   ├── admin.py            # Admin routes
│   │   ├── sector.py           # Sector routes
│   │   ├── appeals.py          # Appeals routes
│   │   └── ui.py               # UI routes
│   ├── controllers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── sector.py
│   │   ├── appeals.py
│   │   └── ui.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py             # JWT authentication
│   │   └── logger.py           # Request logging
│   ├── services/
│   │   ├── __init__.py
│   │   ├── email.py            # Email service
│   │   ├── notification.py     # Notification service
│   │   └── analytics.py        # Analytics service
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       └── helpers.py
├── requirements.txt
├── .env
├── .env.example
└── README.md
```

## Asosiy Texnologiyalar

| Node.js | Python |
|---------|--------|
| Express | FastAPI |
| Mongoose | Motor (async MongoDB) |
| Prisma | SQLAlchemy + asyncpg |
| jsonwebtoken | python-jose |
| bcrypt | passlib[bcrypt] |
| nodemailer | aiosmtplib |
| express-validator | Pydantic |

## Modullar Ro'yxati

1. [auth.md](./auth.md) - Autentifikatsiya moduli
2. [admin.md](./admin.md) - Admin boshqaruvi moduli
3. [sector.md](./sector.md) - Sektorlar moduli
4. [appeals.md](./appeals.md) - Murojaatlar moduli
5. [company.md](./company.md) - Kompaniyalar moduli
6. [ui.md](./ui.md) - UI API moduli
7. [models.md](./models.md) - Ma'lumotlar modellari
8. [middleware.md](./middleware.md) - Middleware'lar
9. [services.md](./services.md) - Xizmatlar

## Environment Variables (.env)

```env
# Server
PORT=8000
DEBUG=True

# MongoDB
MONGO_URL=mongodb://localhost:27017/smart-city

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smart_city

# JWT
JWT_SECRET=smart-city-secret-key-change-this-in-production-2024
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=1440

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

# CORS
CORS_ORIGINS=http://localhost:5173
```

## requirements.txt

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
motor==3.3.2
pymongo==4.6.1
sqlalchemy==2.0.25
asyncpg==0.29.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.3
pydantic-settings==2.1.0
aiosmtplib==3.0.1
python-dotenv==1.0.0
email-validator==2.1.0
```
