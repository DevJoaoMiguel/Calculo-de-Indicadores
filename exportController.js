const exportService = require('../services/exportService');

const exportToExcel = async (req, res) => {
  try {
    const { colaboradorId, avaliacaoId } = req.query;
    const buffer = await exportService.exportToExcel(colaboradorId, avaliacaoId);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=avaliacoes_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    res.status(500).json({ error: 'Erro ao exportar para Excel' });
  }
};

const exportToPDF = async (req, res) => {
  try {
    const { colaboradorId, avaliacaoId } = req.query;
    const buffer = await exportService.exportToPDF(colaboradorId, avaliacaoId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=avaliacoes_${new Date().toISOString().split('T')[0]}.pdf`);
    
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    res.status(500).json({ error: 'Erro ao exportar para PDF' });
  }
};

module.exports = {
  exportToExcel,
  exportToPDF
};
