const axios = require('axios');
const User = require('../users/models/user.model');
const UserHistory = require('../users/models/userHistory.model');
const constants = require('../../../utils/constant');

exports.generateContent = async (req, res) => {
  let { prompt, type, language } = req.body;
  if (req.body.fe) return res.status(200).json({ content: constants.dummy_poem });

  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  if (type) {
    if (type == "poem") prompt = "write a unique beautiful poem about or describe " + prompt;
    else if (type == "story") prompt = "write a unique story about or describe " + prompt;
    else if (type == "description") prompt = "write about  " + prompt;
    else if (type == "email") prompt = "write a email that describe following thiigs  " + prompt;
    else if (type == "ad") prompt = "write a advertisement about  " + prompt;
  }
  if (language) prompt += ` in ${language} language`;

  try {
    const user = await User.findById(req.user.userId);
    if (user.useCount > process.env.MAX_USECOUNT) {
      return res.status(400).json({ content: "Limit Reached", message: "Limit Reached,Max Limit is 5 Trials" });
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const generatedText = response.data.choices[0].message.content.trim();
    await User.findByIdAndUpdate(user._id, { $inc: { useCount: 1 } });
    await new UserHistory({ userId: req.user.userId, content: generatedText, type, prompt }).save();
    res.status(200).json({ content: generatedText });
  } catch (err) {
    console.error('Error generating content:', err.response ? err.response.data : err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate content', err });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const data = await UserHistory.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching history:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};