const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Upload file (Base64)
router.post('/', async (req, res) => {
    try {
        const { fileName, content, type } = req.body;

        if (!fileName || !content) {
            return res.status(400).json({ error: 'Missing fileName or content' });
        }

        // Generate unique filename to prevent overwrite
        const uniqueName = `${Date.now()}-${fileName}`;
        const filePath = path.join(UPLOAD_DIR, uniqueName);

        // Remove header if present (data:application/pdf;base64,)
        const base64Data = content.replace(/^data:.*,/, "");

        fs.writeFileSync(filePath, base64Data, 'base64');

        // Return the accessible URL
        const fileUrl = `/uploads/${uniqueName}`;
        res.json({ url: fileUrl, name: uniqueName });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

module.exports = router;
