const serverless = require('serverless-http');
const app = require('../../server/index');

// Wrap Express app for Netlify Functions with error handling
const handler = serverless(app, {
    basePath: '/.netlify/functions/api'
});

module.exports.handler = async (event, context) => {
    // Prevents function from waiting for empty event loop (performance fix)
    context.callbackWaitsForEmptyEventLoop = false;

    // Debug log (viewable in Netlify > Functions > api > Logs)
    console.log(`[KMS API] ${event.httpMethod} ${event.path}`);

    try {
        return await handler(event, context);
    } catch (err) {
        console.error('[KMS API ERROR]', err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error', details: err.message })
        };
    }
};
