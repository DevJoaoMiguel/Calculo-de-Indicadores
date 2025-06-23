const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const validRoles = ['GENTE_E_GESTAO', 'COLABORADOR', 'COORDENADOR'];

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).render('error', {
                message: 'Acesso não autorizado. Por favor, faça login.',
                status: 401
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        });

        if (!user) {
            return res.status(401).render('error', {
                message: 'Usuário não encontrado. Por favor, faça login novamente.',
                status: 401
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(401).render('error', {
            message: 'Sessão expirada. Por favor, faça login novamente.',
            status: 401
        });
    }
};

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).render('error', {
                message: 'Acesso não autorizado. Por favor, faça login.',
                status: 401
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).render('error', {
                message: 'Acesso negado. Você não tem permissão para acessar esta página.',
                status: 403
            });
        }

        next();
    };
};

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

const isGenteGestao = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'GENTE_E_GESTAO') {
        return next();
    }
    res.status(403).render('error', {
        message: 'Acesso não autorizado',
        status: 403
    });
};

module.exports = {
    authMiddleware,
    checkRole,
    isAuthenticated,
    isGenteGestao
}; 
