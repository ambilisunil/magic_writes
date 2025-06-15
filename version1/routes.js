const express = require('express');
const router = express.Router();


router.use('/generate', require('./modules/contenetGeneration/contentGen.route'));
router.use('/auth', require('./modules/users/user.route'));


module.exports = router;
