const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const buscarAvaliacoesColaborador = async (colaboradorId) => {
    return await prisma.performanceEvaluation.findMany({
        where: {
            colaboradorId: colaboradorId
        },
        orderBy: [
            { ano: 'desc' },
            { mes: 'desc' }
        ]
    });
};

const verificarAvaliacaoExistente = async (colaboradorId, mes, ano) => {
    return await prisma.performanceEvaluation.findFirst({
        where: {
            colaboradorId: colaboradorId.toString(),
            mes: parseInt(mes),
            ano: parseInt(ano)
        }
    });
};

const criarAvaliacao = async (dadosAvaliacao) => {
    const colaborador = await prisma.user.findUnique({
        where: { id: dadosAvaliacao.colaboradorId.toString() },
        select: { cargo: true }
    });
    let teto = 1000;
    if (colaborador && colaborador.cargo === 'JUNIOR') {
        teto = 700;
    }
    const dadosFormatados = {
        ...dadosAvaliacao,
        colaboradorId: dadosAvaliacao.colaboradorId.toString(),
        mes: parseInt(dadosAvaliacao.mes),
        ano: parseInt(dadosAvaliacao.ano),
        detratorIndividual: parseFloat(dadosAvaliacao.detratorIndividual || 0),
        detratorArea: parseFloat(dadosAvaliacao.detratorArea || 0),
        detratorJunior: parseFloat(dadosAvaliacao.detratorJunior || 0),
        checklist: parseFloat(dadosAvaliacao.checklist || 0),
        abastecimentos: parseFloat(dadosAvaliacao.abastecimentos || 0),
        tmaTme: parseFloat(dadosAvaliacao.tmaTme || 0),
        valorCalculado: Math.min(parseFloat(dadosAvaliacao.valorCalculado || 0), teto), // Aplica o teto
        refTec: parseFloat(dadosAvaliacao.refTec || 0),
        atendimento: parseFloat(dadosAvaliacao.atendimento || 0),
        qtdAtend: parseFloat(dadosAvaliacao.qtdAtend || 0)
    };

    return await prisma.performanceEvaluation.create({
        data: dadosFormatados
    });
};

const buscarAvaliacaoPorId = async (id) => {
    return await prisma.performanceEvaluation.findUnique({
        where: { id: parseInt(id) },
        include: {
            colaborador: {
                select: {
                    id: true,
                    nome: true,
                    cargo: true
                }
            }
        }
    });
};

const excluirAvaliacao = async (id) => {
    try {
        return await prisma.performanceEvaluation.delete({
            where: {
                id: parseInt(id)
            }
        });
    } catch (error) {
        console.error('Erro ao excluir avaliação:', error);
        throw error;
    }
};

const buscarColaboradores = async () => {
    return await prisma.user.findMany({
        where: {
            role: 'COLABORADOR'
        },
        select: {
            id: true,
            nome: true,
            cargo: true
        }
    });
};

const getAvaliacoes = async () => {
    try {
        const avaliacoes = await prisma.performanceEvaluation.findMany({
            include: {
                colaborador: {
                    select: {
                        id: true,
                        nome: true,
                        cargo: true
                    }
                }
            },
            orderBy: [
                { ano: 'desc' },
                { mes: 'desc' }
            ]
        });

        return avaliacoes.map(avaliacao => ({
            id: avaliacao.id,
            colaboradorId: avaliacao.colaborador.id,
            colaborador: avaliacao.colaborador.nome,
            cargo: avaliacao.colaborador.cargo,
            periodo: `${avaliacao.mes}/${avaliacao.ano}`,
            detratorIndividual: avaliacao.detratorIndividual,
            detratorArea: avaliacao.detratorArea,
            detratorJunior: avaliacao.detratorJunior,
            checklist: avaliacao.checklist,
            abastecimentos: avaliacao.abastecimentos,
            tmaTme: avaliacao.tmaTme,
            valorCalculado: avaliacao.valorCalculado,
            refTec: avaliacao.refTec,
            atendimento: avaliacao.atendimento,
            qtdAtend: avaliacao.qtdAtend
        }));
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        throw new Error('Erro ao buscar avaliações');
    }
};

function calcularValorTotal(dados) {
    const {
        detratorIndividual,
        detratorArea,
        detratorJunior,
        abastecimentos,
        checklist,
        tmaTme,
        refTec,
        atendimento,
        qtdAtend
    } = dados;

    const mediaDetratores = (detratorIndividual + detratorArea + detratorJunior) / 3;

    const mediaIndicadores = (abastecimentos + checklist + tmaTme) / 3;

    const mediaAtendimentos = qtdAtend > 0 ? (refTec + atendimento) / 2 : 0;

    const valorTotal = (mediaDetratores * 0.4) + (mediaIndicadores * 0.4) + (mediaAtendimentos * 0.2);

    return parseFloat(valorTotal.toFixed(2));
}

const atualizarAvaliacao = async (id, dadosAvaliacao) => {
    const dadosFormatados = {
        ...dadosAvaliacao,
        colaboradorId: dadosAvaliacao.colaboradorId.toString(),
        mes: parseInt(dadosAvaliacao.mes),
        ano: parseInt(dadosAvaliacao.ano),
        detratorIndividual: parseFloat(dadosAvaliacao.detratorIndividual || 0),
        detratorArea: parseFloat(dadosAvaliacao.detratorArea || 0),
        detratorJunior: parseFloat(dadosAvaliacao.detratorJunior || 0),
        checklist: parseFloat(dadosAvaliacao.checklist || 0),
        abastecimentos: parseFloat(dadosAvaliacao.abastecimentos || 0),
        tmaTme: parseFloat(dadosAvaliacao.tmaTme || 0),
        valorCalculado: parseFloat(dadosAvaliacao.valorCalculado || 0),
        refTec: parseFloat(dadosAvaliacao.refTec || 0),
        atendimento: parseFloat(dadosAvaliacao.atendimento || 0),
        qtdAtend: parseFloat(dadosAvaliacao.qtdAtend || 0)
    };

    return await prisma.performanceEvaluation.update({
        where: { id: parseInt(id) },
        data: dadosFormatados
    });
};

/**
 * Busca e calcula todos os indicadores do dashboard admin.
 * @param {Object} filtros - Filtros opcionais: colaboradorId, mes, ano, semana
 * @returns {Object} Dados para os cards e gráficos do dashboard
 */
async function getIndicadoresDashboard({ colaboradorId, mes, ano, semana }) {
    console.log('Filtros recebidos:', { colaboradorId, mes, ano, semana });
    const where = {};
    if (colaboradorId) where.colaboradorId = colaboradorId;
    if (mes) where.mes = Number(mes);
    if (ano) where.ano = Number(ano);

    const avaliacoes = await prisma.performanceEvaluation.findMany({
        where,
        include: { colaborador: true },
        orderBy: [{ ano: 'desc' }, { mes: 'desc' }]
    });
    console.log('Avaliações encontradas:', avaliacoes.length, avaliacoes);

    const totalDetratores = avaliacoes.reduce((acc, a) => acc + (a.detratorIndividual || 0), 0);
    const totalDetratoresArea = avaliacoes.reduce((acc, a) => acc + (a.detratorArea || 0), 0);
    const totalDetratoresJunior = avaliacoes.reduce((acc, a) => acc + (a.detratorJunior || 0), 0);
    const totalChecklist = avaliacoes.reduce((acc, a) => acc + (a.checklist || 0), 0);
    const totalAbastecimentos = avaliacoes.reduce((acc, a) => acc + (a.abastecimentos || 0), 0);
    const mediaTmaTme = avaliacoes.length > 0 ? (avaliacoes.reduce((acc, a) => acc + (a.tmaTme || 0), 0) / avaliacoes.length) : 0;
    const tempoMedioAtendimento = mediaTmaTme;
    const totalAvaliacoes = avaliacoes.length;
    const totalSatisfacao = avaliacoes.filter(a => a.atendimento >= 0.8).length;
    const porcentagemSatisfacao = totalAvaliacoes > 0 ? (totalSatisfacao / totalAvaliacoes) * 100 : 0;

    const totalColaboradores = await prisma.user.count({ where: { role: 'COLABORADOR' } });
    const avaliacoesPendentes = avaliacoes.filter(a => !a.concluida).length;
    const avaliacoesConcluidas = avaliacoes.filter(a => a.concluida).length;
    const mediaGeral = avaliacoes.length > 0 ? (avaliacoes.reduce((acc, curr) => acc + (curr.valorCalculado || 0), 0) / avaliacoes.length) : 0;

    const labels = [...new Set(avaliacoes.map(a => `${a.mes}/${a.ano}`))].sort();
    const graficoDetratores = labels.map(label => {
        const [m, a] = label.split('/');
        const avs = avaliacoes.filter(av => av.mes == m && av.ano == a);
        return avs.reduce((acc, a) => acc + (a.detratorIndividual || 0), 0);
    });
    const graficoTmaTme = labels.map(label => {
        const [m, a] = label.split('/');
        const avs = avaliacoes.filter(av => av.mes == m && av.ano == a);
        return avs.length > 0 ? (avs.reduce((acc, a) => acc + (a.tmaTme || 0), 0) / avs.length) : 0;
    });
    const graficoSatisfacao = labels.map(label => {
        const [m, a] = label.split('/');
        const avs = avaliacoes.filter(av => av.mes == m && av.ano == a);
        const sat = avs.filter(a => a.atendimento >= 0.8).length;
        return avs.length > 0 ? (sat / avs.length) * 100 : 0;
    });

    return {
        totalDetratores,
        totalDetratoresArea,
        totalDetratoresJunior,
        totalChecklist,
        totalAbastecimentos,
        mediaTmaTme,
        tempoMedioAtendimento,
        porcentagemSatisfacao,
        labels,
        graficoDetratores,
        graficoTmaTme,
        graficoSatisfacao,
        totalAvaliacoes,
        totalColaboradores,
        avaliacoesPendentes,
        avaliacoesConcluidas,
        mediaGeral
    };
}

class AvaliacaoService {
    async getAvaliacoes() {
        try {
            const avaliacoes = await prisma.performanceEvaluation.findMany({
                include: {
                    colaborador: {
                        select: {
                            id: true,
                            nome: true,
                            cargo: true
                        }
                    }
                },
                orderBy: [
                    { ano: 'desc' },
                    { mes: 'desc' }
                ]
            });

            return avaliacoes.map(avaliacao => ({
                id: avaliacao.id,
                colaboradorId: avaliacao.colaborador.id,
                colaborador: avaliacao.colaborador.nome,
                cargo: avaliacao.colaborador.cargo,
                periodo: `${avaliacao.mes}/${avaliacao.ano}`,
                detratorIndividual: avaliacao.detratorIndividual,
                detratorArea: avaliacao.detratorArea,
                detratorJunior: avaliacao.detratorJunior,
                checklist: avaliacao.checklist,
                abastecimentos: avaliacao.abastecimentos,
                tmaTme: avaliacao.tmaTme,
                valorCalculado: avaliacao.valorCalculado,
                refTec: avaliacao.refTec,
                atendimento: avaliacao.atendimento,
                qtdAtend: avaliacao.qtdAtend
            }));
        } catch (error) {
            console.error('Erro ao buscar avaliações:', error);
            throw new Error('Erro ao buscar avaliações');
        }
    }

    async buscarColaboradores() {
        try {
            return await prisma.user.findMany({
                where: {
                    role: 'COLABORADOR'
                },
                select: {
                    id: true,
                    nome: true,
                    cargo: true
                },
                orderBy: {
                    nome: 'asc'
                }
            });
        } catch (error) {
            console.error('Erro ao buscar colaboradores:', error);
            throw new Error('Erro ao buscar colaboradores');
        }
    }

    async buscarAvaliacoesColaborador(colaboradorId) {
        return await prisma.performanceEvaluation.findMany({
            where: {
                colaboradorId: colaboradorId
            },
            orderBy: [
                { ano: 'desc' },
                { mes: 'desc' }
            ]
        });
    }

    async verificarAvaliacaoExistente(colaboradorId, mes, ano) {
        return await prisma.performanceEvaluation.findFirst({
            where: {
                colaboradorId: colaboradorId.toString(),
                mes: parseInt(mes),
                ano: parseInt(ano)
            }
        });
    }

    async criarAvaliacao(dadosAvaliacao) {
        const dadosFormatados = {
            ...dadosAvaliacao,
            colaboradorId: dadosAvaliacao.colaboradorId.toString(),
            mes: parseInt(dadosAvaliacao.mes),
            ano: parseInt(dadosAvaliacao.ano),
            detratorIndividual: parseFloat(dadosAvaliacao.detratorIndividual || 0),
            detratorArea: parseFloat(dadosAvaliacao.detratorArea || 0),
            detratorJunior: parseFloat(dadosAvaliacao.detratorJunior || 0),
            checklist: parseFloat(dadosAvaliacao.checklist || 0),
            abastecimentos: parseFloat(dadosAvaliacao.abastecimentos || 0),
            tmaTme: parseFloat(dadosAvaliacao.tmaTme || 0),
            valorCalculado: Math.min(parseFloat(dadosAvaliacao.valorCalculado || 0), 1000),
            refTec: parseFloat(dadosAvaliacao.refTec || 0),
            atendimento: parseFloat(dadosAvaliacao.atendimento || 0),
            qtdAtend: parseFloat(dadosAvaliacao.qtdAtend || 0)
        };

        return await prisma.performanceEvaluation.create({
            data: dadosFormatados
        });
    }

    async buscarAvaliacaoPorId(id) {
        return await prisma.performanceEvaluation.findUnique({
            where: { id: parseInt(id) },
            include: {
                colaborador: {
                    select: {
                        id: true,
                        nome: true,
                        cargo: true
                    }
                }
            }
        });
    }

    async excluirAvaliacao(id) {
        try {
            return await prisma.performanceEvaluation.delete({
                where: {
                    id: parseInt(id)
                }
            });
        } catch (error) {
            console.error('Erro ao excluir avaliação:', error);
            throw error;
        }
    }

    async atualizarAvaliacao(id, dadosAvaliacao) {
        const dadosFormatados = {
            ...dadosAvaliacao,
            colaboradorId: dadosAvaliacao.colaboradorId.toString(),
            mes: parseInt(dadosAvaliacao.mes),
            ano: parseInt(dadosAvaliacao.ano),
            detratorIndividual: parseFloat(dadosAvaliacao.detratorIndividual || 0),
            detratorArea: parseFloat(dadosAvaliacao.detratorArea || 0),
            detratorJunior: parseFloat(dadosAvaliacao.detratorJunior || 0),
            checklist: parseFloat(dadosAvaliacao.checklist || 0),
            abastecimentos: parseFloat(dadosAvaliacao.abastecimentos || 0),
            tmaTme: parseFloat(dadosAvaliacao.tmaTme || 0),
            valorCalculado: parseFloat(dadosAvaliacao.valorCalculado || 0),
            refTec: parseFloat(dadosAvaliacao.refTec || 0),
            atendimento: parseFloat(dadosAvaliacao.atendimento || 0),
            qtdAtend: parseFloat(dadosAvaliacao.qtdAtend || 0)
        };

        return await prisma.performanceEvaluation.update({
            where: { id: parseInt(id) },
            data: dadosFormatados
        });
    }

    calcularValorTotal(dados) {
        const {
            detratorIndividual,
            detratorArea,
            detratorJunior,
            abastecimentos,
            checklist,
            tmaTme,
            refTec,
            atendimento,
            qtdAtend
        } = dados;

        const mediaDetratores = (detratorIndividual + detratorArea + detratorJunior) / 3;
        const mediaIndicadores = (abastecimentos + checklist + tmaTme) / 3;
        const mediaAtendimentos = qtdAtend > 0 ? (refTec + atendimento) / 2 : 0;
        const valorTotal = (mediaDetratores * 0.4) + (mediaIndicadores * 0.4) + (mediaAtendimentos * 0.2);

        return parseFloat(valorTotal.toFixed(2));
    }
}

module.exports = {
    getIndicadoresDashboard,
    buscarColaboradores,
    buscarAvaliacoesColaborador,
    verificarAvaliacaoExistente,
    criarAvaliacao,
    buscarAvaliacaoPorId,
    excluirAvaliacao,
    atualizarAvaliacao,
    getAvaliacoes
}; 
