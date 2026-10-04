import request from 'supertest';
import app from '../../src/app.js';

// Helper de login do administrador. As credenciais vêm de variáveis de
// ambiente (carregadas via dotenv), com fallback para o admin pré-cadastrado
// pelo seed do projeto.
export async function loginAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@escola.com';
  const senha = process.env.ADMIN_SENHA || 'admin123';

  const resposta = await request(app).post('/api/auth/login').send({ email, senha });

  if (resposta.status !== 200) {
    throw new Error('Falha ao logar como administrador: ' + JSON.stringify(resposta.body));
  }

  return resposta.body.token;
}

// Helper de login do aluno. Recebe as credenciais do próprio aluno, já que
// cada caso de teste cadastra um aluno diferente.
export async function loginAluno(email, senha) {
  const resposta = await request(app).post('/api/auth/login').send({ email, senha });

  if (resposta.status !== 200) {
    throw new Error('Falha ao logar como aluno: ' + JSON.stringify(resposta.body));
  }

  return resposta.body.token;
}

export default { loginAdmin, loginAluno };
