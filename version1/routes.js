const express = require('express');
const router = express.Router();


router.use('/generate', require('./modules/contenetGeneration/gen.route'));
router.use('/auth', require('./modules/auth/auth.route'));
router.use('/users', require('./modules/users/user.route'));
router.use('/writings', require('./modules/writings/wring.route'));




module.exports = router;
