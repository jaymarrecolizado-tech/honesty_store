// Seed script to populate demo data
// Run with: node scripts/seed.js

const PocketBase = require('pocketbase/cjs')

const pb = new PocketBase('http://localhost:8090')

async function seed() {
  try {
    // Authenticate as admin (you'll need to create an admin user first)
    await pb.admins.authWithPassword('admin@example.com', 'password123')

    console.log('Seeding demo data...')

    // Create categories
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Office Supplies', description: 'Stationery and office materials' },
      { name: 'Food & Beverages', description: 'Snacks and drinks' },
      { name: 'Cleaning Supplies', description: 'Cleaning and maintenance products' },
    ]

    const createdCategories = []
    for (const category of categories) {
      const record = await pb.collection('categories').create(category)
      createdCategories.push(record)
      console.log(`Created category: ${record.name}`)
    }

    // Create products
    const products = [
      { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 2500, stock_qty: 50, category: createdCategories[0].id },
      { name: 'USB Keyboard', description: 'Mechanical USB keyboard', price: 4500, stock_qty: 30, category: createdCategories[0].id },
      { name: 'Notebooks (Pack of 10)', description: 'College-ruled notebooks', price: 1200, stock_qty: 100, category: createdCategories[1].id },
      { name: 'Ballpoint Pens (Pack of 12)', description: 'Blue ink ballpoint pens', price: 600, stock_qty: 200, category: createdCategories[1].id },
      { name: 'Coffee (Instant)', description: 'Premium instant coffee 200g', price: 1800, stock_qty: 75, category: createdCategories[2].id },
      { name: 'Bottled Water (24 pack)', description: '500ml bottled water', price: 2400, stock_qty: 40, category: createdCategories[2].id },
      { name: 'All-Purpose Cleaner', description: 'Multi-surface cleaner 1L', price: 800, stock_qty: 60, category: createdCategories[3].id },
      { name: 'Paper Towels', description: 'Kitchen paper towels 6 rolls', price: 1500, stock_qty: 45, category: createdCategories[3].id },
    ]

    for (const product of products) {
      const record = await pb.collection('products').create(product)
      console.log(`Created product: ${record.name}`)
    }

    // Create demo users with debt ceilings
    const demoUsers = [
      { email: 'customer1@dict.gov.ph', password: 'password123', passwordConfirm: 'password123', name: 'Juan Dela Cruz', role: 'customer', debt_ceiling: 1000000 }, // ₱10,000
      { email: 'customer2@dict.gov.ph', password: 'password123', passwordConfirm: 'password123', name: 'Maria Santos', role: 'customer', debt_ceiling: 500000 }, // ₱5,000
      { email: 'customer3@dict.gov.ph', password: 'password123', passwordConfirm: 'password123', name: 'Pedro Reyes', role: 'customer', debt_ceiling: 200000 }, // ₱2,000
    ]

    for (const user of demoUsers) {
      try {
        const record = await pb.collection('users').create(user)
        console.log(`Created user: ${record.name} (${record.email})`)
      } catch (error) {
        console.log(`User ${user.email} might already exist, skipping...`)
      }
    }

    console.log('Seeding completed successfully!')
  } catch (error) {
    console.error('Seeding failed:', error)
  }
}

seed()