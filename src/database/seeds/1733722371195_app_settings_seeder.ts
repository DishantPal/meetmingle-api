import type { Kysely } from 'kysely'

export async function seed(db: Kysely<any>): Promise<void> {
  const now = new Date()
  console.log("🚀 ~ seed ~ now:", now)
  
  const settings = [
    // General Settings
    { 
      key: 'app_name', 
      value: 'Random Video Calling App', 
      group: 'general' 
    },
    { 
      key: 'minimum_age', 
      value: '18', 
      group: 'general' 
    },

    // Profile Options
    { 
      key: 'gender', 
      value: JSON.stringify(['male', 'female', 'others']), 
      group: 'profile_options' 
    },
    { 
      key: 'relation_ship_status', 
      value: JSON.stringify([
        'Single',
        'In a relationship',
        'Dating',
        'Open to Date'
      ]), 
      group: 'profile_options' 
    },
    { 
      key: 'interests', 
      value: JSON.stringify([
        'Cricket',
        'Photography',
        'Singing',
        'Reading',
        'Other'
      ]), 
      group: 'profile_options' 
    },
    { 
      key: 'looking_for', 
      value: JSON.stringify([
        'Friends',
        'Casual Dating',
        'Serious Relationship'
      ]), 
      group: 'profile_options' 
    },
    { 
      key: 'personality_traits', 
      value: JSON.stringify([
        'Adventurous',
        'Funny',
        'Romantic'
      ]), 
      group: 'profile_options' 
    },

    // Moderation Settings
    { 
      key: 'ban_reason', 
      value: JSON.stringify([
        {
          title: 'Offensive Message',
          desc: 'person is using offensive language'
        },
        {
          title: 'Inappropriate Content',
          desc: 'sharing or displaying inappropriate content'
        },
        {
          title: 'Harassment',
          desc: 'harassing or bullying other users'
        },
        {
          title: 'Spam',
          desc: 'sending spam messages or promotional content'
        },
        {
          title: 'Underage',
          desc: 'user appears to be under the minimum age requirement'
        },
        {
          title: 'Fake Identity',
          desc: 'using fake or misleading profile information'
        }
      ]), 
      group: 'moderation' 
    }
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