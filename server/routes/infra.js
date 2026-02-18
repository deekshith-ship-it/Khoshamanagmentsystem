const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET all infra assets with linked projects
router.get('/', async (req, res) => {
    try {
        const assetsResult = await db.execute('SELECT * FROM infra_assets ORDER BY created_at DESC');
        const assets = assetsResult.rows;

        const mappingsResult = await db.execute(`
            SELECT 
                pa.asset_id, p.id as project_id, p.title, p.status, p.progress, p.assignee
            FROM project_assets pa
            JOIN projects p ON pa.project_id = p.id
        `);
        const mappings = mappingsResult.rows;

        const assetsWithProjects = assets.map(asset => {
            const linkedProjects = mappings
                .filter(m => m.asset_id === asset.id)
                .map(m => ({
                    id: m.project_id,
                    title: m.title,
                    status: m.status,
                    progress: m.progress,
                    assignee: m.assignee
                }));
            return { ...asset, projects: linkedProjects };
        });

        res.json(assetsWithProjects);
    } catch (error) {
        console.error('Error fetching infra assets:', error);
        res.status(500).json({ error: 'Failed to fetch infra assets' });
    }
});

// CREATE infra asset
router.post('/', async (req, res) => {
    try {
        const { name, alt_name, type, status, linked, project_name, domain_name, registrar, expire_date, notes } = req.body;
        const result = await db.execute({
            sql: 'INSERT INTO infra_assets (name, alt_name, type, status, linked, project_name, domain_name, registrar, expire_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [name, alt_name, type || 'other', status || 'active', linked || 0, project_name, domain_name, registrar, expire_date, notes]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating infra asset:', error);
        res.status(500).json({ error: 'Failed to create infra asset' });
    }
});

// DELETE infra asset
router.delete('/:id', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM infra_assets WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting infra asset:', error);
        res.status(500).json({ error: 'Failed to delete infra asset' });
    }
});

module.exports = router;
