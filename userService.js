const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

class UserService {
    async createUser(userData) {
        try {
            const { nome, email, senha, cargo, role } = userData;

            if (!nome || !email || !senha || !cargo || !role) {
                throw new Error('Todos os campos são obrigatórios.');
            }

            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                throw new Error('Este email já está cadastrado.');
            }

            const hashedPassword = await bcrypt.hash(senha, 10);

            const newUser = await prisma.user.create({
                data: {
                    nome,
                    email,
                    senha: hashedPassword,
                    cargo,
                    role
                }
            });

            const { senha: _, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserService(); 
