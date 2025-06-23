const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const { getAvaliacoes } = require('../services/avaliacaoService');
const avaliacaoController = require ('../controllers/avaliacaoController');


const isAdmin = checkRole(['GENTE_E_GESTAO']);

router.get('/dashboard', authMiddleware, isAdmin, adminController.getDashboard);
router.get('/dashboard/colaborador/:id', authMiddleware, isAdmin, adminController.getColaboradorEvolucao);
router.get('/dashboard/dados', authMiddleware, isAdmin, adminController.getDashboardDados);

router.get('/avaliacoes', authMiddleware, isAdmin, avaliacaoController.getTodasAvaliacoesrh);

router.get('/usuarios', authMiddleware, isAdmin, adminController.listarUsuarios);
router.get('/novo-usuario', authMiddleware, isAdmin, adminController.getNovoUsuario);
router.post('/usuarios', authMiddleware, isAdmin, adminController.criarUsuario);
router.get('/usuarios/:id/editar', authMiddleware, isAdmin, adminController.getEditarUsuario);
router.put('/usuarios/:id', authMiddleware, isAdmin, adminController.editarUsuario);
router.delete('/usuarios/:id', authMiddleware, isAdmin, adminController.excluirUsuario);

module.exports = router; 
