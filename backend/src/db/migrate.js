/**
 * migrate.js — Database migration runner
 * 
 * Runs all SQL files in src/db/migrations/ in order.
 * Usage: npm run migrate
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool from './pool.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigrations() {
  const client = await pool.connect()
  
  try {
    console.log('\n🔄 Starting database migration...\n')
    
    const migrationsDir = path.join(__dirname, 'migrations')
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('✗ No migrations directory found at:', migrationsDir)
      return
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    if (files.length === 0) {
      console.log('✗ No SQL migration files found')
      return
    }

    for (const file of files) {
      console.log(`  Running ${file}...`)
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      
      await client.query(sql)
      console.log(`  ✓ ${file} completed`)
    }

    console.log('\n✓ All migrations completed successfully!\n')
  } catch (err) {
    console.error('\n✗ Migration failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
