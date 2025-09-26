const { reporter, flow } = require('pactum');
const pf = require('pactum-flow-plugin');

function addFlowReporter() {
  pf.config.url = 'http://localhost:8080';
  pf.config.projectId = 'lojaebac-api';
  pf.config.projectName = 'Loja EBAC API';
  pf.config.version = '1.0.0';
  pf.config.username = 'scanner';
  pf.config.password = 'scanner';
  reporter.add(pf.reporter);
}

before(async () => {
  addFlowReporter();
});

after(async () => {
  await reporter.end();
});

it('API - deve autenticar o usuario corretamente', async () => {
    await flow("Login")
        .post('http://lojaebac.ebaconline.art.br/public/authUser')
        .withJson({
            "email": "admin@admin.com",
            "password": "admin123"
        })
        .expectStatus(200)
        .expectJson('success', true)
});