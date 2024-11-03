const express = require('express');
const app = express();

app.get('/search-preview', async (req, res) => {
    try {
        const query = req.query.query;
        const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch preview results' });
    }
});

// Add your other routes here

app.listen(3000, () => {
    console.log('Server is running on port 3000');
}); 