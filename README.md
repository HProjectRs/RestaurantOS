# RestaurantOS - نظام إدارة المطاعم والمقاهي

نظام متكامل لإدارة المطاعم والمقاهي مع العديد من الميزات الجاهزة للبيع.

## المميزات

- **نظام QR Code للإنترنت** - مسح رمز QR → إدخال رقم الجوال → اتصال مجاني بالإنترنت
- **نظام الطلبات الفوري** - طلب من المنيو → يصل فوراً لشاشة الطاهي
- **شاشة الطاهي (Kitchen Display)** - عرض الطلبات بشكل مباشر مع إشعارات صوتية
- **إدارة القائمة** - إضافة وتعديل الأصناف والفئات والإضافات
- **نقاط البيع (POS)** - طلبات داخلية وخارجية وتوصيل
- **إدارة الطاولات** - مع رموز QR لكل طاولة
- **إدارة الموظفين والمناوبات**
- **الحجوزات** - حجز الطاولات أونلاين
- **التقارير والإحصائيات** - مبيعات، فئات، أداء الموظفين
- **WiFi للضيوف** - نظام متكامل مع QR والجلسات
- **نظام عربي/إنجليزي** - واجهة كاملة بالعربية

## التقنيات

- **الواجهة**: React + TypeScript + Tailwind CSS + Vite (PWA)
- **الخلفية**: Node.js + Express + TypeScript
- **قاعدة البيانات**: PostgreSQL + Prisma ORM
- **الاتصال الفوري**: Socket.io
- **الحاويات**: Docker

## التشغيل السريع

### 1. باستخدام Docker

```bash
docker-compose up -d
```

### 2. تشغيل يدوي

**قاعدة البيانات:**
```bash
docker run -d --name restaurantos-db -e POSTGRES_DB=restaurantos -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine
```

**السيرفر:**
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

**الواجهة:**
```bash
cd client
npm install
npm run dev
```

### بيانات الاختبار

- **البريد**: admin@cafe.com
- **كلمة المرور**: admin123
- **شاشة الطاهي**: http://localhost:5173/kitchen

## هيكل المشروع

```
RestaurantOS/
├── server/          # الخلفية (Express + Prisma + Socket.io)
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── sockets/
│   └── prisma/
├── client/          # الواجهة (React + Tailwind + PWA)
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── store/
│       └── services/
└── shared/          # مشترك
```

## الترخيص

هذا المشروع منتج تجاري - جميع الحقوق محفوظة.
