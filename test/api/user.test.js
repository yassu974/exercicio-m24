const { spec, request } = require('pactum');
const { eachLike, like } = require('pactum-matchers');
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

describe('API', function () {
  this.timeout(15000);

  let token;
  before(async function () {
    this.timeout(20000);
    token = await loginWithRetry();
  });

  it('listagem de usuarios', async () => {
    const users = await spec()
      .get('/api/getUsers')
      .withHeaders('authorization', token)
      .expectStatus(200)
      .expectJsonMatch({
        users: eachLike({
          _id: like('507f1f77bcf86cd799439011'),
          email: like('cliente@ebac.art.br')
        })
      })
      .returns('users');

    const hasProfile =
      Array.isArray(users) &&
      users.some(u => u && u.profile && typeof u.profile.firstName === 'string');

    assert.ok(hasProfile, 'Deveria existir ao menos um usuário com profile.firstName');
  });
});