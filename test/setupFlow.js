// test/setupFlow.js
const flow = require('pactum-flow-plugin');

flow.config.url = process.env.FLOW_URL || 'http://127.0.0.1:8080';
flow.config.project = process.env.FLOW_PROJECT || 'nodejs-m24';
flow.config.version = process.env.FLOW_VERSION || 'local';
flow.config.overwrite = true;

module.exports = flow;