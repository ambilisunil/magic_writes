const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');

const SALT_ROUNDS = 10; // bcrypt salt rounds, adjust if needed

exports.registerUser = async (req, res) => {
    try {
        let user = await User.findOne({ emailId: req.body.emailId });
        if (user) {
            return res.status(400).json({ message: 'Already Registered. Please Login' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);

        const data = {
            name: req.body.name,
            emailId: req.body.emailId,
            password: hashedPassword,
            isUserVerified: false
        };

        user = await new User(data).save();

        const token = jwt.sign(
            { userId: user._id, email: user.emailId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ success: true, token, user });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const user = await User.findOne({ emailId: req.body.emailId });
        if (!user) {
            return res.status(400).json({ message: 'User Not Found' });
        }

        // Compare entered password with hashed password
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password is Incorrect' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.emailId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ success: true, token, user });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};
