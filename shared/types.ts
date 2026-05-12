// Shared types between client and server

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'CHEF'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIAL'
export type PaymentMethod = 'CASH' | 'CARD' | 'WALLET' | 'BANK_TRANSFER'

export interface MenuItem {
  id: string
  name: string
  nameAr: string
  description: string | null
  descriptionAr: string | null
  price: number
  discountPrice: number | null
  categoryId: string
  image: string | null
  isAvailable: boolean
  isActive: boolean
  prepTime: number
  sortOrder: number
  category?: MenuCategory
  modifiers?: MenuModifier[]
}

export interface MenuCategory {
  id: string
  name: string
  nameAr: string
  description: string | null
  sortOrder: number
  isActive: boolean
  items?: MenuItem[]
}

export interface MenuModifier {
  id: string
  name: string
  nameAr: string
  type: 'SINGLE' | 'MULTIPLE'
  required: boolean
  min: number
  max: number
  options: ModifierOption[]
}

export interface ModifierOption {
  id: string
  name: string
  nameAr: string
  price: number
}

export interface OrderItem {
  id: string
  orderId: string
  menuItemId: string
  menuItem: MenuItem
  quantity: number
  price: number
  notes: string | null
  selectedModifiers: Record<string, string[]>
  status: OrderStatus
}

export interface Order {
  id: string
  orderNumber: number
  tableNumber: string | null
  customerName: string | null
  customerPhone: string | null
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE'
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod | null
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  notes: string | null
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface WifiSession {
  id: string
  qrCodeId: string
  macAddress: string | null
  ipAddress: string | null
  phoneNumber: string | null
  durationMinutes: number
  status: 'ACTIVE' | 'EXPIRED' | 'DISCONNECTED'
  startTime: string
  endTime: string
}

export interface Table {
  id: string
  number: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'
  qrCode: string
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  pin: string
  isActive: boolean
  shiftId: string | null
}

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  days: number[]
}

export interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  guests: number
  tableId: string | null
  dateTime: string
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
}

export interface BusinessSettings {
  id: string
  name: string
  nameAr: string
  logo: string | null
  taxRate: number
  serviceChargeRate: number
  currency: string
  wifiDuration: number
  wifiVoucherEnabled: boolean
  autoPrintOrders: boolean
  kitchenDisplayEnabled: boolean
}
