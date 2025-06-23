const userService = require('../services/userService');

class UserController {
    async createUser(req, res) {
        try {
            console.log('Tentando criar usuário com role:', req.user.role);
            
            if (req.user.role !== 'COORDENADOR' && req.user.role !== 'GENTE_E_GESTAO') {
                console.log('Acesso negado - Role não permitida:', req.user.role);
                return res.status(403).json({ error: 'Acesso negado.' });
            }

            const userData = req.body;
            console.log('Dados do usuário recebidos:', userData);
            
            const newUser = await userService.createUser(userData);
            console.log('Usuário criado com sucesso:', newUser);

            res.redirect('/coordenador/novo-usuario?success=Usuário cadastrado com sucesso!');
        } catch (error) {
            console.error('Erro ao cadastrar novo usuário:', error);
            res.redirect('/coordenador/novo-usuario?error=' + encodeURIComponent(error.message || 'Erro ao cadastrar novo usuário.'));
        }
    }
}

module.exports = new UserController(); 
