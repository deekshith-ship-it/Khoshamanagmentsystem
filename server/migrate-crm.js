const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    console.log('🔄 Starting CRM Workflow Migration...');

    try {
        // 1. Add closed_lost_reason to leads
        try {
            await db.execute('ALTER TABLE leads ADD COLUMN closed_lost_reason TEXT');
            console.log('✅ Added closed_lost_reason to leads');
        } catch (e) {
            console.log('ℹ️ closed_lost_reason already exists in leads');
        }

        // 2. Add file_url and notes to proposals
        try {
            await db.execute('ALTER TABLE proposals ADD COLUMN file_url TEXT');
            console.log('✅ Added file_url to proposals');
        } catch (e) {
            console.log('ℹ️ file_url already exists in proposals');
        }
        try {
            await db.execute('ALTER TABLE proposals ADD COLUMN notes TEXT');
            console.log('✅ Added notes to proposals');
        } catch (e) {
            console.log('ℹ️ notes already exists in proposals');
        }

        // 3. Add author to lead_activities
        try {
            await db.execute('ALTER TABLE lead_activities ADD COLUMN author TEXT');
            console.log('✅ Added author to lead_activities');
        } catch (e) {
            console.log('ℹ️ author already exists in lead_activities');
        }

        // 4. Add project verification docs to projects
        const projectCols = ['scope_url', 'agreement_url', 'contract_url', 'pricing_url'];
        for (const col of projectCols) {
            try {
                await db.execute(`ALTER TABLE projects ADD COLUMN ${col} TEXT`);
                console.log(`✅ Added ${col} to projects`);
            } catch (e) {
                console.log(`ℹ️ ${col} already exists in projects`);
            }
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrate();
