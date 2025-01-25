const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to generate content
app.post('/generate', async (req, res) => {
    let { prompt,type ,language} = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    if(type){
        if(type=="poem"){
            prompt= "write a unique beautiful poem about or describe "+prompt
        }else if(type=="story"){
            prompt= "write a unique story about or describe "+prompt
        }else if(type=="description"){
            prompt= "write about  "+prompt
        }
        else if(type=="email"){
            prompt= "write a email that describe following thiigs  "+prompt
        }else if(type=="ad"){
            prompt= "write a advertisement about  "+prompt
        }
    }
    if(language){
        prompt=prompt+" in " +language+ " language"
    }

    try {
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
        // const generatedText=   `Hi DEVAI,

        // We're happy to share that we've automatically moved your organization to Usage Tier 1 based on your usage history on our platform. For most organizations, this comes with an increase in rate limits across several models. You can review your new usage tier and limits in your account settings.
        
        // For a complete overview of how limits and usage tiers work, please refer to our documentation.
        
        //  Hi DEVAI,
        //  ചന്ദ്രൻ പ്രകാശിക്കുന്ന രാത്രിയിൽ അടുത്ത വനം രമണീയമാണ്. ചന്ദ്രൻ തന്റെ ഭാഗ്യം വളരുന്ന ഈ നിറം പരിസ്ഥിതി വിശ്രമിക്കാൻ വനം സൃഷ്ടിച്ചു. ചന്ദ്രൻ ഒരുപാട് കമ്പനികൾ പറയുന്നതുപോലെ വനം കേളിക്കുന്നു.
        
        // We're happy to share that we've automatically moved your organization to Usage Tier 1 based on your usage history on our platform. For most organizations, this comes with an increase in rate limits across several models. You can review your new usage tier and limits in your account settings.
        
        // For a complete overview of how limits and usage tiers work, please refer to our documentation.
        // Hi DEVAI,
        
        // We're happy to share that we've automatically moved your organization to Usage Tier 1 based on your usage history on our platform. For most organizations, this comes with an increase in rate limits across several models. You can review your new usage tier and limits in your account settings.
        
        // For a complete overview of how limits and usage tiers work, please refer to our documentation.
        
        // Thank you,
      //  The OpenAI team`
        res.status(200).json({ content: generatedText });
    } catch (error) {
        console.error('Error generating content:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});