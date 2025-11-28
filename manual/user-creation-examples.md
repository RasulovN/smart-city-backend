# User Creation JSON Examples

## 1. Admin Self-Registration (New!)

**Endpoint**: `POST /api/admin/register`  
**Headers**: `Content-Type: application/json`  
**Security**: Requires admin registration code

### Admin Registration
```json
{
  "username": "newadmin",
  "email": "newadmin@smartcity.uz",
  "password": "NewAdmin123!@#",
  "role": "admin",
  "adminCode": "admin2024"
}
```

### Sector Admin Registration
```json
{
  "username": "newecologyadmin", 
  "email": "newecology@smartcity.uz",
  "password": "EcoAdmin123!@#",
  "role": "sector_admin",
  "sector": "ecology",
  "adminCode": "sector-admin"
}
```

**Registration Codes**:
- `admin2024` - For admin role (access to all sectors)
- `sector-admin` - For sector_admin role (specific sector required)

## 2. Super Admin Creation (Database Seeding)

**Method**: Run the seed script  
**Command**: `node seed.js`

**Default Credentials** (from .env):
```json
{
  "username": "superadmin",
  "email": "superadmin@smartcity.uz",
  "password": "SuperAdmin@2024",
  "role": "super_admin",
  "sector": "all",
  "isActive": true
}
```

## 3. Admin User Creation by Super Admin (API Request)

**Endpoint**: `POST /api/users`  
**Headers**: 
- `Authorization: Bearer <super_admin_or_admin_token>`
- `Content-Type: application/json`

**JSON Request Body**:
```json
{
  "username": "cityadmin",
  "email": "admin@smartcity.uz",
  "password": "Admin123!@#",
  "role": "admin",
  "sector": "all"
}
```

## 3. Sector Admin Creation (API Request)

**Endpoint**: `POST /api/users`  
**Headers**: 
- `Authorization: Bearer <super_admin_or_admin_token>`
- `Content-Type: application/json`

### Ecology Sector Admin
```json
{
  "username": "ecologyadmin",
  "email": "ecology@smartcity.uz", 
  "password": "EcoAdmin123!@#",
  "role": "sector_admin",
  "sector": "ecology"
}
```

### Health Sector Admin
```json
{
  "username": "healthadmin",
  "email": "health@smartcity.uz",
  "password": "HealthAdmin123!@#",
  "role": "sector_admin", 
  "sector": "health"
}
```

### Security Sector Admin
```json
{
  "username": "securityadmin", 
  "email": "security@smartcity.uz",
  "password": "SecurityAdmin123!@#",
  "role": "sector_admin",
  "sector": "security"
}
```

## Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | String | ✅ | 3-50 characters, unique |
| `email` | String | ✅ | Unique, lowercase |
| `password` | String | ✅ | Minimum 6 characters |
| `role` | String | ❌ | Default: `sector_admin` |
| `sector` | String | ❌* | Required if role is `sector_admin` |

*Sector is automatically set to "all" if role is "admin"

## Valid Values

**Roles**:
- `super_admin` (only via seeding)
- `admin` (access to all sectors)
- `sector_admin` (access to specific sector)

**Sectors**:
- `ecology` (environment, pollution, waste, green spaces)
- `health` (hospitals, clinics, emergency, public health)
- `security` (traffic, surveillance, emergency response, public safety)
- `all` (only for admin and super_admin roles)

## Example API Call using curl

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ecologyadmin",
    "email": "ecology@smartcity.uz",
    "password": "EcoAdmin123!@#",
    "role": "sector_admin",
    "sector": "ecology"
  }'
```

## Success Response

```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "id": "64f7a8b2c9d4e1f2a3b4c5d6",
    "username": "ecologyadmin",
    "email": "ecology@smartcity.uz",
    "role": "sector_admin",
    "sector": "ecology",
    "isActive": true,
    "createdAt": "2024-11-28T04:23:52.845Z"
  }
}
```

## Security Notes

1. **First Login**: Change super admin password after first login
2. **Password Requirements**: Minimum 6 characters, but use strong passwords
3. **Unique Credentials**: Email and username must be unique across all users
4. **Role Permissions**: 
   - Super Admin: Full system access
   - Admin: Access to all sectors and user management
   - Sector Admin: Access only to their assigned sector

## Troubleshooting

**Common Errors**:
- `User with this email or username already exists`: Choose different credentials
- `Invalid role`: Use only 'admin' or 'sector_admin' for API creation
- `Sector is required for sector_admin`: Include sector field for sector_admin role
- `Access denied`: Ensure you have proper admin privileges