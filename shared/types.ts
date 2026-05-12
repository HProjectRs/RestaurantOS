// Shared types between client and server

/** Role assigned to system users for access control */
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'CHEF'

/** Possible states of an order throughout its lifecycle */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
/** Payment status tracking for orders */
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIAL'
/** Accepted payment methods in the system */
export type PaymentMethod = 'CASH' | 'CARD' | 'WALLET' | 'BANK_TRANSFER'

/** Menu item with bilingual (Arabic/English) support */
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

/** Menu category for grouping related items */
export interface MenuCategory {
  id: string
  name: string
  nameAr: string
  description: string | null
  sortOrder: number
  isActive: boolean
  items?: MenuItem[]
}

/** Modifier group for menu items (e.g. size, extras) */
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

/** Individual option within a modifier group */
export interface ModifierOption {
  id: string
  name: string
  nameAr: string
  price: number
}

/** Individual item entry within an order */
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

/** Complete order with items, pricing, and payment details */
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

/** Guest WiFi session for internet access */
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

/** Restaurant table with QR code for self-ordering */
export interface Table {
  id: string
  number: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'
  qrCode: string
}

/** Staff member with role and shift assignment */
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

/** Work shift definition with time range and active days */
export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  days: number[]
}

/** Table reservation made by a customer */
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

/** Business-level configuration settings */
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
