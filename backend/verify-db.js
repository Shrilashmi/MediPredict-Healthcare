/**
 * Quick database verification script
 * Checks if tables exist and shows doctor accounts
 */

import pool from './src/db/pool.js'

async function verify() {
  const client = await pool.connect()
  
  try {
    console.log('\n📊 Database Verification\n')
    console.log('=' .repeat(70))
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('\n✅ Tables created:')
    tables.rows.forEach(row => console.log(`   • ${row.table_name}`))
    
    // Check doctors
    const doctors = await client.query(`
      SELECT u.username, u.role, dp.full_name, dp.specialization, dp.city, dp.verified
      FROM users u
      LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'doctor'
      ORDER BY u.username
    `)
    
    console.log(`\n✅ Doctors seeded (${doctors.rows.length}):`)
    doctors.rows.forEach(doc => {
      console.log(`   • ${doc.username} → ${doc.full_name} (${doc.specialization}, ${doc.city}) ${doc.verified ? '✓ Verified' : ''}`)
    })
    
    console.log('\n' + '='.repeat(70))
    console.log('✅ Database setup complete!\n')
    console.log('🔐 Test login credentials:')
    console.log('   Username: dr.sarah')
    console.log('   Password: doctor123\n')
    
  } catch (err) {
    console.error('❌ Verification failed:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

verify()
