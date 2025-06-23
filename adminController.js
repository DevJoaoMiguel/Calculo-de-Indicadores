const prisma = require('../config/database');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const avaliacaoService = require('../services/avaliacaoService');

exports.getDashboard = async (req, res) => {
    try {
        const { colaboradorId, mes, ano, semana } = req.query;
        const colaboradores = await avaliacaoService.buscarColaboradores();
        const dashboardData = await avaliacaoService.getIndicadoresDashboard({ colaboradorId, mes, ano, semana });
        res.render('admin/dashboard', {
            user: req.user,
            colaboradores,
            filtroSelecionado: { colaboradorId, mes, ano, semana },
            ...dashboardData
        });
    } catch (error) {
        res.render('admin/dashboard', {
            user: req.user,
            colaboradores: [],
            filtroSelecionado: {},
            totalDetratores: 0,
            totalDetratoresArea: 0,
            totalDetratoresJunior: 0,
            totalChecklist: 0,
            totalAbastecimentos: 0,
            mediaTmaTme: 0,
            tempoMedioAtendimento: 0,
            porcentagemSatisfacao: 0,
            labels: [],
            graficoDetratores: [],
            graficoTmaTme: [],
            graficoSatisfacao: [],
            totalAvaliacoes: 0,
            totalColaboradores: 0,
            avaliacoesPendentes: 0,
            avaliacoesConcluidas: 0,
            mediaGeral: 0,
            error: 'Erro ao carregar dados do dashboard'
        });
    }
};

exports.getColaboradorEvolucao = async (req, res) => {
    try {
        const colaboradorId = parseInt(req.params.id);
        console.log('Buscando evolução do colaborador:', colaboradorId);

        const colaborador = await prisma.user.findUnique({
            where: { id: colaboradorId }
        });

        if (!colaborador) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        const avaliacoes = await prisma.performanceEvaluation.findMany({
            where: { colaboradorId },
            orderBy: [
                { ano: 'asc' },
                { mes: 'asc' }
            ]
        });

        const totalColaboradores = 1; // Apenas o colaborador selecionado
        const avaliacoesPendentes = avaliacoes.filter(a => !a.concluida).length;
        const avaliacoesConcluidas = avaliacoes.filter(a => a.concluida).length;
        const mediaGeral = avaliacoes.length > 0 
            ? avaliacoes.reduce((acc, curr) => acc + curr.valorCalculado, 0) / avaliacoes.length 
            : 0;

        const indicadores = {
            detratorIndividual: avaliacoes.length > 0 
                ? avaliacoes.reduce((acc, curr) => acc + curr.detratorIndividual, 0) / avaliacoes.length 
                : 0,
            detratorArea: avaliacoes.length > 0 
                ? avaliacoes.reduce((acc, curr) => acc + curr.detratorArea, 0) / avaliacoes.length 
                : 0,
            detratorJunior: avaliacoes.length > 0 
                ? avaliacoes.reduce((acc, curr) => acc + curr.detratorJunior, 0) / avaliacoes.length 
                : 0,
            checklist: avaliacoes.length > 0 
                ? avaliacoes.reduce((acc, curr) => acc + curr.checklist, 0) / avaliacoes.length 
                : 0,
            abastecimentos: avaliacoes.length > 0 
                ? avaliacoes.reduce((acc, curr) => acc + curr.abastecimentos, 0) / avaliacoes.length 
                : 0,
            tmaTme: avaliacoes.length > 0 
                ? avaliacoes.reduce((acc, curr) => acc + curr.tmaTme, 0) / avaliacoes.length 
                : 0
        };

        const meses = avaliacoes.map(a => `${a.mes}/${a.ano}`);
        const valores = avaliacoes.map(a => a.valorCalculado);

        console.log('Dados do colaborador calculados:', {
            totalColaboradores,
            avaliacoesPendentes,
            avaliacoesConcluidas,
            mediaGeral,
            indicadores,
            meses,
            valores
        });

        res.json({
            totalColaboradores,
            avaliacoesPendentes,
            avaliacoesConcluidas,
            mediaGeral,
            indicadores,
            meses,
            avaliacoes: valores
        });
    } catch (error) {
        console.error('Erro ao buscar evolução do colaborador:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do colaborador' });
    }
};

exports.filtrarDados = async (req, res) => {
    try {
        console.log('Filtrando dados do dashboard...');
        const { colaboradorId } = req.query;

        const colaborador = colaboradorId ? await prisma.user.findUnique({
            where: { id: parseInt(colaboradorId) }
        }) : null;

        const avaliacoes = await prisma.performanceEvaluation.findMany({
            where: colaboradorId ? {
                colaboradorId: parseInt(colaboradorId)
            } : undefined,
            include: {
                colaborador: true
            },
            orderBy: [
                { ano: 'desc' },
                { mes: 'desc' }
            ]
        });

        const evolucaoColaboradores = colaborador ? [{
            id: colaborador.id,
            nome: colaborador.nome,
            cargo: colaborador.cargo,
            evolucao: avaliacoes
                .sort((a, b) => {
                    if (a.ano === b.ano) {
                        return a.mes - b.mes;
                    }
                    return a.ano - b.ano;
                })
                .map(avaliacao => ({
                    mes: avaliacao.mes,
                    ano: avaliacao.ano,
                    valor: avaliacao.valorCalculado,
                    indicadores: {
                        detratorIndividual: avaliacao.detratorIndividual,
                        detratorArea: avaliacao.detratorArea,
                        detratorJunior: avaliacao.detratorJunior,
                        checklist: avaliacao.checklist,
                        abastecimentos: avaliacao.abastecimentos,
                        tmaTme: avaliacao.tmaTme
                    }
                }))
        }] : [];

        const mediaGeral = avaliacoes.reduce((acc, curr) => acc + curr.valorCalculado, 0) / avaliacoes.length || 0;
        
        const avaliacoesPleno = avaliacoes.filter(a => a.colaborador.cargo === 'PLENO');
        const mediaPleno = avaliacoesPleno.reduce((acc, curr) => acc + curr.valorCalculado, 0) / avaliacoesPleno.length || 0;
        
        const avaliacoesJunior = avaliacoes.filter(a => a.colaborador.cargo === 'JUNIOR');
        const mediaJunior = avaliacoesJunior.reduce((acc, curr) => acc + curr.valorCalculado, 0) / avaliacoesJunior.length || 0;

        const distribuicaoCargo = {
            PLENO: avaliacoesPleno.length,
            JUNIOR: avaliacoesJunior.length
        };

        const resumoGeral = {
            detratorIndividual: avaliacoes.reduce((acc, curr) => acc + curr.detratorIndividual, 0) / avaliacoes.length || 0,
            detratorArea: avaliacoes.reduce((acc, curr) => acc + curr.detratorArea, 0) / avaliacoes.length || 0,
            detratorJunior: avaliacoes.reduce((acc, curr) => acc + curr.detratorJunior, 0) / avaliacoes.length || 0,
            checklist: avaliacoes.reduce((acc, curr) => acc + curr.checklist, 0) / avaliacoes.length || 0,
            abastecimentos: avaliacoes.reduce((acc, curr) => acc + curr.abastecimentos, 0) / avaliacoes.length || 0,
            tmaTme: avaliacoes.reduce((acc, curr) => acc + curr.tmaTme, 0) / avaliacoes.length || 0
        };

        const avaliacoesRecentes = avaliacoes.slice(0, 10);

        res.json({
            mediaGeral,
            mediaPleno,
            mediaJunior,
            totalAvaliacoes: avaliacoes.length,
            evolucaoColaboradores,
            distribuicaoCargo,
            resumoGeral,
            avaliacoesRecentes
        });
    } catch (error) {
        console.error('Erro ao filtrar dados:', error);
        res.status(500).json({ error: 'Erro ao filtrar dados' });
    }
};

exports.listarUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.user.findMany({
            orderBy: {
                nome: 'asc'
            }
        });

        res.render('admin/usuarios', {
            user: req.user,
            usuarios,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.render('admin/usuarios', {
            user: req.user,
            usuarios: [],
            error: 'Erro ao carregar lista de usuários',
            success: null
        });
    }
};

exports.criarUsuario = async (req, res) => {
    try {
        if (req.user.role !== 'GENTE_E_GESTAO') {
            return res.status(403).render('error', {
                message: 'Acesso negado. Você não tem permissão para acessar esta página.',
                status: 403
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('admin/novoUsuario', {
                error: errors.array()[0].msg,
                formData: req.body
            });
        }

        const { nome, email, senha, cargo, role } = req.body;

        const usuarioExistente = await prisma.user.findUnique({
            where: { email }
        });

        if (usuarioExistente) {
            return res.render('admin/novoUsuario', {
                error: 'Este email já está em uso',
                formData: req.body
            });
        }

        const usuario = await prisma.user.create({
            data: {
                nome,
                email,
                senha: await bcrypt.hash(senha, 10),
                cargo,
                role
            }
        });

        res.redirect('/admin/usuarios');
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.render('admin/novoUsuario', {
            error: 'Erro ao criar usuário',
            formData: req.body
        });
    }
};

exports.editarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, cargo, role } = req.body;

        const usuarioExistente = await prisma.user.findUnique({
            where: { id: id }
        });

        if (!usuarioExistente) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }

        if (email !== usuarioExistente.email) {
            const emailEmUso = await prisma.user.findFirst({
            where: {
                    email: email,
                    id: { not: id }
                }
            });

            if (emailEmUso) {
                return res.status(400).json({
                    error: 'Este email já está em uso'
                });
            }
        }

        const usuarioAtualizado = await prisma.user.update({
            where: { id: id },
            data: {
                nome,
                email,
                cargo,
                role
            }
        });

        res.json({
            success: true,
            message: 'Usuário atualizado com sucesso!',
            usuario: usuarioAtualizado
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({
            error: 'Erro ao atualizar usuário. Por favor, tente novamente.'
        });
    }
};

exports.excluirUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await prisma.user.findUnique({
            where: { id },
            include: {
                colaboradores: true,
                performances: true,
                registrosPerformance: true,
                avaliacoes: true
            }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        await prisma.$transaction(async (tx) => {
            if (usuario.avaliacoes?.length > 0) {
                await tx.performanceEvaluation.deleteMany({
                    where: {
                        colaboradorId: id
                    }
                });
            }

            if (usuario.performances?.length > 0) {
                await tx.performance.deleteMany({
                    where: {
                        colaboradorId: id
                    }
                });
            }

            if (usuario.registrosPerformance?.length > 0) {
                await tx.performance.deleteMany({
                    where: {
                        registradorId: id
                    }
                });
            }

            if (usuario.colaboradores?.length > 0) {
                await tx.user.updateMany({
                    where: {
                        coordenadorId: id
                    },
                    data: {
                        coordenadorId: null
                    }
                });
            }

            await tx.user.delete({
                where: { id }
            });
        });

        res.json({
            success: true,
            message: 'Usuário excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir usuário. Tente novamente mais tarde.'
        });
    }
};

exports.getNovoUsuario = (req, res) => {
    res.render('admin/novoUsuario', {
        user: req.user,
        error: null,
        success: null,
        formData: {}
    });
};

exports.getEditarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await prisma.user.findUnique({
            where: {
                id: id
            }
        });

        if (!usuario) {
            return res.status(404).render('error', {
                message: 'Usuário não encontrado',
                status: 404
            });
        }

        res.render('admin/editarUsuario', {
            usuario,
            user: req.user,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Erro ao carregar formulário de edição:', error);
        res.status(500).render('error', {
            message: 'Erro ao carregar formulário de edição',
            status: 500
        });
    }
};

exports.atualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, cargo, perfil } = req.body;

        const usuarioExistente = await prisma.user.findUnique({
            where: { id: id }
        });

        if (!usuarioExistente) {
            return res.status(404).render('admin/editarUsuario', {
                usuario: req.body,
                user: req.user,
                error: 'Usuário não encontrado',
                success: null
            });
        }

        if (email !== usuarioExistente.email) {
            const emailEmUso = await prisma.user.findFirst({
            where: {
                    email: email,
                    id: { not: id }
                }
            });

            if (emailEmUso) {
                return res.render('admin/editarUsuario', {
                    usuario: req.body,
                    user: req.user,
                    error: 'Este email já está em uso',
                    success: null
                });
            }
        }

        const usuarioAtualizado = await prisma.user.update({
            where: { id: id },
            data: {
                nome,
                email,
                cargo,
                perfil
            }
        });

        res.render('admin/editarUsuario', {
            usuario: usuarioAtualizado,
            user: req.user,
            error: null,
            success: 'Usuário atualizado com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.render('admin/editarUsuario', {
            usuario: req.body,
            user: req.user,
            error: 'Erro ao atualizar usuário. Por favor, tente novamente.',
            success: null
        });
    }
};

exports.getDashboardDados = async (req, res) => {
    try {
        const data = await avaliacaoService.getIndicadoresDashboard(req.query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
    }
}; 
