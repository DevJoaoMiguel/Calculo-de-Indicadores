const express = require('express');
const router = express.Router();
const { authMiddleware: isAuthenticated, checkRole } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const avaliacaoController = require('../controllers/avaliacaoController');
const adminController = require('../controllers/adminController');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/login', (req, res) => {
    res.render('login', { 
        error: req.query.error || null,
        success: req.query.success || null 
    });
});

router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.get('/dashboard', isAuthenticated, (req, res) => {
    const userRole = req.user.role;
    
    switch (userRole) {
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
});

router.get('/admin/dashboard', isAuthenticated, checkRole(['GENTE_E_GESTAO']), adminController.getDashboard);
router.get('/admin/filtrar', isAuthenticated, checkRole(['GENTE_E_GESTAO']), adminController.filtrarDados);

router.get('/colaborador/dashboard', isAuthenticated, checkRole(['COLABORADOR']), avaliacaoController.getAvaliacoesColaborador);

router.get('/coordenador/dashboard', isAuthenticated, async (req, res) => {
    try {
        const colaboradores = await prisma.user.findMany({
            where: {
                role: 'COLABORADOR'
            },
            select: {
                id: true,
                nome: true,
                cargo: true
            }
        });

        res.render('coordenador/dashboard', { 
            colaboradores,
            user: req.user
        });
    } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
        res.status(500).render('error', { 
            message: 'Erro ao carregar o dashboard' 
        });
    }
});

router.post('/coordenador/avaliacao', isAuthenticated, avaliacaoController.salvarAvaliacao);
router.get('/coordenador/avaliacoes', isAuthenticated, avaliacaoController.getTodasAvaliacoes);
router.delete('/coordenador/avaliacao/:id', isAuthenticated, avaliacaoController.deleteAvaliacao);

router.get('/coordenador/novo-usuario', isAuthenticated, checkRole(['COORDENADOR']), async (req, res) => {
    try {
        console.log('Acessando página de novo usuário como coordenador');
        res.render('coordenador/novo-usuario', { 
            user: req.user,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (error) {
        console.error('Erro ao carregar página de novo usuário:', error);
        res.status(500).render('error', { 
            message: 'Erro ao carregar página de novo usuário.' 
        });
    }
});

router.post('/coordenador/novo-usuario', isAuthenticated, checkRole(['COORDENADOR']), userController.createUser);

module.exports = router; 
