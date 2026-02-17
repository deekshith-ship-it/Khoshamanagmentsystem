const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function testConnection() {
    try {
        console.log('Connecting to Turso...');
        const result = await db.execute('SELECT name FROM sqlite_master WHERE type="table"');
        console.log('Tables in database:', result.rows.map(r => r.name));

        if (result.rows.length > 0) {
            const firstTable = result.rows[0].name;
            const dataResult = await db.execute(`SELECT COUNT(*) as count FROM ${firstTable}`);
            console.log(`Data in ${firstTable}:`, dataResult.rows[0].count);
        }
    } catch (error) {
        console.error('Connection failed:', error);
    }
}

testConnection();
