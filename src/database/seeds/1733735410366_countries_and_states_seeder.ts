import type { Kysely } from 'kysely'
import fetch from 'node-fetch'

interface State {
  id: number
  name: string
  state_code: string
  latitude: string
  longitude: string
  type: string | null
}

interface Country {
  name: string
  iso2: string
  region: string
  states: State[]
}

export async function seed(db: Kysely<any>): Promise<void> {
  try {
    // Fetch data from the API
    console.log('Fetching countries and states data...')
    const response = await fetch('https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/refs/tags/v2.5/json/countries%2Bstates.json')
	// @ts-ignore
    const countries: Country[] = await response.json()

    console.log(`Processing ${countries.length} countries...`)

    // Process each country
    for (const country of countries) {
      // Insert country
      await db
        .insertInto('countries')
        .values({
          name: country.name,
          code: country.iso2,
          region: country.region || 'Unspecified',
          is_active: true,
          updated_at: new Date()
        })
        .execute()

      // Process states if they exist
      if (country.states && country.states.length > 0) {
        // Process states in batches of 100
        const batchSize = 100
        const statesData = country.states.filter(state => state.state_code).map(state => ({
          name: state.name,
          state_code: state.state_code,
          country_code: country.iso2,
          is_active: true,
          updated_at: new Date()
        }))

        // Process states in batches
        for (let i = 0; i < statesData.length; i += batchSize) {
          const batch = statesData.slice(i, i + batchSize)
          await db
            .insertInto('states')
            .values(batch)
            .execute()
        }

        console.log(`Processed ${statesData.length} states for ${country.name}`)
      }
    }

    console.log('Successfully seeded countries and states')
  } catch (error) {
    console.error('Error seeding countries and states:', error)
    throw error
  }
}