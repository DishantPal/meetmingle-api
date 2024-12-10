import type { Kysely } from 'kysely'

export async function seed(db: Kysely<any>): Promise<void> {
  try {
    const contentBlocks = [
      {
        purpose: 'home-hero',
        title: 'Welcome to Random Video Chat',
        content: JSON.stringify({
          heading: 'Connect with New People Instantly',
          subheading: 'Meet interesting people from around the world with just one click',
          cta_text: 'Start Chatting Now',
          description: 'Join thousands of users who are already making meaningful connections through random video chats.'
        }),
        type: 'hero',
        is_active: true,
        updated_at: new Date()
      },
      {
        purpose: 'how-it-works',
        title: 'How It Works',
        content: JSON.stringify({
          heading: 'Simple Steps to Get Started',
          steps: [
            {
              title: 'Create Account',
              description: 'Sign up with basic information to get started'
            },
            {
              title: 'Set Preferences',
              description: 'Choose your matching preferences and interests'
            },
            {
              title: 'Start Chatting',
              description: 'Click start and get instantly connected with someone new'
            }
          ]
        }),
        type: 'steps',
        is_active: true,
        updated_at: new Date()
      },
      {
        purpose: 'features',
        title: 'Platform Features',
        content: JSON.stringify({
          heading: 'Why Choose Our Platform',
          features: [
            {
              title: 'Safe & Secure',
              description: 'Advanced security measures to protect your privacy'
            },
            {
              title: 'Smart Matching',
              description: 'Get matched with people sharing similar interests'
            },
            {
              title: 'HD Quality',
              description: 'Crystal clear video and audio quality'
            },
            {
              title: '24/7 Support',
              description: 'Round the clock assistance when you need it'
            }
          ]
        }),
        type: 'features',
        is_active: true,
        updated_at: new Date()
      },
      {
        purpose: 'safety-banner',
        title: 'Safety First',
        content: JSON.stringify({
          heading: 'Your Safety is Our Priority',
          description: 'We implement strict safety measures and moderation to ensure a safe environment for all users.',
          cta_text: 'Learn More',
          cta_link: '/safety-guidelines'
        }),
        type: 'banner',
        is_active: true,
        updated_at: new Date()
      }
    ]

    // Insert all content blocks
    await db
      .insertInto('content_blocks')
      .values(contentBlocks)
      .execute()

    console.log('Successfully seeded content blocks')
  } catch (error) {
    console.error('Error seeding content blocks:', error)
    throw error
  }
}