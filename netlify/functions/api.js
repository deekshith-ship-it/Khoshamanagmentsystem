const serverless = require('serverless-http');
const app = require('../../server/index');

// This wraps your existing Express app into a Netlify Function
// No need to host the backend separately!
module.exports.handler = serverless(app);
