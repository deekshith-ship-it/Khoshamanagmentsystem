const serverless = require('serverless-http');
const app = require('../../server/index');

// Wrap Express app for Netlify Functions
// The basePath option tells serverless-http to strip the function
// prefix from the URL before passing it to Express, so that
// /.netlify/functions/api/leads becomes /leads
const handler = serverless(app, {
    basePath: '/.netlify/functions/api'
});

module.exports.handler = async (event, context) => {
    // Debug logging (visible in Netlify Function logs)
    console.log(`[Netlify Fn] ${event.httpMethod} ${event.path}`);
    return handler(event, context);
};
