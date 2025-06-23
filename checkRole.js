function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.redirect('/');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.render('error', {
                message: 'Acesso não autorizado',
                error: { status: 403 },
                title: 'Erro de Acesso'
            });
        }

        next();
    };
}

module.exports = checkRole; 
