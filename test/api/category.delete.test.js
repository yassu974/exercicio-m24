const { spec, request } = require('pactum');
const { like } = require('pactum-matchers');
const assert = require('assert');

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

describe('API - Categorias > deleteCategory', function () {
  this.timeout(15000);

  let token;
  before(async function () {
    this.timeout(20000);
    token = await loginWithRetry();
  });

  async function createCategory() {
    const name  = `CAT-DEL-${Date.now()}`;
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

  it('deve deletar uma categoria existente (200)', async () => {
    const id = await createCategory();
    await spec()
      .delete(`/api/deleteCategory/${id}`)
      .withHeaders('authorization', token)
      .expectStatus(200)
      .expectJsonMatch({ success: like(true) });
  });

  it('deve retornar 401 ao deletar com token inválido', async () => {
    const id = await createCategory();
    await spec()
      .delete(`/api/deleteCategory/${id}`)
      .withHeaders('authorization', 'token_invalido')
      .expectStatus(401);
  });

  it('deve retornar erro ao enviar um id inválido (tolera 400/404/502)', async () => {
    const res = await spec()
      .delete('/api/deleteCategory/123')
      .withHeaders('authorization', token)
      .toss();
    assert.ok([400, 404, 502].includes(res.statusCode));
  });
});