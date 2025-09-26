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

describe('API - Categorias', function () {
  this.timeout(15000);

  let token;
  before(async function () {
    this.timeout(20000);
    token = await loginWithRetry();
  });

  it('deve adicionar uma categoria com sucesso (200)', async () => {
    const name  = `Categoria ${Date.now()}`;
    const photo = `https://picsum.photos/200?${Date.now()}`;

    await spec()
      .post('/api/addCategory')
      .withHeaders('authorization', token)
      .withJson({ name, photo })
      .expectStatus(200)
      .expectJsonMatch({
        success: like(true),
        data: { _id: like('507f1f77bcf86cd799439011'), name: like(name) }
      });
  });

  it('deve retornar erro 400 ao não enviar o campo name', async () => {
    await spec()
      .post('/api/addCategory')
      .withHeaders('authorization', token)
      .withJson({ photo: 'https://picsum.photos/200' })
      .expectStatus(400);
  });

  it('deve retornar 401 quando o token é inválido', async () => {
    await spec()
      .post('/api/addCategory')
      .withHeaders('authorization', 'token_invalido')
      .withJson({ name: 'Qualquer', photo: 'https://picsum.photos/200' })
      .expectStatus(401);
  });
});