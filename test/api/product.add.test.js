const { spec, request } = require('pactum');
const { like } = require('pactum-matchers');

request.setBaseUrl('http://lojaebac.ebaconline.art.br');
request.setDefaultTimeout(10000);

async function loginWithRetry(maxRetries = 8) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await spec()
        .post('/public/authUser')
        .withJson({ email: 'admin@admin.com', password: 'admin123' })
        .toss();
      if (res?.statusCode === 200) {
        const body = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
        const token = body?.data?.token;
        if (token) return token;
        lastErr = new Error('200 sem token');
      } else lastErr = new Error(`auth status ${res?.statusCode}`);
    } catch (e) { lastErr = e; }
    await new Promise(r => setTimeout(r, 400 * attempt));
  }
  throw lastErr;
}

describe('API - Produtos > addProduct', function () {
  this.timeout(15000);

  let token;
  before(async function () {
    this.timeout(20000);
    token = await loginWithRetry();
  });

  async function createCategory() {
    const name  = `CAT-PROD-${Date.now()}`;
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

  it('deve adicionar um novo produto (200)', async () => {
    const categoryId = await createCategory();
    const body = {
      name: `PROD-${Date.now()}`,
      price: 99.9,
      quantity: 10,
      categories: categoryId,
      description: 'Produto de teste',
      photos: 'https://picsum.photos/640/480',
      popular: false,
      visible: true,
      location: 'SP',
      additionalDetails: 'lote 001',
      specialPrice: 79.9
    };

    await spec()
      .post('/api/addProduct')
      .withHeaders('authorization', token)
      .withJson(body)
      .expectStatus(200)
      .expectJsonMatch({ success: like(true) });
  });

  it('deve retornar 401 com token inválido', async () => {
    const categoryId = '507f1f77bcf86cd799439011';
    await spec()
      .post('/api/addProduct')
      .withHeaders('authorization', 'token_invalido')
      .withJson({ name: 'Sem Auth', price: 10, quantity: 1, categories: categoryId })
      .expectStatus(401);
  });

  it('deve retornar 400 ao não enviar campo obrigatório (ex.: name)', async () => {
    const categoryId = await createCategory();
    await spec()
      .post('/api/addProduct')
      .withHeaders('authorization', token)
      .withJson({ price: 10, quantity: 1, categories: categoryId })
      .expectStatus(400);
  });
});