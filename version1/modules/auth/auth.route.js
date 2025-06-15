const router = require('express').Router();
const { googleCallback, webGoogleCallback, redirectToGoogle } = require('./auth.service');

router.get('/google', redirectToGoogle);
router.get('/google/callback', googleCallback);
router.post('/google/callback', webGoogleCallback);
module.exports = router;
