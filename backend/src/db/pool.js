import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  host:     process.env.PGHOST,
  port:     parseInt(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user:     process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl:      process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max:      10,
  idleTimeoutMillis: 30000,
})

// Test connection on startup
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err)
  process.exit(-1)
})

export default pool
