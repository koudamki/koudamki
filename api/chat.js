module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  body = body || {};
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';

  if (!apiKey) {
    return res.status(400).json({ error: 'No Groq API key provided.' });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) {
    return res.status(400).json({ error: 'No messages provided.' });
  }

  const model = typeof body.model === 'string' ? body.model : 'llama-3.3-70b-versatile';
  const system = typeof body.system === 'string' ? body.system : undefined;
  const stream = body.stream === true;
  const max_tokens = Number.isFinite(body.max_tokens) ? body.max_tokens : 4096;
  const temperature = Number.isFinite(body.temperature) ? body.temperature : 0.7;

  const groqMessages = system ? [{ role: 'system', content: system }, ...messages] : messages;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
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
      let errorBody = {};
      try {
        errorBody = await groqRes.json();
      } catch {
        // ignore invalid JSON
      }
      return res.status(groqRes.status).json({
        error: errorBody?.error?.message || groqRes.statusText || 'Groq request failed.'
      });
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
      } catch {
        // ignored
      } finally {
        res.end();
      }
      return;
    }

    const data = await groqRes.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error.' });
  }
};
