const express = require('express');
const { nanoid } = require('nanoid');
const Redis = require('ioredis');
const useragent = require('express-useragent');

require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(useragent.express());

const redis = new Redis({
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
});

app.use(express.json()); // Middleware para parsear JSON

function validateAdminToken(req, res, next) {
    const token = req.headers['authorization'];
    if (token === `Bearer ${process.env.ADMIN_TOKEN}`) {
        next();
    } else {
        res.status(401).json({ error: 'Token de autenticação inválido' });
    }
}

app.post('/shorten', validateAdminToken, async (req, res) => {
    try {
        const originalUrl = new URL(req.body.url).href;
        const newUrl = nanoid(6);

        await redis.set(newUrl, originalUrl, 'ex', 60 * 60 * 24 * 7);
        res.status(200).json({
            originalUrl: originalUrl,
            newUrl: newUrl
        });
    } catch (err) {
        if (err instanceof TypeError) {
            return res.status(400).json({ error: 'URL inválida' });
        } else {
            console.error(err);
            res.status(500).json({ error: 'Erro ao salvar no Redis'});
        }
    }
});

app.get('/:shortUrl', async (req, res) => {
    try {
        const result = await redis.get(req.params.shortUrl);
            if (result) {
                await redis.incr(`stats:${req.params.shortUrl}:clicks`);
                await redis.hincrby(`stats:${req.params.shortUrl}:clicks_by_date`, new Date().toISOString().slice(0, 10), 1);
                await redis.hincrby(`stats:${req.params.shortUrl}:clicks_by_browser`, req.useragent?.browser || 'Unknown', 1);
                res.redirect(`${result}`);
            } else {
                res.status(404).json({ error: 'URL não encontrada' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao buscar URL no Redis' });
        }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});