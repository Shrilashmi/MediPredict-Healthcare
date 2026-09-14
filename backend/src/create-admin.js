import readline from 'readline'
import pool from './db/pool.js'
import { hashPassword } from './utils/password.js'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer))
    })
}

async function createAdmin() {
    try {
        const username = await ask('Enter admin username: ')
        const password = await ask('Enter admin password: ')

        if (!username || !password) {
            console.log('❌ Username and password are required.')
            return
        }

        if (password.length < 6) {
            console.log('❌ Password must be at least 6 characters.')
            return
        }

        const existing = await pool.query(
            'SELECT id FROM users WHERE username = $1', [username]
        )

        if (existing.rows.length > 0) {
            console.log('❌ Username already exists.')
            return
        }

        const hashedPassword = await hashPassword(password)

        await pool.query(
            `INSERT INTO users (username, password, role)
       VALUES ($1, $2, 'admin')`, [username, hashedPassword]
        )

        console.log(`\n✅ Admin account "${username}" created successfully!`)
    } catch (err) {
        console.error('❌ Failed to create admin:', err.message)
    } finally {
        rl.close()
        await pool.end()
    }
}

createAdmin()