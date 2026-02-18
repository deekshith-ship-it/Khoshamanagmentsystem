const { createClient } = require('@libsql/client');
const fs = require('fs');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function setup() {
    try {
        console.log('🚀 Starting Database Setup for new Turso instance...');
        const schema = fs.readFileSync('server/schema.sql', 'utf8');

        // Split by semicolon but ignore ones inside strings or comments if any
        // Simple split for this schema works
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`📝 Found ${statements.length} SQL statements. Executing...`);

        for (let i = 0; i < statements.length; i++) {
            try {
                process.stdout.write(`⏳ Executing statement ${i + 1}/${statements.length}... `);
                await db.execute(statements[i]);
                console.log('✅');
            } catch (err) {
                console.log('❌');
                console.error(`Error in statement: ${statements[i].substring(0, 50)}...`);
                console.error(err.message);
                // Continue with other statements even if insert fails (already exists)
            }
        }

        console.log('\n✨ Database setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('💥 Setup failed:', error);
        process.exit(1);
    }
}

setup();
