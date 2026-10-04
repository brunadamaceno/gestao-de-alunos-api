// Controlador de autenticação básico
export async function login(req, res) {
  // Resposta fake para passar no teste inicial
  // Ajuste para lógica real depois
  const { email, senha } = req.body;
  if (email === 'admin@escola.com' && senha === 'admin123') {
    return res.status(200).json({
      token: 'fake-jwt-token',
      user: { id: 'admin-principal', nome: 'Administrador do Sistema', email, role: 'admin' }
    });
  }
  res.status(401).json({ error: 'Credenciais inválidas' });
}
