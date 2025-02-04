import type { Kysely } from 'kysely'

export async function seed(db: Kysely<any>): Promise<void> {
  const now = new Date()
  
  const settings = [
    // Filter Settings
    { 
      key: 'age_filter_price', 
      value: 10, 
      group: 'filter' 
    },
    { 
      key: 'gender_filter_price', 
      value: 0, 
      group: 'filter' 
    },
    { 
      key: 'language_filter_price', 
      value: 0, 
      group: 'filter' 
    },
    { 
      key: 'state_filter_price', 
      value: 10, 
      group: 'filter' 
    },
    { 
      key: 'country_filter_price', 
      value: 10, 
      group: 'filter' 
    },
  ]

  // Insert all settings
  for (const setting of settings) {
    await db
      .insertInto('app_settings')
      .values({
        ...setting,
        updated_at: now
      })
      .execute()
  }
}