import { initializeDatabase, createInfluencer } from '../lib/database.js';

async function runDatabaseInit() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Initialize tables
    await initializeDatabase();
    
    // Seed with existing influencers
    const testInfluencers = [
      {
        ref: 'finaltest',
        name: 'Final Test Influencer',
        email: 'finaltest@example.com',
        commission: 12.5,
        status: 'active',
        instagram: '@finaltest',
        notes: 'High performing influencer'
      },
      {
        ref: 'testuser',
        name: 'Test User',
        email: 'testuser@example.com',
        commission: 10.0,
        status: 'active',
        tiktok: '@testuser_tiktok'
      }
    ];
    
    console.log('🌱 Seeding test influencers...');
    
    for (const influencer of testInfluencers) {
      try {
        const result = await createInfluencer(influencer);
        console.log(`✅ Created influencer: ${result.ref}`);
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`📋 Influencer ${influencer.ref} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDatabaseInit();
}

export default runDatabaseInit; 