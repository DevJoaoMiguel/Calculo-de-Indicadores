const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const authController = {
  async login(req, res) {
    try {
      const { email, senha, role } = req.body;
      
      console.log('Dados recebidos do formulário:', {
        email,
        senha: senha ? '******' : 'não fornecida',
        role
      });

      if (!email || !senha || !role) {
        console.log('Campos faltando:', {
          email: !email ? 'faltando' : 'ok',
          senha: !senha ? 'faltando' : 'ok',
          role: !role ? 'faltando' : 'ok'
        });
        return res.render('login', { error: 'Por favor, preencha todos os campos' });
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      console.log('Usuário encontrado:', user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        temSenha: !!user.senha
      } : 'não encontrado');

      if (!user) {
        return res.render('login', { error: 'Usuário não encontrado' });
      }

      if (user.role !== role) {
        console.log('Papel não corresponde:', {
          papelSelecionado: role,
          papelDoUsuario: user.role
        });
        return res.render('login', { error: 'Perfil de acesso inválido para este usuário' });
      }

      if (!user.senha) {
        console.log('Usuário sem senha definida');
        return res.render('login', { error: 'Senha não definida para este usuário' });
      }

      try {
        console.log('Tentando comparar senha...');
        const validPassword = await bcrypt.compare(senha, user.senha);
        console.log('Resultado da comparação de senha:', validPassword ? 'senha válida' : 'senha inválida');
        
        if (!validPassword) {
          return res.render('login', { error: 'Senha inválida' });
        }
      } catch (bcryptError) {
        console.error('Erro ao comparar senha:', bcryptError);
        return res.render('login', { error: 'Erro ao verificar senha' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Token JWT gerado com sucesso');

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      console.log('Redirecionando para o dashboard:', user.role);

      switch (user.role) {
        case 'GENTE_E_GESTAO':
          res.redirect('/admin/dashboard');
          break;
        case 'COLABORADOR':
          res.redirect('/colaborador/dashboard');
          break;
        case 'COORDENADOR':
          res.redirect('/coordenador/dashboard');
          break;
        default:
          res.redirect('/login');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.render('login', { error: 'Erro ao fazer login' });
    }
  },

  logout(req, res) {
    res.clearCookie('token');
    res.redirect('/login?success=Logout realizado com sucesso');
  }
};

module.exports = authController;
