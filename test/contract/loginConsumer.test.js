const { reporter, flow, handler, mock } = require('pactum');
const pf = require('pactum-flow-plugin');

function addFlowReporter() {
  pf.config.url = 'http://localhost:8080';
  pf.config.projectId = 'lojaebac-front';
  pf.config.projectName = 'Loja EBAC Front';
  pf.config.version = '1.0.2';
  pf.config.username = 'scanner';
  pf.config.password = 'scanner';
  reporter.add(pf.reporter);
}

before(async () => {
  addFlowReporter();
  await mock.start(4000);
});

after(async () => {
  await mock.stop();
  await reporter.end();
});

handler.addInteractionHandler('Login Response', ()=>{
    return{
        provider: 'lojaebac-api',
        flow: 'Login',
        request: {
            method: 'POST',
            path: '/public/authUser',
            body:{
                "email": "admin@admin.com",
                "password": "admin123"
            }
        },
        response: {
            status: 200,
            body: {
                "success": true,
                "message": "login successfully",
                "data": {
                    "_id": "65766e71ab7a6bdbcec70d0d",
                    "role": "admin",
                    "profile": {
                        "firstName": "admin"
                    },
                    "email": "admin@admin.com",
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjpb71l9pZCI6IjY1NzY2ZTcxYWI3YTziZGJjZWM3MGQwZCIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicm9sZSI6ImFkbWluIn0sImV4cCI6MTcwNzU2MTcwNX0.Uw6rzxntfGFgWwOFEWNXaJWm_yTjg2VNY9nGAm0X0_s"
                }
            }
        }
    }
})

it('FRONT - deve autenticar o usuario corretamente', async () => {
    await flow("Login")
    .useInteraction('Login Response')
        .post('http://localhost:4000/public/authUser')
        .withJson({
            "email": "admin@admin.com",
            "password": "admin123"
        })
        .expectStatus(200)
        .expectJson('success', true)
});