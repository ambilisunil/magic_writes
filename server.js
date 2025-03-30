const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const path = require('path');
const { type } = require('os');
const { console } = require('inspector');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const REDIRECT_URI = process.env.SERVER_URI+"/auth/google/callback";
// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, REDIRECT_URI);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
    emailId: { type: String, unique: true, required: true },
    password: { type: String },
    name:{ type: String, default: '' },  
    googleId: { type: String, unique: true, sparse: true }, 
    useCount:{type:Number,default:0}
},{timestamps:true});

const userHistory = new mongoose.Schema({
    userId: { type: String, },
    content: { type: String },
    type: { type: String },
    prompt: { type: String },


},{timestamps:true});

const User = mongoose.model('User', userSchema);
const UserHistory = mongoose.model('UserHistory', userHistory);


// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
}


app.get('/auth/google', async (req, res) => {
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],

    });
    res.redirect(url)

    
});

app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    try {
        // Exchange the authorization code for tokens
        const { tokens } = await client.getToken(code);
        const idToken = tokens.id_token;

        // Verify the ID token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { sub: googleId, email, name } = payload;

        // Check if user already exists
        let user = await User.findOne({ googleId });

        if (!user) {
            // Create a new user
            user = new User({
                emailId: email,
                googleId,
                name
            });
            await user.save();
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.redirect(process.env.SERVER_URI+"?token="+token)


        // Handle user data (e.g., save to database)
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({ success: false, error: 'Google Sign-In failed' });
    }
});
// Google OAuth endpoint
app.post('/auth/google/callback', async (req, res) => {
    console.log("/auth/google..................")
    const { idToken } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();


        // const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        // const data = await response.json();


        const { sub: googleId, email, name } = payload;


       // Check if user already exists
        let user = await User.findOne({ emailId:email });


        if (!user) {
            user = new User({
                emailId: email,
                googleId,
                name
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id, email: user.emailId }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ success: true, token ,user});

    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({ success: false, error: 'Google Sign-In failed' });
    }
});


// API endpoint to generate content
app.post('/generate',authenticateToken, async (req, res) => {
    let { prompt, type, language } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    if (type) {
        if (type == "poem") {
            prompt = "write a unique beautiful poem about or describe " + prompt
        } else if (type == "story") {
            prompt = "write a unique story about or describe " + prompt
        } else if (type == "description") {
            prompt = "write about  " + prompt
        }
        else if (type == "email") {
            prompt = "write a email that describe following thiigs  " + prompt
        } else if (type == "ad") {
            prompt = "write a advertisement about  " + prompt
        }
    }
    if (language) {
        prompt = prompt + " in " + language + " language"
    }

    try {
        let user = await User.findById(new mongoose.Types.ObjectId(req.user.userId));
        if(user.useCount>process.env.MAX_USECOUNT){
            res.status(400).json({ content: "Limit Reached",message:"Limit Reached,Max Limit is 5 Trials" });

        }else{

        

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions', // Updated endpoint for GPT-3.5-turbo
            {
                model: 'gpt-3.5-turbo', // Use the latest GPT model
                messages: [
                    { role: 'user', content: prompt } // Pass the prompt as a user message
                ],
                max_tokens: 300, // Adjust based on the desired length
                temperature: 0.7, // Controls creativity (0 = deterministic, 1 = creative)
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const generatedText = response.data.choices[0].message.content.trim();
        // const generatedText = "jkkjkjkjkj"
      

        await User.findByIdAndUpdate(new mongoose.Types.ObjectId(req.user.userId),{$inc:{useCount:1}});
        history = new UserHistory({
            userId: req.user.userId,
            content:generatedText,
            type,
            prompt
          
        });
        await history.save();

        res.status(200).json({ content: generatedText });
        }
    } catch (error) {
        console.error('Error generating content:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate content' ,error});
    }
});




app.get('/history',authenticateToken, async (req, res) => {
    try {
        let data= await UserHistory.find({userId:req.user.userId}).sort({createdAt:-1});
        res.status(200).json({ data });
        
    } catch (error) {
        console.error('Error fetching history:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});