const express = require('express');
const { nanoid } = require('nanoid');
const Redis = require('ioredis');

const app = express();
const PORT = 3000;

const redis = new Redis();

app.use(express.json());

app.post('/shorten', async (req, res) => {
    const originalUrl = req.body.url;
    const newUrl = nanoid(6);

    try {
        await redis.set(newUrl, originalUrl);
        res.status(200).json({
            originalUrl: originalUrl,
            newUrl: newUrl
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar no Redis'});
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