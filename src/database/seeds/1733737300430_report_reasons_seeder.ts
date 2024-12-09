import type { Kysely } from 'kysely'

export async function seed(db: Kysely<any>): Promise<void> {
  try {
    const reportReasons = [
      {
        code: 'INAPPROPRIATE_CONTENT',
        title: 'Inappropriate Content',
        desc: 'User is displaying or sharing inappropriate, adult, or explicit content during video calls',
        is_active: true,
        updated_at: new Date()
      },
      {
        code: 'HARASSMENT',
        title: 'Harassment or Bullying',
        desc: 'User is engaging in harassment, bullying, or making threatening remarks to other users',
        is_active: true,
        updated_at: new Date()
      },
      {
        code: 'HATE_SPEECH',
        title: 'Hate Speech',
        desc: 'User is using hate speech or discriminatory language based on race, religion, gender, or other protected characteristics',
        is_active: true,
        updated_at: new Date()
      },
      {
        code: 'UNDERAGE',
        title: 'Underage User',
        desc: 'User appears to be below the minimum required age for using the platform',
        is_active: true,
        updated_at: new Date()
      },
      {
        code: 'SPAM',
        title: 'Spam or Advertising',
        desc: 'User is spamming, advertising, or promoting commercial content during video calls',
        is_active: true,
        updated_at: new Date()
      },
      {
        code: 'IMPERSONATION',
        title: 'Fake Identity',
        desc: 'User is impersonating someone else or using a false identity',
        is_active: true,
        updated_at: new Date()
      },
      {
        code: 'RECORDING',
        title: 'Unauthorized Recording',
        desc: 'User is recording or taking screenshots without consent',
        is_active: true,
        updated_at: new Date()
      },
      {
        code: 'ABUSIVE',
        title: 'Abusive Behavior',
        desc: 'User is displaying abusive, aggressive, or threatening behavior',
        is_active: true,
        updated_at: new Date()
      },
      {
        code: 'INAPPROPRIATE_SOUND',
        title: 'Inappropriate Audio',
        desc: 'User is playing inappropriate audio content or using offensive language',
        is_active: true,
        updated_at: new Date()
      },
      {
        code: 'OTHER',
        title: 'Other',
        desc: 'Other violations not covered by the above categories',
        is_active: true,
        updated_at: new Date()
      }
    ]

    // Insert all report reasons
    await db
      .insertInto('report_reasons')
      .values(reportReasons)
      .execute()

    console.log('Successfully seeded report reasons')
  } catch (error) {
    console.error('Error seeding report reasons:', error)
    throw error
  }
}