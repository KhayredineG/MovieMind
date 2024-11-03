import express from 'express';
import cors from 'cors';
import { searchMovie, getSimilarMovies } from './services/movieService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/movies/:title', async (req, res) => {
    try {
        const movie = await searchMovie(req.params.title);
        const similarMovies = await getSimilarMovies(movie);
        
        res.json({
            movie,
            recommendations: similarMovies
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});