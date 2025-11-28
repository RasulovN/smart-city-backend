# 🏙️ Smart City Backend API

Smart City loyihasi uchun to'liq authentication va authorization tizimi bilan backend API.

## 📋 Xususiyatlar

- ✅ **JWT Authentication** - Token-based authentication
- ✅ **Role-Based Access Control (RBAC)** - 3 xil rol: Super Admin, Admin, Sector Admin
- ✅ **Sector-Based Authorization** - Har bir sector admin faqat o'z sectoriga kiradi
- ✅ **User Management** - Super admin tomonidan foydalanuvchilarni boshqarish
- ✅ **Password Hashing** - Bcrypt bilan xavfsiz parol saqlash
- ✅ **MongoDB Integration** - Mongoose ORM bilan
- ✅ **RESTful API** - Standard REST API endpoints

## 🎭 Rollar va Huquqlar

### 1. Super Admin
- Barcha API'larga to'liq kirish
- Barcha adminlarni qo'shish, o'chirish, tahrirlash
- Faqat **bitta** super admin bo'ladi

### 2. Admin
- Barcha sector API'lariga kirish
- Barcha foydalanuvchilarni ko'rish
- Foydalanuvchilarni boshqara olmaydi (faqat ko'radi)

### 3. Sector Admin
Uch xil sector mavjud:

#### 🌱 Ecology Sector
- Environment API
- Ecology API
- Pollution monitoring

#### 🏥 Health Sector
- Health API
- Hospitals API
- Clinics API

#### 🚦 Security Sector
- Traffic API
- Transport API
- Security API

## 🚀 O'rnatish

### 1. Repository'ni Clone qiling
```bash
git clone <repository-url>
cd smart-city/backend
```

### 2. Dependencies'larni o'rnating
```bash
npm install
```

### 3. MongoDB'ni ishga tushiring
```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

### 4. Environment Variables'ni sozlang
`.env` faylini yarating va quyidagilarni kiriting:

```env
# Server Configuration
PORT=5000

# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017/smart-city

# JWT Configuration
JWT_SECRET=smart-city-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=24h

# Super Admin Default Credentials
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_EMAIL=superadmin@smartcity.uz
SUPER_ADMIN_PASSWORD=SuperAdmin@2024
```

### 5. Super Admin yarating
```bash
npm run seed
```

**Output:**
```
✅ Super Admin created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: superadmin@smartcity.uz
👤 Username: superadmin
🔑 Password: SuperAdmin@2024
🎭 Role: super_admin
🏢 Sector: all
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6. Serverni ishga tushiring
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Server ishga tushganda:
```
✅ MongoDB connected successfully
🚀 Server running on: http://localhost:5000
📚 API Documentation: http://localhost:5000/api

💡 To create super admin, run: node seed.js
```

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/refresh-token` - Refresh JWT token

### Admin Management (Super Admin only)
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PATCH /api/admin/users/:id/activate` - Activate user
- `PATCH /api/admin/users/:id/deactivate` - Deactivate user
- `POST /api/admin/users/:id/reset-password` - Reset password
- `GET /api/admin/users/sector/:sector` - Get users by sector

### Sector APIs
- `GET /api/environment` - Environment data (Ecology sector)
- `GET /api/traffic` - Traffic data (Security sector)
- `GET /api/transport` - Transport data (Security sector)

To'liq API documentation: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)

## 🧪 Test qilish

### 1. Super Admin bilan login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "superadmin@smartcity.uz",
  "password": "SuperAdmin@2024"
}
```

### 2. Token olish
Response'dan `token` ni oling va keyingi requestlarda ishlating:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Sector Admin yaratish
```bash
POST http://localhost:5000/api/admin/users
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "username": "ecology_admin",
  "email": "ecology@smartcity.uz",
  "password": "Ecology123",
  "role": "sector_admin",
  "sector": "ecology"
}
```

### 4. Sector Admin bilan login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "ecology@smartcity.uz",
  "password": "Ecology123"
}
```

### 5. Sector API'ga kirish
```bash
# Ecology admin environment API'ga kirishi mumkin ✅
GET http://localhost:5000/api/environment
Authorization: Bearer <ecology_admin_token>

# Lekin traffic API'ga kira olmaydi ❌
GET http://localhost:5000/api/traffic
Authorization: Bearer <ecology_admin_token>
# Response: 403 Forbidden
```

## 📂 Loyiha Strukturasi

```
backend/
├── config/
│   └── index.js                 # Configuration settings
├── controller/
│   ├── auth.controller.js       # Authentication logic
│   ├── admin.controller.js      # User management
│   ├── environmentController.js # Environment API
│   ├── trafficController.js     # Traffic API
│   └── transportController.js   # Transport API
├── middleware/
│   ├── auth.middleware.js       # JWT & Role verification
│   └── logger.js                # Request logging
├── models/
│   └── user.js                  # User model with roles
├── routes/
│   ├── auth.route.js            # Auth routes
│   ├── admin.route.js           # Admin routes
│   ├── environmentRoutes.js     # Environment routes
│   ├── trafficRoutes.js         # Traffic routes
│   ├── transportRoutes.js       # Transport routes
│   └── index.route.js           # Main router
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── index.js                     # Server entry point
├── seed.js                      # Super admin seeder
├── package.json                 # Dependencies
├── API_DOCUMENTATION.md         # Full API docs
└── README.md                    # This file
```

## 🔒 Xavfsizlik

### Password Requirements
- Minimum 6 ta belgi
- Bcrypt bilan hash qilinadi (10 rounds)

### JWT Token
- 24 soat amal qiladi
- Har bir request'da verify qilinadi
- Expired token'lar rad etiladi

### Role-Based Access
- Har bir endpoint role'ga qarab himoyalangan
- Sector admin faqat o'z sectoriga kiradi
- Super admin barcha huquqlarga ega

## 🛠️ Development

### Available Scripts
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Create super admin
npm run seed
```

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGO_URL` | MongoDB connection string | mongodb://localhost:27017/smart-city |
| `JWT_SECRET` | JWT secret key | (required) |
| `JWT_EXPIRES_IN` | Token expiration time | 24h |
| `SUPER_ADMIN_USERNAME` | Super admin username | superadmin |
| `SUPER_ADMIN_EMAIL` | Super admin email | superadmin@smartcity.uz |
| `SUPER_ADMIN_PASSWORD` | Super admin password | SuperAdmin@2024 |

## 📊 Database Schema

### User Model
```javascript
{
  username: String,        // Unique username
  email: String,           // Unique email
  password: String,        // Hashed password
  role: String,            // super_admin | admin | sector_admin
  sector: String,          // ecology | health | security | all
  isActive: Boolean,       // Account status
  lastLogin: Date,         // Last login timestamp
  createdBy: ObjectId,     // User who created this account
  createdAt: Date,         // Creation timestamp
  updatedAt: Date          // Update timestamp
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
# Windows: mongod
# Linux/Mac: sudo systemctl start mongod
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3000
```

### Token Expired
```bash
# Use refresh token endpoint
POST /api/auth/refresh-token
Authorization: Bearer <expired_token>
```

## 📝 To-Do

- [ ] Add refresh token to database
- [ ] Add password reset via email
- [ ] Add rate limiting
- [ ] Add request logging to file
- [ ] Add API documentation with Swagger
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add Docker support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

Smart City Development Team

## 📞 Support

Agar savollar bo'lsa:
- API Documentation: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)
- Issues: GitHub Issues
- Email: support@smartcity.uz

---

**Happy Coding! 🚀**
