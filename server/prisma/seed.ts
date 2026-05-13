import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create or get demo business
  const business = await prisma.business.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'مقهى الأصيل',
      nameAr: 'مقهى الأصيل',
      taxRate: 15,
      serviceChargeRate: 10,
      currency: 'DZD',
      wifiDuration: 120,
    },
  })

  // Create or get admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: { password: hashedPassword },
    create: {
      name: 'مدير النظام',
      email: 'admin@cafe.com',
      password: hashedPassword,
      phone: '0500000000',
      role: 'ADMIN',
      businessId: business.id,
    },
  })

  // Create menu categories
  const coffeeCat = await prisma.menuCategory.create({
    data: {
      businessId: business.id,
      name: 'Coffee',
      nameAr: 'قهوة',
      sortOrder: 1,
    },
  })

  const coldDrinksCat = await prisma.menuCategory.create({
    data: {
      businessId: business.id,
      name: 'Cold Drinks',
      nameAr: 'مشروبات باردة',
      sortOrder: 2,
    },
  })

  const foodCat = await prisma.menuCategory.create({
    data: {
      businessId: business.id,
      name: 'Food',
      nameAr: 'طعام',
      sortOrder: 3,
    },
  })

  const dessertsCat = await prisma.menuCategory.create({
    data: {
      businessId: business.id,
      name: 'Desserts',
      nameAr: 'حلويات',
      sortOrder: 4,
    },
  })

  // Create menu items
  const turkishCoffee = await prisma.menuItem.create({
    data: {
      categoryId: coffeeCat.id,
      name: 'Turkish Coffee',
      nameAr: 'قهوة تركية',
      description: 'Traditional Turkish coffee',
      descriptionAr: 'قهوة تركية تقليدية',
      price: 15,
      prepTime: 5,
      sortOrder: 1,
    },
  })

  const espresso = await prisma.menuItem.create({
    data: {
      categoryId: coffeeCat.id,
      name: 'Espresso',
      nameAr: 'إسبريسو',
      description: 'Double shot espresso',
      descriptionAr: 'إسبريسو دبل',
      price: 12,
      prepTime: 3,
      sortOrder: 2,
    },
  })

  const latte = await prisma.menuItem.create({
    data: {
      categoryId: coffeeCat.id,
      name: 'Latte',
      nameAr: 'لاتيه',
      description: 'Espresso with steamed milk',
      descriptionAr: 'إسبريسو مع حليب مبخر',
      price: 18,
      prepTime: 5,
      sortOrder: 3,
    },
  })

  const mojito = await prisma.menuItem.create({
    data: {
      categoryId: coldDrinksCat.id,
      name: 'Mojito',
      nameAr: 'موخيتو',
      description: 'Fresh mint mojito',
      descriptionAr: 'موخيتو نعناع طازج',
      price: 20,
      prepTime: 5,
      sortOrder: 1,
    },
  })

  const iceLatte = await prisma.menuItem.create({
    data: {
      categoryId: coldDrinksCat.id,
      name: 'Iced Latte',
      nameAr: 'لاتيه مثلج',
      price: 20,
      prepTime: 3,
      sortOrder: 2,
    },
  })

  const sandwich = await prisma.menuItem.create({
    data: {
      categoryId: foodCat.id,
      name: 'Club Sandwich',
      nameAr: 'ساندويتش كلوب',
      price: 35,
      prepTime: 15,
      sortOrder: 1,
    },
  })

  const pasta = await prisma.menuItem.create({
    data: {
      categoryId: foodCat.id,
      name: 'Pasta Alfredo',
      nameAr: 'باستا ألفريدو',
      price: 45,
      prepTime: 20,
      sortOrder: 2,
    },
  })

  // Add modifiers for coffee items
  await prisma.menuModifier.create({
    data: {
      menuItemId: latte.id,
      name: 'Milk Type',
      nameAr: 'نوع الحليب',
      type: 'SINGLE',
      required: true,
      options: {
        create: [
          { name: 'Whole Milk', nameAr: 'حليب كامل', price: 0, sortOrder: 1 },
          { name: 'Oat Milk', nameAr: 'حليب شوفان', price: 3, sortOrder: 2 },
          { name: 'Almond Milk', nameAr: 'حليب لوز', price: 3, sortOrder: 3 },
        ],
      },
    },
  })

  await prisma.menuModifier.create({
    data: {
      menuItemId: latte.id,
      name: 'Size',
      nameAr: 'الحجم',
      type: 'SINGLE',
      required: true,
      options: {
        create: [
          { name: 'Medium', nameAr: 'وسط', price: 0, sortOrder: 1 },
          { name: 'Large', nameAr: 'كبير', price: 5, sortOrder: 2 },
        ],
      },
    },
  })

  await prisma.menuModifier.create({
    data: {
      menuItemId: turkishCoffee.id,
      name: 'Sugar',
      nameAr: 'السكر',
      type: 'SINGLE',
      required: true,
      options: {
        create: [
          { name: 'No Sugar', nameAr: 'بدون سكر', price: 0, sortOrder: 1 },
          { name: 'Less Sugar', nameAr: 'قليل السكر', price: 0, sortOrder: 2 },
          { name: 'Medium Sugar', nameAr: 'وسط', price: 0, sortOrder: 3 },
          { name: 'Sweet', nameAr: 'سكري', price: 0, sortOrder: 4 },
        ],
      },
    },
  })

  // Create tables
  const tables = []
  for (let i = 1; i <= 15; i++) {
    const table = await prisma.table.create({
      data: {
        businessId: business.id,
        number: i.toString(),
        capacity: i <= 5 ? 2 : i <= 10 ? 4 : 6,
      },
    })
    tables.push(table)
  }

  // Create shifts
  await prisma.shift.create({
    data: {
      businessId: business.id,
      name: 'Morning Shift',
      nameAr: 'الفترة الصباحية',
      startTime: '06:00',
      endTime: '14:00',
      days: 127, // All week
    },
  })

  await prisma.shift.create({
    data: {
      businessId: business.id,
      name: 'Evening Shift',
      nameAr: 'الفترة المسائية',
      startTime: '14:00',
      endTime: '22:00',
      days: 127,
    },
  })

  await prisma.shift.create({
    data: {
      businessId: business.id,
      name: 'Night Shift',
      nameAr: 'الفترة الليلية',
      startTime: '22:00',
      endTime: '02:00',
      days: 127,
    },
  })

  // Generate WiFi QR codes
  const crypto = await import('crypto')
  for (let i = 0; i < 3; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    await prisma.wifiQrCode.create({
      data: {
        businessId: business.id,
        code,
        label: `WiFi Table Group ${i + 1}`,
        durationMinutes: 120,
        maxSessions: 50,
      },
    })
  }

  console.log('✅ Seed data created successfully!')
  console.log('📧 Admin login: admin@cafe.com / admin123')
  console.log(`🏪 Business: ${business.name} (ID: ${business.id})`)
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
