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

function safeParseJson(res) {
  try {
    if (!res) return null;
    if (typeof res.body === 'object') return res.body;
    const ct = (res.headers?.['content-type'] || '').toLowerCase();
    if (ct.includes('application/json')) return JSON.parse(res.body);
    return null;
  } catch { return null; }
}
function extractIdFrom(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return obj._id || obj.id || extractIdFrom(obj.data) || extractIdFrom(obj.product) || null;
}

describe('API - Produtos > deleteProduct', function () {
  this.timeout(20000);

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

  async function createProductAndGetId() {
    const categoryId = await createCategory();
    const name = `PROD-DEL-${Date.now()}`;

    const createRes = await spec()
      .post('/api/addProduct')
      .withHeaders('authorization', token)
      .withJson({
        name, price: 50, quantity: 3, categories: categoryId,
        description: 'Produto para delete', photos: 'https://picsum.photos/640/480',
        popular: false, visible: true, location: 'SP',
        additionalDetails: 'lote-del', specialPrice: 39.9
      })
      .toss();

    const createJson = safeParseJson(createRes);
    let id = extractIdFrom(createJson) || extractIdFrom(createJson?.created) || extractIdFrom(createJson?.data);

    if (!id) {
      const listRes = await spec()
        .get('/api/getProducts')
        .withHeaders('authorization', token)
        .toss();
      const listJson = safeParseJson(listRes);
      const products = listJson?.products || listJson?.data?.products || listJson?.data || [];
      const created = Array.isArray(products) ? products.find(p => p && p.name === name) : null;
      if (!created) throw new Error('Não foi possível localizar o produto recém-criado');
      id = created._id || created.id;
      if (!id) throw new Error('Produto da listagem não contém id/_id');
    }

    return { id, name };
  }

  it('deve deletar um produto existente (200)', async () => {
    const { id } = await createProductAndGetId();
    await spec()
      .delete(`/api/deleteProduct/${id}`)
      .withHeaders('authorization', token)
      .expectStatus(200)
      .expectJsonMatch({ success: like(true) });
  });

  it('deve retornar 401 ao deletar com token inválido', async () => {
    const { id } = await createProductAndGetId();
    await spec()
      .delete(`/api/deleteProduct/${id}`)
      .withHeaders('authorization', 'token_invalido')
      .expectStatus(401);
  });

  it('deve retornar erro ao enviar id inválido (tolera 400/404/502)', async () => {
    const res = await spec()
      .delete('/api/deleteProduct/123')
      .withHeaders('authorization', token)
      .toss();
    assert.ok([400, 404, 502].includes(res.statusCode));
  });
});