const express = require('express');
const router = express.Router();
const { exportToExcel, exportToPDF } = require('../controllers/exportController');
const { authMiddleware: isAuthenticated, checkRole } = require('../middleware/authMiddleware');

router.get('/excel', isAuthenticated, exportToExcel);

router.get('/pdf', isAuthenticated, exportToPDF);

module.exports = router;
