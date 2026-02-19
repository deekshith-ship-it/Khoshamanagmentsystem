const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Get all assets
router.get('/', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM infra_assets ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching infra assets:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Get single asset with linked projects
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const assetResult = await db.execute({
            sql: 'SELECT * FROM infra_assets WHERE id = ?',
            args: [id]
        });

        if (assetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        const projectsResult = await db.execute({
            sql: `SELECT p.id, p.title 
                  FROM projects p 
                  JOIN project_infra pi ON p.id = pi.project_id 
                  WHERE pi.infra_id = ?`,
            args: [id]
        });

        const asset = assetResult.rows[0];
        // Parse metadata if it's a string
        if (asset.metadata && typeof asset.metadata === 'string') {
            try {
                asset.metadata = JSON.parse(asset.metadata);
            } catch (e) {
                asset.metadata = {};
            }
        }

        res.json({
            ...asset,
            projects: projectsResult.rows
        });
    } catch (error) {
        console.error('Error fetching asset details:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Create asset
router.post('/', async (req, res) => {
    try {
        const { name, type, server_type, metadata, status } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and Type are required' });
        }

        const result = await db.execute({
            sql: 'INSERT INTO infra_assets (name, type, server_type, metadata, status, created_at) VALUES (?, ?, ?, ?, ?, datetime("now")) RETURNING *',
            args: [
                name,
                type,
                server_type || null,
                JSON.stringify(metadata || {}),
                status || 'active'
            ]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Update asset
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, server_type, metadata, status } = req.body;

        await db.execute({
            sql: `UPDATE infra_assets 
                  SET name = ?, type = ?, server_type = ?, metadata = ?, status = ?, updated_at = datetime("now") 
                  WHERE id = ?`,
            args: [
                name,
                type,
                server_type || null,
                JSON.stringify(metadata || {}),
                status || 'active',
                id
            ]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Link project to infra
router.post('/:id/projects', async (req, res) => {
    try {
        const { id } = req.params;
        const { project_id } = req.body;

        if (!project_id) return res.status(400).json({ error: 'Project ID required' });

        await db.execute({
            sql: 'INSERT INTO project_infra (infra_id, project_id) VALUES (?, ?)',
            args: [id, project_id]
        });
        res.status(201).json({ success: true });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Project already linked' });
        }
        res.status(500).json({ error: 'Failed' });
    }
});

// Unlink project from infra
router.delete('/:id/projects/:projectId', async (req, res) => {
    try {
        const { id, projectId } = req.params;
        await db.execute({
            sql: 'DELETE FROM project_infra WHERE infra_id = ? AND project_id = ?',
            args: [id, projectId]
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Delete asset
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if linked to projects
        const linkCheck = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM project_infra WHERE infra_id = ?',
            args: [id]
        });

        if (linkCheck.rows[0].count > 0) {
            // We could return a warning, but often deletion is blocked or requires confirmation
            // For now, let's allow it but delete the links (ON DELETE CASCADE will handle it in db schema)
        }

        await db.execute({
            sql: 'DELETE FROM infra_assets WHERE id = ?',
            args: [id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
