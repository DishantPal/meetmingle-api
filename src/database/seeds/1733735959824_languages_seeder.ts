import type { Kysely } from 'kysely'

export async function seed(db: Kysely<any>): Promise<void> {
  try {
    const languages = [
      {
        name: 'English',
        native_name: 'English',
        code: 'en',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Spanish',
        native_name: 'Español',
        code: 'es',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'German',
        native_name: 'Deutsch',
        code: 'de',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'French',
        native_name: 'Français',
        code: 'fr',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Turkish',
        native_name: 'Türkçe',
        code: 'tr',
        is_active: true,
        updated_at: new Date()
      },
      {
        name: 'Japanese',
        native_name: '日本語',
        code: 'ja',
        is_active: true,
        updated_at: new Date()
      }
    ]

    // Insert all languages
    await db
      .insertInto('languages')
      .values(languages)
      .execute()

    console.log('Successfully seeded languages')
  } catch (error) {
    console.error('Error seeding languages:', error)
    throw error
  }
}