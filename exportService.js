const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ExportService {
    async exportToExcel(colaboradorId = null, avaliacaoId = null) {
        try {
            const avaliacoes = await this.getAvaliacoes(colaboradorId, avaliacaoId);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Avaliações');

            worksheet.columns = [
                { header: 'Colaborador', key: 'colaborador', width: 30 },
                { header: 'Período', key: 'periodo', width: 15 },
                { header: 'Valor Calculado', key: 'valorCalculado', width: 20 },
                { header: 'Detrator Individual', key: 'detratorIndividual', width: 20 },
                { header: 'Detrator Área', key: 'detratorArea', width: 20 },
                { header: 'Detrator Junior', key: 'detratorJunior', width: 20 },
                { header: 'Checklist', key: 'checklist', width: 20 },
                { header: 'Abastecimentos', key: 'abastecimentos', width: 20 },
                { header: 'TMA/TME', key: 'tmaTme', width: 20 }
            ];

            worksheet.getRow(1).font = { bold: true, size: 12 };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0D6EFD' }
            };
            worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            avaliacoes.forEach(avaliacao => {
                worksheet.addRow({
                    colaborador: avaliacao.colaborador.nome,
                    periodo: `${avaliacao.mes}/${avaliacao.ano}`,
                    valorCalculado: `R$ ${avaliacao.valorCalculado.toFixed(2)}`,
                    detratorIndividual: avaliacao.detratorIndividual === 0 ? '-' : avaliacao.detratorIndividual,
                    detratorArea: avaliacao.detratorArea === 0 ? '-' : avaliacao.detratorArea,
                    detratorJunior: avaliacao.detratorJunior === 0 ? '-' : avaliacao.detratorJunior,
                    checklist: avaliacao.checklist === 0 ? '-' : avaliacao.checklist,
                    abastecimentos: avaliacao.abastecimentos === 0 ? '-' : avaliacao.abastecimentos,
                    tmaTme: avaliacao.tmaTme === 0 ? '-' : avaliacao.tmaTme
                });
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    row.eachCell((cell) => {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.font = { size: 11 };
                    });
                }
            });

            worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
            throw error;
        }
    }

    async exportToPDF(colaboradorId = null, avaliacaoId = null) {
        try {
            const avaliacoes = await this.getAvaliacoes(colaboradorId, avaliacaoId);

            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));

            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text('Avaliações de Desempenho', { align: 'center' });
            
            doc.moveDown();
            doc.fontSize(12)
               .font('Helvetica')
               .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
            
            doc.moveDown(2);

            avaliacoes.forEach(avaliacao => {
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .text(`${avaliacao.colaborador.nome} - ${avaliacao.mes}/${avaliacao.ano}`);
                
                doc.moveDown();

                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .text('Valor Calculado:')
                   .font('Helvetica')
                   .text(`R$ ${avaliacao.valorCalculado.toFixed(2)}`);
                
                doc.moveDown();

                const tableTop = doc.y;
                const tableLeft = 50;
                const cellPadding = 5;
                const cellWidth = (doc.page.width - 100) / 2;

                doc.rect(tableLeft, tableTop, cellWidth, 20)
                   .fill('#0D6EFD');
                
                doc.fillColor('white')
                   .fontSize(10)
                   .text('Indicador', tableLeft + cellPadding, tableTop + cellPadding);
                
                doc.rect(tableLeft + cellWidth, tableTop, cellWidth, 20)
                   .fill('#0D6EFD');
                
                doc.text('Valor', tableLeft + cellWidth + cellPadding, tableTop + cellPadding);

                const indicadores = [
                    ['Detrator Individual', avaliacao.detratorIndividual === 0 ? '-' : avaliacao.detratorIndividual],
                    ['Detrator Área', avaliacao.detratorArea === 0 ? '-' : avaliacao.detratorArea],
                    ['Detrator Junior', avaliacao.detratorJunior === 0 ? '-' : avaliacao.detratorJunior],
                    ['Checklist', avaliacao.checklist === 0 ? '-' : avaliacao.checklist],
                    ['Abastecimentos', avaliacao.abastecimentos === 0 ? '-' : avaliacao.abastecimentos],
                    ['TMA/TME', avaliacao.tmaTme === 0 ? '-' : avaliacao.tmaTme]
                ];

                let y = tableTop + 20;
                indicadores.forEach(([indicador, valor]) => {
                    doc.fillColor('black');
                    doc.rect(tableLeft, y, cellWidth, 20).stroke();
                    doc.text(indicador, tableLeft + cellPadding, y + cellPadding);
                    
                    doc.rect(tableLeft + cellWidth, y, cellWidth, 20).stroke();
                    doc.text(valor.toString(), tableLeft + cellWidth + cellPadding, y + cellPadding);
                    
                    y += 20;
                });

                doc.moveDown(2);
            });

            doc.end();

            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });
                doc.on('error', reject);
            });
        } catch (error) {
            console.error('Erro ao exportar para PDF:', error);
            throw error;
        }
    }

    async getAvaliacoes(colaboradorId = null, avaliacaoId = null) {
        const where = {};
        
        if (colaboradorId) {
            where.colaboradorId = String(colaboradorId);
        }
        
        if (avaliacaoId) {
            where.id = parseInt(avaliacaoId);
        }
        
        return await prisma.performanceEvaluation.findMany({
            where,
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
    }
}

module.exports = new ExportService(); 
