// test/setupFlow.js
const isCI = !!process.env.CI;
const flowEnabled = process.env.ENABLE_FLOW === 'true';

if (isCI && !flowEnabled) {
  console.log('Flow desativado no CI (modo seguro)');
  module.exports = {};
} else {
  const flow = require('pactum-flow-plugin');

  flow.config.url = process.env.FLOW_URL || 'http://127.0.0.1:8080';
  flow.config.project = process.env.FLOW_PROJECT || 'nodejs-m24';
  flow.config.version = process.env.FLOW_VERSION || 'local';
  flow.config.overwrite = true;

  if (flow?.events?.on) {
    flow.events.on('publish.failed', (err) => {
      console.error('Flow publish failed:', err?.message || err);
    });
  }

  module.exports = flow;
}