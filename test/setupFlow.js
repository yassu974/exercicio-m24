// test/setupFlow.js
const flow = require('pactum-flow-plugin');

flow.config.url = process.env.FLOW_URL || 'http://127.0.0.1:8080';
flow.config.project = process.env.FLOW_PROJECT || 'nodejs-m24';
flow.config.version = process.env.FLOW_VERSION || 'local';
flow.config.overwrite = true;

flow.events?.on?.('publish.failed', (err) => {
  console.error('❌ Flow publish failed:', err?.message || err);
});

if (process.env.CI && process.env.ENABLE_FLOW !== 'true') {
  flow.config.publish = false;
}

module.exports = flow;
