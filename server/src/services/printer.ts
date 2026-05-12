interface ReceiptData {
  businessName: string
  businessNameAr?: string
  orderNumber: number
  tableNumber?: string
  cashierName?: string
  items: Array<{
    name: string
    nameAr?: string
    quantity: number
    price: number
    modifiers?: string[]
  }>
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  paymentMethod?: string
  paymentStatus?: string
  date: string
  customerName?: string
  footer?: string
}

function padCenter(text: string, width: number): string {
  const padding = Math.max(0, width - text.length)
  const left = Math.floor(padding / 2)
  const right = padding - left
  return ' '.repeat(left) + text + ' '.repeat(right)
}

function padRight(text: string, width: number): string {
  const padding = Math.max(0, width - text.length)
  return ' '.repeat(padding) + text
}

export function generateEscPosReceipt(data: ReceiptData): Uint8Array {
  const WIDTH = 32
  const LF = '\n'
  const lines: string[] = []

  // Header
  lines.push('')
  lines.push(padCenter(data.businessNameAr || data.businessName, WIDTH))
  lines.push('='.repeat(WIDTH))

  // Order info
  lines.push(`طلب #${data.orderNumber}`)
  if (data.tableNumber) lines.push(`طاولة: ${data.tableNumber}`)
  if (data.customerName) lines.push(`العميل: ${data.customerName}`)
  lines.push(`التاريخ: ${data.date}`)
  if (data.cashierName) lines.push(`الكاشير: ${data.cashierName}`)
  lines.push('-'.repeat(WIDTH))

  // Items header
  lines.push('الكمية  الصنف               السعر')
  lines.push('-'.repeat(WIDTH))

  // Items
  for (const item of data.items) {
    const name = (item.nameAr || item.name).substring(0, 16)
    const qty = `${item.quantity}`
    const price = `${(item.price * item.quantity).toFixed(2)}`
    lines.push(`${qty.padEnd(4)}   ${name.padEnd(14)} ${price.padStart(8)}`)
    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        lines.push(`       ${mod.substring(0, 20)}`)
      }
    }
  }

  lines.push('-'.repeat(WIDTH))

  // Totals
  const fmtAmount = (label: string, amount: number) => {
    return `${label.padEnd(20)} ${amount.toFixed(2).padStart(10)}`
  }

  lines.push(fmtAmount('المجموع الفرعي', data.subtotal))
  lines.push(fmtAmount('الضريبة', data.tax))
  if (data.serviceCharge > 0) {
    lines.push(fmtAmount('خدمة', data.serviceCharge))
  }
  if (data.discount > 0) {
    lines.push(fmtAmount('الخصم', data.discount))
  }
  lines.push('='.repeat(WIDTH))
  lines.push(fmtAmount('الإجمالي', data.total))
  lines.push('='.repeat(WIDTH))

  // Payment info
  if (data.paymentMethod) {
    lines.push(`طريقة الدفع: ${data.paymentMethod}`)
  }
  if (data.paymentStatus === 'PAID') {
    lines.push(padCenter('مدفوع', WIDTH))
  }

  lines.push('')
  if (data.footer) {
    lines.push(padCenter(data.footer, WIDTH))
  }
  lines.push(padCenter('شكراً لزيارتكم', WIDTH))
  lines.push('')
  lines.push('')
  lines.push('')

  // Convert to ESC/POS bytes
  const text = lines.join(LF)
  const encoder = new TextEncoder()
  const textBytes = encoder.encode(text)

  // Build ESC/POS command sequence
  const ESC = 0x1B
  const GS = 0x1D
  const LF_BYTE = 0x0A

  const commands: number[] = [
    ESC, 0x40,                         // Initialize printer
    ESC, 0x61, 0x01,                   // Center alignment
    ESC, 0x21, 0x30,                   // Double height + double width
    ...textBytes.slice(0, 40),         // Business name
    LF_BYTE,
    LF_BYTE,
    ESC, 0x61, 0x00,                   // Left alignment
    ESC, 0x21, 0x00,                   // Normal font
    ...textBytes.slice(40),
    GS, 0x56, 0x00,                    // Cut paper
  ]

  return new Uint8Array(commands)
}

export function generateReceiptData(order: any, business: any): ReceiptData {
  return {
    businessName: business.name,
    businessNameAr: business.nameAr,
    orderNumber: order.orderNumber,
    tableNumber: order.table?.number,
    cashierName: order.cashier?.name,
    items: order.items.map((item: any) => ({
      name: item.menuItem.name,
      nameAr: item.menuItem.nameAr,
      quantity: item.quantity,
      price: item.price,
      modifiers: item.selectedModifiers
        ? Object.values(item.selectedModifiers).flat()
        : undefined,
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    serviceCharge: order.serviceCharge,
    discount: order.discount,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    date: new Date(order.createdAt).toLocaleDateString('ar-DZ'),
    customerName: order.customerName,
    footer: business.nameAr || business.name,
  }
}
