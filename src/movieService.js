import fetch from 'node-fetch';
import similarity from 'similarity';
import { OMDB_API_KEY } from './config.js';

const movieCache = new Map();

export async function getMovieDetails(title) {
    if (movieCache.has(title)) {
        return movieCache.get(title);
    }

    try {
        const response = await fetch(
            `http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch movie details');
        }

        const movie = await response.json();
        
        if (movie.Response === 'False') {
            throw new Error(movie.Error || 'Movie not found');
        }

        const movieDetails = {
            title: movie.Title,
            year: movie.Year,
            genre: movie.Genre,
            plot: movie.Plot,
            director: movie.Director,
            actors: movie.Actors,
            imdbRating: movie.imdbRating,
            poster: movie.Poster
        };

        movieCache.set(title, movieDetails);
        return movieDetails;
    } catch (error) {
        console.error(`Error fetching details for ${title}:`, error);
        throw error;
    }
}

export async function findSimilarMovies(movieTitle, numRecommendations = 5) {
    try {
        const baseMovie = await getMovieDetails(movieTitle);
        const similarMovies = [];

        // Get a list of popular movies to compare against
        const popularMovies = await getPopularMovies();
        
        for (const compareTitle of popularMovies) {
            if (compareTitle.toLowerCase() === movieTitle.toLowerCase()) {
                continue;
            }

            try {
                const compareMovie = await getMovieDetails(compareTitle);
                
                // Calculate similarity score based on multiple factors
                const genreSimilarity = similarity(baseMovie.genre, compareMovie.genre);
                const plotSimilarity = similarity(baseMovie.plot, compareMovie.plot);
                const directorSimilarity = similarity(baseMovie.director, compareMovie.director);
                const actorsSimilarity = similarity(baseMovie.actors, compareMovie.actors);

                const totalScore = (
                    genreSimilarity * 0.3 +
                    plotSimilarity * 0.3 +
                    directorSimilarity * 0.2 +
                    actorsSimilarity * 0.2
                );

                similarMovies.push({
                    ...compareMovie,
                    similarityScore: totalScore
                });
            } catch (error) {
                console.error(`Error processing movie ${compareTitle}:`, error);
                continue;
            }
        }

        return similarMovies
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, numRecommendations);
    } catch (error) {
        console.error('Error finding similar movies:', error);
        throw error;
    }
}

// This would ideally come from a real-time API or database
// For demo purposes, we're using a static list
async function getPopularMovies() {
    return [
        "The Shawshank Redemption",
        "The Godfather",
        "The Dark Knight",
        "Pulp Fiction",
        "Fight Club",
        "Inception",
        "The Matrix",
        "Goodfellas",
        "The Silence of the Lambs",
        "Interstellar",
        "The Lord of the Rings",
        "Forrest Gump",
        "Gladiator",
        "The Green Mile",
        "Saving Private Ryan"
    ];
}