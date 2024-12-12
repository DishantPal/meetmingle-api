import type { Kysely } from 'kysely'

interface CoinPackage {
  name: string
  coins: number
  price: number
  currency: string
  playstore_id: string
  icon: string
  is_active: boolean
  updated_at: Date
}

export async function seed(db: Kysely<any>): Promise<void> {
  try {
    const packages: CoinPackage[] = [
      {
        name: 'Mini Pack',
        coins: 10,
        price: 29,
        currency: 'INR',
        playstore_id: 'com.app.coins.10',
        icon: 'https://storage.app.com/coins/mini.png',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Starter Pack',
        coins: 20,
        price: 49,
        currency: 'INR',
        playstore_id: 'com.app.coins.20',
        icon: 'https://storage.app.com/coins/starter.png',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Basic Pack',
        coins: 50,
        price: 99,
        currency: 'INR',
        playstore_id: 'com.app.coins.50',
        icon: 'https://storage.app.com/coins/basic.png',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Popular Pack',
        coins: 100,
        price: 199,
        currency: 'INR',
        playstore_id: 'com.app.coins.100',
        icon: 'https://storage.app.com/coins/popular.png',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Value Pack',
        coins: 200,
        price: 399,
        currency: 'INR',
        playstore_id: 'com.app.coins.200',
        icon: 'https://storage.app.com/coins/value.png',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Premium Pack',
        coins: 500,
        price: 999,
        currency: 'INR',
        playstore_id: 'com.app.coins.500',
        icon: 'https://storage.app.com/coins/premium.png',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Super Pack',
        coins: 1000,
        price: 1999,
        currency: 'INR',
        playstore_id: 'com.app.coins.1000',
        icon: 'https://storage.app.com/coins/super.png',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Mega Pack',
        coins: 2000,
        price: 3999,
        currency: 'INR',
        playstore_id: 'com.app.coins.2000',
        icon: 'https://storage.app.com/coins/mega.png',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Ultimate Pack',
        coins: 5000,
        price: 9999,
        currency: 'INR',
        playstore_id: 'com.app.coins.5000',
        icon: 'https://storage.app.com/coins/ultimate.png',
        is_active: true,
        updated_at: new Date()
      }
    ]

    await db
      .insertInto('coin_packages')
      .values(packages)
      .execute()

    console.log('Successfully seeded coin packages')
  } catch (error) {
    console.error('Error seeding coin packages:', error)
    throw error
  }
}