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
        
        displayRecommendations(data.recommendations);
        
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

function displayRecommendations(recommendations) {
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';

    if (recommendations.length === 0) {
        recommendationsList.innerHTML = '<p>No similar movies found.</p>';
        return;
    }

    recommendations.forEach(movie => {
        recommendationsList.innerHTML += createMovieCard(movie);
    });
}

// Add event listener for Enter key
document.getElementById('movieInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchMovie();
    }
});

// Add event listener for input changes
document.getElementById('movieInput').addEventListener('input', debounce(function(e) {
    const searchTerm = e.target.value.trim();
    if (searchTerm.length >= 3) { // Only search if 3 or more characters
        searchMoviePreview(searchTerm);
    } else {
        hidePreviewResults();
    }
}, 300)); // Debounce by 300ms to prevent too many API calls

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function searchMoviePreview(searchTerm) {
    try {
        const response = await fetch(`/search-preview?query=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        displayPreviewResults(data.results.slice(0, 5)); // Show only first 5 results
    } catch (error) {
        console.error('Error fetching preview results:', error);
    }
}

function displayPreviewResults(results) {
    const previewContainer = document.getElementById('searchPreview') || createPreviewContainer();
    previewContainer.innerHTML = '';
    
    if (results.length === 0) {
        previewContainer.innerHTML = '<div class="preview-item">No movies found</div>';
        return;
    }

    results.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'placeholder.jpg'}" 
                 alt="${movie.title}" class="preview-poster">
            <div class="preview-info">
                <div class="preview-title">${movie.title}</div>
                <div class="preview-year">${movie.release_date ? `(${movie.release_date.split('-')[0]})` : ''}</div>
            </div>
        `;
        item.addEventListener('click', () => {
            document.getElementById('movieInput').value = movie.title;
            hidePreviewResults();
            searchMovie(movie.id); // Search with specific movie ID
        });
        previewContainer.appendChild(item);
    });
}

function createPreviewContainer() {
    const container = document.createElement('div');
    container.id = 'searchPreview';
    container.className = 'search-preview';
    document.querySelector('.search-box').appendChild(container);
    return container;
}

function hidePreviewResults() {
    const previewContainer = document.getElementById('searchPreview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
}

// Add click outside listener to close preview
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        hidePreviewResults();
    }
});