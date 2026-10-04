import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import request from 'supertest';
import { expect } from 'chai';
import mongoose from 'mongoose';

import app from '../src/app.js';
import { loginAdmin, loginAluno } from './helpers/authHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Massa de dados do teste (Data-Driven Testing): cada item de "casos" gera
// uma rodada completa do fluxo com um aluno e um trabalho diferentes.
const massaPath = path.join(__dirname, 'massa', 'dados.json');
const massa = JSON.parse(fs.readFileSync(massaPath, 'utf8'));

// Gera um sufixo único por execução para o e-mail e a matrícula do aluno.
// Sem isso, rodar a suíte mais de uma vez contra o mesmo banco falharia com
// 409 (e-mail/matrícula já cadastrados), já que os dados de teste ficam
// persistidos no MongoDB entre execuções.
function gerarSufixo() {
  return Date.now() + '-' + Math.floor(Math.random() * 10000);
}

describe('Fluxo completo: login admin, cadastro de aluno, login aluno e registro de trabalho', function () {
  let tokenAdmin;

  after(async function () {
    await mongoose.connection.close();
  });

  it('Deve logar como administrador e receber um token', async function () {
    tokenAdmin = await loginAdmin();

    expect(tokenAdmin).to.be.a('string');
    expect(tokenAdmin).to.not.be.empty;
  });

  massa.casos.forEach(function (caso) {
    describe('Caso: ' + caso.aluno.nome, function () {
      const sufixo = gerarSufixo();
      const dadosAluno = {
        nome: caso.aluno.nome,
        email: caso.aluno.email.replace('@', '+' + sufixo + '@'),
        matricula: caso.aluno.matricula + '-' + sufixo,
        senha: caso.aluno.senha,
      };

      let alunoCriado;
      let tokenAluno;

      it('Admin deve conseguir cadastrar o aluno', async function () {
        const resposta = await request(app)
          .post('/api/admin/alunos')
          .set('Authorization', 'Bearer ' + tokenAdmin)
          .send(dadosAluno);

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.have.property('id');
        expect(resposta.body.email).to.equal(dadosAluno.email);
        expect(resposta.body).to.not.have.property('senha');

        alunoCriado = resposta.body;
      });

      it('Admin deve matricular o aluno na disciplina usada no trabalho', async function () {
        const resposta = await request(app)
          .post('/api/admin/disciplinas/' + massa.disciplinaId + '/matriculas')
          .set('Authorization', 'Bearer ' + tokenAdmin)
          .send({ alunoId: alunoCriado.id });

        expect(resposta.status).to.equal(201);
        expect(resposta.body.alunoId).to.equal(alunoCriado.id);
        expect(resposta.body.disciplinaId).to.equal(massa.disciplinaId);
      });

      it('Aluno deve conseguir logar com as credenciais cadastradas pelo admin', async function () {
        tokenAluno = await loginAluno(dadosAluno.email, dadosAluno.senha);

        expect(tokenAluno).to.be.a('string');
        expect(tokenAluno).to.not.be.empty;
      });

      it('Aluno deve conseguir registrar a entrega de um trabalho', async function () {
        const resposta = await request(app)
          .post('/api/alunos/' + alunoCriado.id + '/trabalhos')
          .set('Authorization', 'Bearer ' + tokenAluno)
          .send({
            disciplinaId: massa.disciplinaId,
            titulo: caso.trabalho.titulo,
            descricao: caso.trabalho.descricao,
          });

        expect(resposta.status).to.equal(201);
        expect(resposta.body.titulo).to.equal(caso.trabalho.titulo);
        expect(resposta.body.alunoId).to.equal(alunoCriado.id);
        expect(resposta.body.status).to.equal('entregue');
      });
    });
  });
});
