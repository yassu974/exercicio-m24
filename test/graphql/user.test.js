// user.test.js
const { spec } = require('pactum');

beforeEach(async () => {
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
      email: 'admin@admin.com',
      password: 'admin123'
    })
    .expectStatus(200)
    .stores('token', 'data.authUser.token');
});

it('Listagem de usuarios', async () => {
  await spec()
    .post('http://lojaebac.ebaconline.art.br/graphql')
    .withHeaders('Authorization', 'Bearer $S{token}')
    .withGraphQLQuery(`
      query {
        Users {
          id
          email
          profile { firstName }
        }
      }
    `)
    .expectStatus(200)
    .expectJsonSchema({
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'object',
          required: ['Users'],
          properties: {
            Users: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'email'],
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  profile: {
                    type: ['object', 'null'],
                    properties: {
                      firstName: { type: ['string', 'null'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
});