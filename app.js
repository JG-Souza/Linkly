const express = require('express');
const { nanoid } = require('nanoid');
const Redis = require('ioredis');

const app = express();
const PORT = 3000;

const redis = new Redis();

app.use(express.json()); // Middleware para parsear JSON

app.post('/shorten', async (req, res) => {
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