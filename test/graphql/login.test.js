// login.test.js
const { spec } = require('pactum');

it('Deve autenticar usuário corretamente', async () => {
  await spec()
    .post('http://lojaebac.ebaconline.art.br/graphql')
    .withGraphQLQuery(`
      mutation AuthUser($email: String, $password: String) {
        authUser(email: $email, password: $password) {
          success
          token
        }
      }
    `)
    .withGraphQLVariables({
      "email": "admin@admin.com",
      "password": "admin123"
    })
    .expectStatus(200)
    .expectJsonMatch('data.authUser.success', true);
});