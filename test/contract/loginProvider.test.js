const { reporter, flow } = require('pactum');

before(async () => {

});

after(async () => {
  await reporter.end();
});

it('API - deve autenticar o usuario corretamente', async () => {
  await flow('Login')
    .post('http://lojaebac.ebaconline.art.br/public/authUser')
    .withJson({
      email: 'admin@admin.com',
      password: 'admin123'
    })
    .expectStatus(200)
    .expectJson('success', true);
});