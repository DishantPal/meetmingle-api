import type { Kysely } from 'kysely'

export async function seed(db: Kysely<any>): Promise<void> {
  try {
    const pages = [
      {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        content: `<h1>Privacy Policy</h1>
<p>Last updated: ${new Date().toISOString().split('T')[0]}</p>

<h2>1. Information We Collect</h2>
<p>We collect information that you provide directly to us, including:</p>
<ul>
  <li>Profile information when you create an account</li>
  <li>Communication preferences and settings</li>
  <li>Information about your device and connection</li>
</ul>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
  <li>Provide and improve our video calling service</li>
  <li>Match you with other users based on your preferences</li>
  <li>Ensure platform safety and security</li>
  <li>Communicate with you about our services</li>
</ul>

<h2>3. Data Security</h2>
<p>We implement appropriate security measures to protect your personal information.</p>`,
        is_active: true,
        updated_at: new Date()
      },
      {
        slug: 'terms-of-service',
        title: 'Terms of Service',
        content: `<h1>Terms of Service</h1>
<p>Last updated: ${new Date().toISOString().split('T')[0]}</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing or using our service, you agree to be bound by these Terms of Service.</p>

<h2>2. User Responsibilities</h2>
<ul>
  <li>You must be at least 18 years old to use this service</li>
  <li>You agree to use the service responsibly and legally</li>
  <li>You will not harass or harm other users</li>
  <li>You will not share inappropriate or explicit content</li>
</ul>

<h2>3. Service Rules</h2>
<p>We reserve the right to terminate accounts that violate our policies.</p>`,
        is_active: true,
        updated_at: new Date()
      },
      {
        slug: 'about-us',
        title: 'About Us',
        content: `<h1>About Us</h1>
<p>Welcome to our random video calling platform!</p>

<h2>Our Mission</h2>
<p>We're dedicated to creating meaningful connections between people around the world through safe and enjoyable video conversations.</p>

<h2>What Makes Us Different</h2>
<ul>
  <li>Advanced matching algorithms</li>
  <li>Strong focus on user safety</li>
  <li>Robust moderation system</li>
  <li>High-quality video connections</li>
</ul>`,
        is_active: true,
        updated_at: new Date()
      },
      {
        slug: 'safety-guidelines',
        title: 'Safety Guidelines',
        content: `<h1>Safety Guidelines</h1>
<p>Your safety is our top priority. Please follow these guidelines for a safe experience:</p>

<h2>Do's and Don'ts</h2>
<h3>Do:</h3>
<ul>
  <li>Be respectful to other users</li>
  <li>Report inappropriate behavior</li>
  <li>Protect your personal information</li>
</ul>

<h3>Don't:</h3>
<ul>
  <li>Share personal contact information</li>
  <li>Record calls without consent</li>
  <li>Engage in harmful behavior</li>
</ul>`,
        is_active: true,
        updated_at: new Date()
      }
    ]

    // Insert all pages
    await db
      .insertInto('pages')
      .values(pages)
      .execute()

    console.log('Successfully seeded pages')
  } catch (error) {
    console.error('Error seeding pages:', error)
    throw error
  }
}