

const router = require('express').Router();
const service = require('./writing.service');
const {authenticateToken} = require('../../middlewares/auth');



router.post('/', authenticateToken, service.addWriting);
router.get('/my', authenticateToken, service.listMyWritings);
router.get('/public', authenticateToken, service.listPublicWritings);
router.get('/:id', authenticateToken, service.getWritingById);
router.put('/:id', authenticateToken, service.editWriting);
router.delete('/:id', authenticateToken, service.deleteWriting);

module.exports = router;

