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

// Rota da API de Chat - Com suporte a vários motores
app.post('/api/chat', async (req, res) => {
    const { message, arquetipo, history, model } = req.body;

    // Motores disponíveis via Groq
    const availableModels = {
        'llama-3.3': 'llama-3.3-70b-versatile',
        'llama-3.1-70b': 'llama-3.1-70b-versatile',
        'llama-3.1-8b': 'llama-3.1-8b-instant',
        'mixtral-8x7b': 'mixtral-8x7b-32768',
        'gemma-2-9b': 'gemma2-9b-it'
    };

    const selectedModel = availableModels[model] || 'llama-3.3-70b-versatile';

    try {
        const sentimento = coracao.sentir(message);
        const reacaoImediata = coracao.falar(sentimento);

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: coracao.getSystemPrompt(arquetipo) },
                ...(history || []),
                { role: 'user', content: message }
            ],
            model: selectedModel,
            temperature: 0.8
        });

        res.json({
            sentimento,
            reacao_coracao: reacaoImediata,
            resposta_ia: completion.choices[0].message.content,
            motor: selectedModel
        });
    } catch (error) {
        console.error('Erro na API:', error);
        res.status(500).json({ error: 'Erro no motor do Gustavo' });
    }
});

// Rota de Login (Simples para o MVP do JC)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    // Por agora, aceitamos qualquer coisa que pareça o JC ou Leonor
    if (email && password) {
        res.json({ success: true, token: 'fake-jwt-token-jc' });
    } else {
        res.status(401).json({ success: false, message: 'Dados inválidos' });
    }
});

// Rotas explícitas para as páginas
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/chat', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Fallback para index (Landing Page)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Gustavo IA Node online na porta ${PORT} 🚀`));
