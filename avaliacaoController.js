const avaliacaoService = require('../services/avaliacaoService');

const getAvaliacoesColaborador = async (req, res) => {
    try {
        console.log('Buscando avaliações do colaborador:', req.user.id);
        const avaliacoes = await avaliacaoService.buscarAvaliacoesColaborador(req.user.id);
        console.log('Avaliações encontradas:', avaliacoes);
        
        res.render('colaborador/dashboard', { 
            user: req.user,
            avaliacoes: avaliacoes,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).render('colaborador/dashboard', { 
            user: req.user,
            avaliacoes: [],
            error: 'Erro ao buscar avaliações',
            success: null
        });
    }
};

const salvarAvaliacao = async (req, res) => {
    try {
        const {
            colaboradorId,
            mes,
            ano,
            detratorIndividual,
            detratorArea,
            detratorJunior,
            checklist,
            abastecimentos,
            tmaTme,
            valorCalculado,
            qtdAtendimentos
        } = req.body;

        if (req.user.role !== 'COORDENADOR') {
            return res.status(403).json({
                success: false,
                message: 'Apenas coordenadores podem salvar avaliações'
            });
        }

        if (!colaboradorId || !mes || !ano || !detratorIndividual || !detratorArea || !detratorJunior || 
            !checklist || !abastecimentos || !tmaTme || !valorCalculado || !qtdAtendimentos) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        const dadosAvaliacao = {
            colaboradorId: colaboradorId.toString(),
            mes: parseInt(mes),
            ano: parseInt(ano),
            detratorIndividual: parseFloat(detratorIndividual),
            detratorArea: parseFloat(detratorArea),
            detratorJunior: parseFloat(detratorJunior),
            checklist: parseFloat(checklist),
            abastecimentos: parseFloat(abastecimentos),
            tmaTme: parseFloat(tmaTme),
            valorCalculado: parseFloat(valorCalculado),
            atendimento: parseFloat(tmaTme),
            qtdAtend: parseFloat(qtdAtendimentos)
        };

        const avaliacaoExistente = await avaliacaoService.verificarAvaliacaoExistente(colaboradorId, mes, ano);

        if (avaliacaoExistente) {
            await avaliacaoService.atualizarAvaliacao(avaliacaoExistente.id, dadosAvaliacao);
            console.log('Avaliação atualizada:', {
                id: avaliacaoExistente.id,
                colaboradorId,
                mes,
                ano
            });
        } else {
            const novaAvaliacao = await avaliacaoService.criarAvaliacao(dadosAvaliacao);
            console.log('Nova avaliação criada:', {
                id: novaAvaliacao.id,
                colaboradorId,
                mes,
                ano
            });
        }

        res.json({
            success: true,
            message: 'Avaliação salva com sucesso'
        });
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao salvar avaliação: ' + error.message
        });
    }
};

const getTodasAvaliacoes = async (req, res) => {
    try {
        if (req.user.role !== 'COORDENADOR') {
            return res.status(403).render('error', {
                message: 'Acesso não autorizado',
                status: 403
            });
        }

        const [avaliacoes, colaboradores] = await Promise.all([
            avaliacaoService.getAvaliacoes(),
            avaliacaoService.buscarColaboradores()
        ]);

        res.render('coordenador/avaliacoes', {
            user: req.user,
            avaliacoes: avaliacoes,
            colaboradores: colaboradores
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).render('error', {
            message: 'Erro ao carregar as avaliações',
            status: 500
        });
    }
};

const getTodasAvaliacoesrh = async (req, res) => {
    try {
        
        if (req.user.role !== 'GENTE_E_GESTAO') {
            return res.status(403).render('error', {
                message: 'Acesso não autorizado',
                status: 403
            });
        }

        const [avaliacoes, colaboradores] = await Promise.all([
            avaliacaoService.getAvaliacoes(),
            avaliacaoService.buscarColaboradores()
        ]);

        res.render('admin/avaliacoes', {
            user: req.user,
            avaliacoes: avaliacoes,
            colaboradores: colaboradores
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).render('error', {
            message: 'Erro ao carregar as avaliações',
            status: 500
        });
    }
};

const getMinhasAvaliacoes = async (req, res) => {
    try {
        if (req.user.role !== 'COLABORADOR') {
            return res.status(403).render('error', {
                message: 'Acesso permitido apenas para colaboradores',
                status: 403
            });
        }

        const avaliacoes = await avaliacaoService.buscarAvaliacoesColaborador(req.user.id);

        res.render('colaborador/avaliacoes', {
            avaliacoes,
            user: req.user
        });
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).render('error', {
            message: 'Erro ao buscar avaliações',
            status: 500
        });
    }
};

const deleteAvaliacao = async (req, res) => {
    try {
        const { id } = req.params;
        await avaliacaoService.excluirAvaliacao(id);
        res.json({ success: true, message: 'Avaliação excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir avaliação:', error);
        res.status(500).json({ success: false, message: 'Erro ao excluir avaliação' });
    }
};

module.exports = {
    getAvaliacoesColaborador,
    salvarAvaliacao,
    getTodasAvaliacoes,
    getTodasAvaliacoesrh,
    getMinhasAvaliacoes,
    deleteAvaliacao
}; 
