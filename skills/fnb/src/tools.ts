import type { Database } from 'bun:sqlite'
import type { Tool } from '@seahorse/core'

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function nowMs(): number {
  return Date.now()
}

function startOfDayMs(timezone: string): number {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const [year, month, day] = formatter.format(now).split('-').map(Number)
  return new Date(year, month - 1, day).getTime()
}

export function createFnbTools(db: Database, businessId: string): Tool[] {
  return [
    {
      name: 'get_menu',
      description: 'Returns all available menu items for the business as formatted text.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      execute: async () => {
        const rows = db
          .query(
            `SELECT id, name, name_km, description, description_km, price, category
             FROM menu_items
             WHERE business_id = ? AND available = 1
             ORDER BY category, name`,
          )
          .all(businessId) as {
          id: string
          name: string
          name_km: string | null
          description: string | null
          description_km: string | null
          price: number
          category: string
        }[]

        if (rows.length === 0) {
          return 'No menu items available.'
        }

        const grouped: Record<string, typeof rows> = {}
        for (const row of rows) {
          const cat = row.category ?? 'main'
          if (!grouped[cat]) grouped[cat] = []
          grouped[cat].push(row)
        }

        const lines: string[] = []
        for (const [category, items] of Object.entries(grouped)) {
          lines.push(`\n== ${category.toUpperCase()} ==`)
          for (const item of items) {
            const displayName = item.name_km ? `${item.name} / ${item.name_km}` : item.name
            const desc = item.description_km
              ? `${item.description ?? ''} ${item.description_km}`.trim()
              : item.description ?? ''
            const descPart = desc ? ` — ${desc}` : ''
            lines.push(`• ${displayName}: $${item.price.toFixed(2)}${descPart}`)
          }
        }

        return lines.join('\n').trim()
      },
    },

    {
      name: 'add_menu_item',
      description: 'Adds a new item to the menu.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Item name in English' },
          name_km: { type: 'string', description: 'Item name in Khmer (optional)' },
          price: { type: 'number', description: 'Price in USD' },
          category: {
            type: 'string',
            description: 'Category (main, drink, dessert, etc.)',
            default: 'main',
          },
          description: { type: 'string', description: 'Description in English (optional)' },
          description_km: { type: 'string', description: 'Description in Khmer (optional)' },
        },
        required: ['name', 'price'],
      },
      execute: async (args) => {
        const { name, name_km, price, category, description, description_km } = args as {
          name: string
          name_km?: string
          price: number
          category?: string
          description?: string
          description_km?: string
        }

        const id = randomId()
        const now = nowMs()

        db.run(
          `INSERT INTO menu_items (id, business_id, name, name_km, description, description_km, price, category, available, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [id, businessId, name, name_km ?? null, description ?? null, description_km ?? null, price, category ?? 'main', now, now],
        )

        return `Added "${name}" to the menu with ID ${id}.`
      },
    },

    {
      name: 'update_menu_item',
      description: 'Updates an existing menu item (availability, price, or description).',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Menu item ID' },
          available: { type: 'boolean', description: 'Whether the item is available' },
          price: { type: 'number', description: 'New price in USD' },
          description: { type: 'string', description: 'New description in English' },
        },
        required: ['id'],
      },
      execute: async (args) => {
        const { id, available, price, description } = args as {
          id: string
          available?: boolean
          price?: number
          description?: string
        }

        const existing = db
          .query('SELECT id, name FROM menu_items WHERE id = ? AND business_id = ?')
          .get(id, businessId) as { id: string; name: string } | null

        if (!existing) {
          return `Menu item ${id} not found.`
        }

        const updates: string[] = []
        const values: unknown[] = []

        if (available !== undefined) {
          updates.push('available = ?')
          values.push(available ? 1 : 0)
        }
        if (price !== undefined) {
          updates.push('price = ?')
          values.push(price)
        }
        if (description !== undefined) {
          updates.push('description = ?')
          values.push(description)
        }

        if (updates.length === 0) {
          return 'No fields to update.'
        }

        updates.push('updated_at = ?')
        values.push(nowMs())
        values.push(id)
        values.push(businessId)

        db.run(
          `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ? AND business_id = ?`,
          values,
        )

        return `Updated "${existing.name}" (${id}).`
      },
    },

    {
      name: 'record_order',
      description:
        'Records a new order by matching item names to the menu, calculating the total, and saving.',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Customer name (optional)' },
          items: {
            type: 'array',
            description: 'List of items to order',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Menu item name' },
                quantity: { type: 'number', description: 'Quantity' },
              },
              required: ['name', 'quantity'],
            },
          },
          notes: { type: 'string', description: 'Special instructions (optional)' },
          channel_id: { type: 'string', description: 'Channel ID for the order' },
          customer_id: { type: 'string', description: 'Customer ID' },
        },
        required: ['items', 'channel_id', 'customer_id'],
      },
      execute: async (args) => {
        const { customer_name, items, notes, channel_id, customer_id } = args as {
          customer_name?: string
          items: { name: string; quantity: number }[]
          notes?: string
          channel_id: string
          customer_id: string
        }

        const menuItems = db
          .query('SELECT id, name, name_km, price FROM menu_items WHERE business_id = ? AND available = 1')
          .all(businessId) as { id: string; name: string; name_km: string | null; price: number }[]

        const orderItems: { item_id: string; name: string; quantity: number; price: number }[] = []
        const notFound: string[] = []

        for (const requested of items) {
          const lower = requested.name.toLowerCase()
          const match = menuItems.find(
            (m) =>
              m.name.toLowerCase() === lower ||
              (m.name_km && m.name_km === requested.name) ||
              m.name.toLowerCase().includes(lower) ||
              lower.includes(m.name.toLowerCase()),
          )

          if (!match) {
            notFound.push(requested.name)
          } else {
            orderItems.push({
              item_id: match.id,
              name: match.name,
              quantity: requested.quantity,
              price: match.price,
            })
          }
        }

        if (notFound.length > 0) {
          return `Could not find menu items: ${notFound.join(', ')}. Order not placed.`
        }

        const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
        const id = randomId()
        const now = nowMs()

        db.run(
          `INSERT INTO orders (id, business_id, channel_id, customer_id, customer_name, items, total, status, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`,
          [
            id,
            businessId,
            channel_id,
            customer_id,
            customer_name ?? null,
            JSON.stringify(orderItems),
            total,
            notes ?? null,
            now,
            now,
          ],
        )

        const summary = orderItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')
        return `Order ${id} confirmed: ${summary}. Total: $${total.toFixed(2)}.`
      },
    },

    {
      name: 'get_orders_today',
      description: "Returns today's orders summary: count, total revenue, and items sold.",
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'Timezone for "today" (default: Asia/Phnom_Penh)',
          },
        },
        required: [],
      },
      execute: async (args) => {
        const { timezone = 'Asia/Phnom_Penh' } = args as { timezone?: string }
        const dayStart = startOfDayMs(timezone)

        const orders = db
          .query(
            `SELECT items, total, status FROM orders
             WHERE business_id = ? AND created_at >= ?
             ORDER BY created_at DESC`,
          )
          .all(businessId, dayStart) as { items: string; total: number; status: string }[]

        if (orders.length === 0) {
          return 'No orders today.'
        }

        const revenue = orders.reduce((s, o) => s + o.total, 0)
        const itemCounts: Record<string, number> = {}

        for (const order of orders) {
          const items = JSON.parse(order.items) as { name: string; quantity: number }[]
          for (const item of items) {
            itemCounts[item.name] = (itemCounts[item.name] ?? 0) + item.quantity
          }
        }

        const topItems = Object.entries(itemCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, qty]) => `${name} (${qty})`)
          .join(', ')

        return `Today: ${orders.length} orders, $${revenue.toFixed(2)} revenue. Top items: ${topItems}.`
      },
    },

    {
      name: 'daily_report',
      description:
        'Generates a formatted daily summary: total orders, revenue, top 3 items, and pending orders.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'Timezone for "today" (default: Asia/Phnom_Penh)',
          },
        },
        required: [],
      },
      execute: async (args) => {
        const { timezone = 'Asia/Phnom_Penh' } = args as { timezone?: string }
        const dayStart = startOfDayMs(timezone)

        const orders = db
          .query(
            `SELECT id, customer_name, items, total, status, notes, created_at FROM orders
             WHERE business_id = ? AND created_at >= ?
             ORDER BY created_at DESC`,
          )
          .all(businessId, dayStart) as {
          id: string
          customer_name: string | null
          items: string
          total: number
          status: string
          notes: string | null
          created_at: number
        }[]

        if (orders.length === 0) {
          return '📊 Daily Report\nNo orders today.'
        }

        const revenue = orders.reduce((s, o) => s + o.total, 0)
        const pending = orders.filter((o) => o.status === 'pending')
        const itemCounts: Record<string, number> = {}

        for (const order of orders) {
          const items = JSON.parse(order.items) as { name: string; quantity: number }[]
          for (const item of items) {
            itemCounts[item.name] = (itemCounts[item.name] ?? 0) + item.quantity
          }
        }

        const top3 = Object.entries(itemCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, qty], i) => `  ${i + 1}. ${name} — ${qty} sold`)
          .join('\n')

        const pendingLines =
          pending.length > 0
            ? pending
                .map((o) => {
                  const items = JSON.parse(o.items) as { name: string; quantity: number }[]
                  const summary = items.map((i) => `${i.quantity}x ${i.name}`).join(', ')
                  const who = o.customer_name ?? o.id
                  return `  • ${who}: ${summary} ($${o.total.toFixed(2)})`
                })
                .join('\n')
            : '  None'

        return [
          '📊 Daily Report',
          `Total Orders: ${orders.length}`,
          `Revenue: $${revenue.toFixed(2)}`,
          '',
          'Top 3 Items:',
          top3,
          '',
          `Pending Orders (${pending.length}):`,
          pendingLines,
        ].join('\n')
      },
    },

    {
      name: 'generate_menu_post',
      description:
        "Generates a bilingual (Khmer + English) social media post for today's available menu, suitable for Facebook/Telegram.",
      parameters: {
        type: 'object',
        properties: {
          business_name: {
            type: 'string',
            description: 'Business name to feature in the post',
          },
        },
        required: [],
      },
      execute: async (args) => {
        const { business_name = 'ហាងរបស់យើង' } = args as { business_name?: string }

        const rows = db
          .query(
            `SELECT name, name_km, price, category, description_km
             FROM menu_items
             WHERE business_id = ? AND available = 1
             ORDER BY category, price`,
          )
          .all(businessId) as {
          name: string
          name_km: string | null
          price: number
          category: string
          description_km: string | null
        }[]

        if (rows.length === 0) {
          return 'No available menu items to post.'
        }

        const grouped: Record<string, typeof rows> = {}
        for (const row of rows) {
          const cat = row.category ?? 'main'
          if (!grouped[cat]) grouped[cat] = []
          grouped[cat].push(row)
        }

        const categoryLabels: Record<string, string> = {
          main: '🍽️ មុខម្ហូប / Main Dishes',
          drink: '🥤 ភេសជ្ជៈ / Drinks',
          dessert: '🍰 បង្អែម / Desserts',
          appetizer: '🥗 ម្ហូបចូល / Starters',
          snack: '🍟 អាហារស្រាល / Snacks',
        }

        const lines: string[] = [
          `🌟 ${business_name}`,
          '',
          '✨ មុខម្ហូបថ្ងៃនេះ / Today\'s Menu ✨',
          '',
        ]

        for (const [cat, items] of Object.entries(grouped)) {
          const label = categoryLabels[cat] ?? `📋 ${cat}`
          lines.push(label)
          for (const item of items) {
            const kmName = item.name_km ?? item.name
            const usd = `$${item.price.toFixed(2)}`
            const riel = `${Math.round(item.price * 4100).toLocaleString()}រ`
            const descPart = item.description_km ? ` — ${item.description_km}` : ''
            lines.push(`  • ${kmName} / ${item.name}${descPart}: ${usd} (${riel})`)
          }
          lines.push('')
        }

        lines.push('📍 ស្វាគមន៍មកកាន់ហាងរបស់យើង!')
        lines.push('Welcome! Order now or message us to reserve. 🙏')
        lines.push('')
        lines.push('#Cambodia #KhmerFood #ហាងអាហារ')

        return lines.join('\n')
      },
    },
  ]
}
