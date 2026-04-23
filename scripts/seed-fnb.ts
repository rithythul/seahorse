import { createHash } from 'crypto'
import { getDatabase } from '@seahorse/core'
import { migrateFnb } from '@seahorse/skill-fnb'

const db = getDatabase()
migrateFnb(db)

const businessId = process.env.SEAHORSE_BUSINESS_ID ?? 'demo'

const menuItems = [
  { name: 'Iced Coffee', name_km: 'កាហ្វេទឹកកក', price: 1.50, category: 'drinks' },
  { name: 'Hot Coffee', name_km: 'កាហ្វេក្តៅ', price: 1.25, category: 'drinks' },
  { name: 'Hot Tea', name_km: 'តែក្តៅ', price: 1.00, category: 'drinks' },
  { name: 'Fresh Coconut', name_km: 'ដូងស្រស់', price: 1.50, category: 'drinks' },
  { name: 'Fruit Smoothie', name_km: 'ទឹកផ្លែឈើ', price: 2.00, category: 'drinks' },
  { name: 'Nom Pang', name_km: 'នំបុ័ង', price: 1.50, category: 'food' },
  { name: 'Fried Rice', name_km: 'បាយឆា', price: 3.00, category: 'food' },
  { name: 'Beef Lok Lak', name_km: 'លកឡាក់សាច់គោ', price: 5.00, category: 'food' },
  { name: 'Fish Amok', name_km: 'អាម៉ុកត្រី', price: 4.50, category: 'food' },
  { name: 'Mango Sticky Rice', name_km: 'បាយដំណើបស្វាយ', price: 2.50, category: 'dessert' },
]

function generateDeterministicId(businessId: string, itemName: string): string {
  const hash = createHash('sha256').update(`${businessId}:${itemName}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

const now = Date.now()

for (const item of menuItems) {
  const id = generateDeterministicId(businessId, item.name)
  db.run(
    `INSERT OR REPLACE INTO menu_items
    (id, business_id, name, name_km, price, category, available, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, businessId, item.name, item.name_km, item.price, item.category, 1, now, now],
  )
}

console.log(`✓ Seeded 10 menu items for business: ${businessId}`)
