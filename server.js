const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://hemanthchiluka792:aSsdIwf7acjpzMxq@ai-journal.42okxga.mongodb.net/?retryWrites=true&w=majority&appName=AI-journal')
.then(() => {
  console.log('Connected to MongoDB');
});

const MessageSchema = new mongoose.Schema({
  userId: String,
  sender: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

const GEMINI_API_KEY = 'AIzaSyBVc4oFnf6ZX2vLG8yjycLXI8zAEAM000w';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

app.post('/api/message', async (req, res) => {
  try {
    const { userId, message } = req.body;

    const geminiResponse = await axios.post(GEMINI_API_URL, {
      contents: [{ role: 'user', parts: [{ text: message }] }]
    });

    const reply = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, something went wrong.';

    await Message.create({ userId, sender: 'user', message });
    await Message.create({ userId, sender: 'ai', message: reply });

    res.json({ reply });
  } catch (err) {
    console.error('Error in /message:', err.message);
    res.status(500).json({ error: 'Failed to process message.' });
  }
});

app.get('/api/history/:userId', async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.params.userId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error('Error in /history:', err.message);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

app.delete('/api/history/:userId', async (req, res) => {
  try {
    await Message.deleteMany({ userId: req.params.userId });
    res.json({ message: 'History deleted successfully.' });
  } catch (err) {
    console.error('Error in /history/delete:', err.message);
    res.status(500).json({ error: 'Failed to delete history.' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});