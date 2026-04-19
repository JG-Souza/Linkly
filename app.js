const express = require('express');
const { nanoid } = require('nanoid');
const app = express();
const PORT = 3000;

app.post('shorten', (req, res) => {
    let newUrl = nanoid(6);
})

app.get(`/${code}`, (req, res) => {

})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});