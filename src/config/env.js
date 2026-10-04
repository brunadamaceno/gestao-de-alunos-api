// Carrega as variáveis de ambiente do arquivo .env (se existir) antes de
// qualquer outro módulo ler process.env. Precisa ser o primeiro import de
// src/app.js para garantir que JWT_SECRET, MONGODB_URI etc. já estejam
// disponíveis quando os outros módulos forem avaliados.
import 'dotenv/config';
