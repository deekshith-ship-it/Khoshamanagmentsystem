// ========================================
// NETLIFY FUNCTION WRAPPER
// Wraps the Express app for serverless deployment
// ========================================
const serverless = require('serverless-http');
const app = require('../../server/index');

const handler = serverless(app);

exports.handler = async (event, context) => {
    // Prevent Lambda from waiting for empty event loop
    if (context) {
        context.callbackWaitsForEmptyEventLoop = false;
    }

    try {
        return await handler(event, context);
    } catch (error) {
        console.error('Netlify Function Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};
