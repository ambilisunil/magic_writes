// const router = require('express').Router();
// const { generateContent, getHistory } = require('./genService');
// const authenticateToken = require('../../middlewares/auth');

// router.post('/generate', authenticateToken, generateContent);
// // router.get('/history', authenticateToken, getHistory);

// module.exports = router;


const router = require('express').Router();
const service = require('./genService'); // check this path too
const {authenticateToken} = require('../../middlewares/auth');

// ✅ These must be functions



console.log('generateContent type:', typeof service.generateContent);
console.log('getHistory type:', typeof service.getHistory);

router.post('/', authenticateToken, service.generateContent);
router.get('/history', authenticateToken, service.getHistory);

module.exports = router;

