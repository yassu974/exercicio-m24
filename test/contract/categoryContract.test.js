const { spec, request } = require('pactum');

request.setBaseUrl('http://lojaebac.ebaconline.art.br');

let token;

beforeEach(async () => {
  token = await spec()
    .post('/public/authUser')
    .withJson({ email: 'admin@admin.com', password: 'admin123' })
    .expectStatus(200)
    .returns('data.token');
});

const addCategory200Schema = {
  type: 'object',
  required: ['success'],
  additionalProperties: true,
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: {
      type: 'object',
      required: ['_id', 'name'],
      additionalProperties: true,
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        photo: { type: 'string' }
      }
    }
  }
};

describe('CONTRATO - Category > addCategory (200)', () => {
  it('resposta deve obedecer ao contrato JSON Schema', async () => {
    const name = `CAT-CONTRACT-${Date.now()}`;
    const photo = `https://picsum.photos/200?${Date.now()}`;

    await spec()
      .post('/api/addCategory')
      .withHeaders('authorization', token)
      .withJson({ name, photo })
      .expectStatus(200)
      .expectJsonSchema(addCategory200Schema);
  });
});

const error401Schema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' }
  }
};

describe('CONTRATO - Category > addCategory (401)', () => {
  it('resposta de erro deve obedecer a um formato estável', async () => {
    await spec()
      .post('/api/addCategory')
      .withHeaders('authorization', 'token_invalido')
      .withJson({ name: 'X', photo: 'https://picsum.photos/200' })
      .expectStatus(401)
      .expectJsonSchema(error401Schema);
  });
});