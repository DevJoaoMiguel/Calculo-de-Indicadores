const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authService = {
  async login(email, senha, role) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      throw new Error('Email ou senha inválidos');
    }

    if (user.role !== role) {
      throw new Error('Perfil de acesso inválido para este usuário');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    return { user, token };
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch {
      throw new Error('Token inválido');
    }
  },

  async generateResetToken(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });

    return resetToken;
  },

  async resetPassword(token, novaSenha) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      throw new Error('Token inválido ou expirado');
    }

    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        senha: senhaCriptografada,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return true;
  }
};

module.exports = authService;
