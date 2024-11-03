async function searchMovie() {
    const movieInput = document.getElementById('movieInput');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const movieDetails = document.getElementById('movieDetails');
    const mainMovie = document.getElementById('mainMovie');
    const recommendationsList = document.getElementById('recommendationsList');

    if (!movieInput.value.trim()) {
        showError('Please enter a movie title');
        return;
    }

    try {
        showLoading();
        
        const response = await fetch(`/api/movies/${encodeURIComponent(movieInput.value)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch movie data');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        mainMovie.innerHTML = createMovieCard(data.movie, true);
        
        if (data.recommendations.length === 0) {
            recommendationsList.innerHTML = `
                <div class="no-recommendations">
                    <p>No similar movies found. Try another movie!</p>
                </div>
            `;
        } else {
            recommendationsList.innerHTML = data.recommendations
                .map(movie => createMovieCard(movie))
                .join('');
        }
        
        movieDetails.classList.remove('hidden');
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
}

function createMovieCard(movie, isMainMovie = false) {
    const rating = parseFloat(movie.imdbRating) || 0;
    const stars = '★'.repeat(Math.round(rating/2)) + '☆'.repeat(5 - Math.round(rating/2));
    
    return `
        <div class="movie-card">
            <div class="movie-content">
                <div class="movie-poster">
                    <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=No+Poster'}" 
                         alt="${movie.Title}"
                         onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'">
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.Title} (${movie.Year})</h3>
                    <div class="movie-meta">
                        <span><i class="fas fa-film"></i> ${movie.Genre}</span>
                        <span><i class="fas fa-clock"></i> ${movie.Runtime}</span>
                    </div>
                    <p class="movie-plot">${movie.Plot || 'No plot available.'}</p>
                    <div class="movie-rating">
                        <span class="star">${stars}</span>
                        <span>${movie.imdbRating ? `${movie.imdbRating}/10` : 'Not rated'}</span>
                    </div>
                    ${isMainMovie ? `
                        <div class="movie-details">
                            <p><strong>Director:</strong> ${movie.Director || 'Not available'}</p>
                            <p><strong>Cast:</strong> ${movie.Actors || 'Not available'}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('movieDetails').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.classList.remove('hidden');
}

// Add event listener for Enter key
document.getElementById('movieInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchMovie();
    }
});