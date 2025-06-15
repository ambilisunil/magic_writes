const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../users/models/user.model');

const REDIRECT_URI = process.env.SERVER_URI + "/auth/google/callback";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, REDIRECT_URI);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.redirectToGoogle = (req, res) => {
  const url = client.generateAuthUrl({ access_type: 'offline', scope: ['profile', 'email'] });
  res.redirect(url);
};

exports.googleCallback = async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, email, name } = ticket.getPayload();

    let user = await User.findOne({ googleId });
    if (!user) user = await new User({ emailId: email, googleId, name }).save();

    const token = jwt.sign({ userId: user._id, email: user.emailId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.redirect(`${process.env.SERVER_URI}?token=${token}`);
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).json({ success: false, error: 'Google Sign-In failed' });
  }
};

exports.webGoogleCallback = async (req, res) => {
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, email, name } = ticket.getPayload();
    let user = await User.findOne({ emailId: email });
    if (!user) user = await new User({ emailId: email, googleId, name }).save();

    const token = jwt.sign({ userId: user._id, email: user.emailId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).json({ success: false, error: 'Google Sign-In failed' });
  }
};