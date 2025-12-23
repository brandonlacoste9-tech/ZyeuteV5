import express from 'express';
import { processQuery } from '../utils/tiguy-patterns.js';
import { getRandomJoke } from '../utils/tiguy-jokes.js';

const router = express.Router();

router.post('/chat', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'Envoie-moi un message, câlisse!' 
      });
    }
    
    const response = processQuery(message);
    
    res.json({
      response: response.message,
      type: response.type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('TI-GUY error:', error);
    res.status(500).json({ 
      error: 'Osti, j\'ai eu un problème! Réessaye mon ami!' 
    });
  }
});

router.get('/joke', (req, res) => {
  res.json({ 
    joke: getRandomJoke(),
    timestamp: new Date().toISOString()
  });
});

router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'TI-GUY est ben actif, mon chum!',
    timestamp: new Date().toISOString()
  });
});

export default router;
