import fetch from 'node-fetch';

const OMDB_API_KEY = '25ed7bdc';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

export async function searchMovie(title) {
    try {
        const response = await fetch(
            `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&plot=full`,
            {
                timeout: 8000,
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.Error) {
            throw new Error(data.Error);
        }
        
        if (!data.Title) {
            throw new Error('Movie not found');
        }
        
        return data;
    } catch (error) {
        if (error.type === 'system') {
            throw new Error('Network error. Please try again later.');
        }
        throw new Error(`Failed to fetch movie: ${error.message}`);
    }
}

export async function getSimilarMovies(movie) {
    try {
        // Get movies from the same primary genre and year range
        const primaryGenre = movie.Genre.split(',')[0].trim();
        const movieYear = parseInt(movie.Year);
        
        const searchUrl = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(primaryGenre)}&type=movie&y=${movieYear}`;
        
        const response = await fetch(searchUrl, {
            timeout: 8000,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.Error) {
            // If no exact year match, try a broader search
            const broadResponse = await fetch(
                `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(primaryGenre)}&type=movie`,
                {
                    timeout: 8000,
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            if (!broadResponse.ok) {
                throw new Error(`HTTP error! status: ${broadResponse.status}`);
            }

            const broadData = await broadResponse.json();
            if (broadData.Error) {
                return []; // Return empty array instead of throwing error for no recommendations
            }
            data.Search = broadData.Search;
        }
        
        // Get detailed information for each movie and filter out the original movie
        const similarMovies = await Promise.all(
            data.Search
                .filter(m => m.imdbID !== movie.imdbID)
                .slice(0, 6)
                .map(async m => {
                    try {
                        const details = await fetch(
                            `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${m.imdbID}&plot=full`,
                            {
                                timeout: 8000,
                                headers: {
                                    'Accept': 'application/json'
                                }
                            }
                        );
                        
                        if (!details.ok) {
                            return null;
                        }
                        
                        return details.json();
                    } catch (error) {
                        console.error(`Error fetching details for movie ${m.imdbID}:`, error);
                        return null;
                    }
                })
        );
        
        return similarMovies
            .filter(m => m && !m.Error)
            .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating));
    } catch (error) {
        console.error('Error in getSimilarMovies:', error);
        return []; // Return empty array instead of throwing error
    }
}