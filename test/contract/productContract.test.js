const { spec, request } = require('pactum');
const { like } = require('pactum-matchers');

request.setBaseUrl('http://lojaebac.ebaconline.art.br');
request.setDefaultTimeout(10000);

async function getToken(maxRetries = 3) {
  let lastErr;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      return await spec()
        .post('/public/authUser')
        .withJson({ email: 'admin@admin.com', password: 'admin123' })
        .expectStatus(200)
        .returns('data.token');
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 400 * i));
    }
  }
  throw lastErr;
}

async function createCategory(token) {
  const name  = `CAT-PROD-CONTRACT-${Date.now()}`;
  const photo = `https://picsum.photos/200?${Date.now()}`;

  const data = await spec()
    .post('/api/addCategory')
    .withHeaders('authorization', token)
    .withJson({ name, photo })
    .expectStatus(200)
    .returns('data');

  const id = data?._id || data?.id;
  if (!id) throw new Error('addCategory não retornou id/_id');
  return id;
}

describe('CONTRATO - Product > addProduct (REST)', () => {
  let token;
  let categoryId;

  before(async () => {
    token = await getToken();
    categoryId = await createCategory(token);
  });

  it('resposta 200 deve obedecer ao contrato JSON (shape estável)', async () => {
    const body = {
      name: `PROD-CONTRACT-${Date.now()}`,
      price: 123.45,
      quantity: 7,
      categories: categoryId,
      description: 'Produto para contrato',
      photos: 'https://picsum.photos/640/480',
      popular: false,
      visible: true,
      location: 'SP',
      additionalDetails: 'lote-contrato',
      specialPrice: 99.9
    };

    await spec()
      .post('/api/addProduct')
      .withHeaders('authorization', token)
      .withJson(body)
      .expectStatus(200)
      .expectJsonMatch({
        success: like(true),
        message: like(''),
        data: {
          _id: like('507f1f77bcf86cd799439011'),
          name: like(body.name)
        }
      });
  });

  it('resposta 401 deve obedecer a um formato de erro estável', async () => {
    const body = {
      name: `PROD-CONTRACT-401-${Date.now()}`,
      price: 10,
      quantity: 1,
      categories: categoryId
    };

    await spec()
      .post('/api/addProduct')
      .withHeaders('authorization', 'token_invalido')
      .withJson(body)
      .expectStatus(401)
      .expectJsonMatch({
        success: like(false),
        message: like('')
      });
  });
});