const express = require('express');
const path = require('path');
const { Groq } = require('groq-sdk');
const Coracao = require('./coracao');
require('dotenv').config();

const app = express();
const coracao = new Coracao();

// O Groq vai usar a chave do ambiente (Netlify Env)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(express.static('public'));

// Rota da API de Chat
app.post('/api/chat', async (req, res) => {
    const { message, arquetipo, history } = req.body;

    try {
        const sentimento = coracao.sentir(message);
        const reacaoImediata = coracao.falar(sentimento);

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: coracao.getSystemPrompt(arquetipo) },
                ...(history || []),
                { role: 'user', content: message }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.8
        });

        res.json({
            sentimento,
            reacao_coracao: reacaoImediata,
            resposta_ia: completion.choices[0].message.content
        });
    } catch (error) {
        console.error('Erro na API:', error);
        res.status(500).json({ error: 'Erro no motor do Gustavo' });
    }
});

// Serve index.html para qualquer rota (SPA style)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Gustavo IA Node online na porta ${PORT} 🚀`));
