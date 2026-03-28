module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured in environment variables.' });

  const {
    messages = [],
    model = 'llama-3.3-70b-versatile',
    system,
    stream = true,
    max_tokens = 4096,
    temperature = 0.7
  } = req.body || {};

  if (!messages.length) return res.status(400).json({ error: 'No messages provided.' });

  const groqMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: groqMessages,
        stream,
        max_tokens,
        temperature
      })
    });

    if (!groqRes.ok) {
      let errBody = {};
      try { errBody = await groqRes.json(); } catch(e) {}
      return res.status(groqRes.status).json({ error: errBody?.error?.message || groqRes.statusText });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const reader = groqRes.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } catch(e) {
        // Client disconnected
      } finally {
        res.end();
      }
    } else {
      const data = await groqRes.json();
      res.status(200).json(data);
    }

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
