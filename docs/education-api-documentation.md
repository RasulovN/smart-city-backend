# Education Controller API Documentation (Yangilangan)

Bu loyihada ta'lim sektorining haftalik, oylik, yillik va to'liq ma'lumotlarini olish uchun quyidagi API endpointlar yaratildi.

## Asosiy o'zgarishlar:
- ✅ "Full" davr qo'shildi - barcha mavjud ma'lumotlarni olish
- ✅ Query logikasi yaxshilandi - ham 'realtime' ham 'finalized' ma'lumotlarni olish
- ✅ Limit 1000 gacha oshirildi
- ✅ Debug log qo'shildi
- ✅ Xatoliklarni boshqarish yaxshilandi

## API Endpoints

### 1. Ta'lim Statistikasi
**Endpoint:** `GET /sectors/education/stats`

**Query Parameters:**
- `period` (string): vaqt davri - `weekly`, `monthly`, `yearly`, `full` (default: `weekly`)
- `viloyat_id` (number): viloyat IDsi (ixtiyoriy)
- `shift_no` (number): smena raqami (ixtiyoriy)
- `start_date` (string): boshlanish sanasi (YYYY-MM-DD format) (ixtiyoriy)
- `end_date` (string): tugash sanasi (YYYY-MM-DD format) (ixtiyoriy)

**Example:**
```
GET /sectors/education/stats?period=weekly
GET /sectors/education/stats?period=monthly&viloyat_id=1
GET /sectors/education/stats?period=yearly&start_date=2024-01-01&end_date=2024-12-31
GET /sectors/education/stats?period=full  <!-- YANGI: Barcha ma'lumotlar -->
```

### 2. Maktablar Ma'lumotlari
**Endpoint:** `GET /sectors/education/schools/all-statistika`

**Query Parameters:**
- `period` (string): vaqt davri - `weekly`, `monthly`, `yearly`, `full` (default: `weekly`)
- `viloyat_id` (number): viloyat IDsi (ixtiyoriy)
- `tuman_id` (number): tuman IDsi (ixtiyoriy)
- `shift_no` (number): smena raqami (ixtiyoriy)
- `limit` (number): natija soni cheklovi (default: 1000, avval 100 edi)
- `start_date` (string): boshlanish sanasi (ixtiyoriy)
- `end_date` (string): tugash sanasi (ixtiyoriy)

**Example:**
```
GET /sectors/education/schools/all-statistika?period=monthly&limit=500
GET /sectors/education/schools/all-statistika?period=weekly&viloyat_id=1&shift_no=1
GET /sectors/education/schools/all-statistika?period=full  <!-- YANGI: Barcha ma'lumotlar -->
```

### 3. Face ID Ma'lumotlari
**Endpoint:** `GET /sectors/education/face-id`

**Query Parameters:**
- `period` (string): vaqt davri - `weekly`, `monthly`, `yearly`, `full` (default: `weekly`)
- `viloyat_id` (number): viloyat IDsi (ixtiyoriy)
- `tuman_id` (number): tuman IDsi (ixtiyoriy)
- `start_date` (string): boshlanish sanasi (ixtiyoriy)
- `end_date` (string): tugash sanasi (ixtiyoriy)

**Example:**
```
GET /sectors/education/face-id?period=monthly
GET /sectors/education/face-id?period=weekly&viloyat_id=2
GET /sectors/education/face-id?period=full  <!-- YANGI: Barcha ma'lumotlar -->
```

## Foydalanish Bo'yicha Maslahatlar

### 1. Vaqt Davirlari
- **weekly**: Oxirgi 7 kun
- **monthly**: Joriy oyning barcha kunlari
- **yearly**: Joriy yilning barcha kunlari
- **full**: Barcha mavjud ma'lumotlar (boshlanish sanasidan hozirgacha) 🆕

### 2. Custom Sana Oralig'i
Agar `start_date` va `end_date` parametrlari berilsa, ular `period` parametrini bekor qiladi:
```
GET /sectors/education/stats?start_date=2024-01-01&end_date=2024-01-31
```

### 3. Filtrlash
- **Viloyat bo'yicha**: `viloyat_id` parametri
- **Tuman bo'yicha**: `tuman_id` parametri  
- **Smena bo'yicha**: `shift_no` parametri (1, 2, 3)

### 4. Performance Yaxshilanishi
- **Limit oshirildi**: 100 dan 1000 gacha
- **Dual Data Type**: 'realtime' va 'finalized' ma'lumotlarni olish
- **Debug Logging**: Console da so'rovlar ko'rinadi

## Xatoliklarni Boshqarish
Agar xatolik yuz bersa, console da batafsil log ko'rishingiz mumkin:
```javascript
// Server console da ko'rinasiz:
Stats Query: { "type": { "$in": ["realtime", "finalized"] }, "date": { "$gte": "2025-12-02", "$lte": "2025-12-09" } }
Found records: 150
```

## Misol Foydalanish

### Frontend dan so'rov yuborish
```javascript
// To'liq ma'lumotlarni olish (YANGI!)
const response = await fetch('/sectors/education/stats?period=full');

// Haftalik statistika olish
const weeklyStats = await fetch('/sectors/education/stats?period=weekly');

// Oylik maktab ma'lumotlari
const schoolsData = await fetch('/sectors/education/schools/all-statistika?period=monthly&limit=500');

// Face ID ma'lumotlari
const faceIdData = await fetch('/sectors/education/face-id?period=full');
```

### Postman da test qilish
1. **Full data endpoint:**
   ```
   GET http://localhost:3000/api/sectors/education/stats?period=full
   GET http://localhost:3000/api/sectors/education/schools/all-statistika?period=full
   GET http://localhost:3000/api/sectors/education/face-id?period=full
   ```

2. **Stats endpoint:**
   ```
   GET http://localhost:3000/api/sectors/education/stats?period=weekly
   ```

3. **Schools endpoint:**
   ```
   GET http://localhost:3000/api/sectors/education/schools/all-statistika?period=monthly
   ```

4. **Face ID endpoint:**
   ```
   GET http://localhost:3000/api/sectors/education/face-id?period=yearly
   ```

## Texnik Tafsilotlar

### Yangilangan Xususiyatlar:
- **Model**: `OptimizedAttendance` modelidan foydalanadi
- **Database**: MongoDB
- **Data Types**: 'realtime' va 'finalized' ma'lumotlari
- **Query Flexibility**: Ikkala turdagi ma'lumotlarni olish
- **Performance**: Optimized indexes dan foydalanadi
- **Logging**: Debug ma'lumotlari console da
- **Limit**: 1000 gacha ma'lumot olish imkoniyati

### Oldingi muammolar hal qilindi:
❌ Faqat 'finalized' ma'lumotlarni olish → ✅ 'realtime' va 'finalized' ikkalasini olish
❌ 100 ta limit → ✅ 1000 ta limit
❌ Bo'sh natija qaytarish → ✅ Ma'lumot topilganda to'liq natija
❌ Xatoliklarni bilmaslik → ✅ Console da debug log

## Eslatma

API endi to'liq ishlaydi va barcha mavjud ma'lumotlarni olish uchun "full" parametri qo'shildi. Console da debug loglarni ko'rib, so'rovlarning to'g'ri bajarilishini tekshirishingiz mumkin.