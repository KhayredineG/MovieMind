export function recommendMovies(userId, ratings, movies, numRecommendations) {
  // Calculate user similarity scores
  const userSimilarities = {};
  const userRatings = ratings.filter(r => r.userId === userId);
  
  if (userRatings.length === 0) {
    return movies
      .sort(() => Math.random() - 0.5)
      .slice(0, numRecommendations)
      .map(movie => ({ ...movie, score: 0 }));
  }

  ratings.forEach(rating => {
    if (rating.userId !== userId) {
      if (!userSimilarities[rating.userId]) {
        userSimilarities[rating.userId] = calculateSimilarity(userRatings, 
          ratings.filter(r => r.userId === rating.userId));
      }
    }
  });

  // Get recommendations based on similar users
  const movieScores = {};
  const userMovies = new Set(userRatings.map(r => r.movieId));

  Object.entries(userSimilarities).forEach(([similarUserId, similarity]) => {
    if (similarity <= 0) return;
    
    const similarUserRatings = ratings.filter(r => r.userId === parseInt(similarUserId));
    
    similarUserRatings.forEach(rating => {
      if (!userMovies.has(rating.movieId)) {
        if (!movieScores[rating.movieId]) {
          movieScores[rating.movieId] = { score: 0, count: 0 };
        }
        movieScores[rating.movieId].score += rating.rating * similarity;
        movieScores[rating.movieId].count += 1;
      }
    });
  });

  // Calculate average scores and sort
  let recommendations = Object.entries(movieScores)
    .map(([movieId, { score, count }]) => ({
      ...movies.find(m => m.id === parseInt(movieId)),
      score: count > 0 ? score / count : 0
    }))
    .sort((a, b) => b.score - a.score);

  // If we don't have enough recommendations, add random movies
  if (recommendations.length < numRecommendations) {
    const existingMovieIds = new Set(recommendations.map(r => r.id));
    const remainingMovies = movies
      .filter(m => !existingMovieIds.has(m.id) && !userMovies.has(m.id))
      .map(m => ({ ...m, score: 0 }));
    
    recommendations = [
      ...recommendations,
      ...remainingMovies.sort(() => Math.random() - 0.5)
    ];
  }

  return recommendations.slice(0, numRecommendations);
}

function calculateSimilarity(userRatings1, userRatings2) {
  const commonMovies = userRatings1.filter(r1 => 
    userRatings2.some(r2 => r2.movieId === r1.movieId));
  
  if (commonMovies.length === 0) return 0;

  const ratings1 = commonMovies.map(r => r.rating);
  const ratings2 = commonMovies.map(r => {
    const rating = userRatings2.find(r2 => r2.movieId === r.movieId);
    return rating.rating;
  });

  return pearsonCorrelation(ratings1, ratings2);
}

function pearsonCorrelation(x, y) {
  if (x.length < 2) return 0;

  const mean = arr => arr.reduce((sum, val) => sum + val, 0) / arr.length;
  const xMean = mean(x);
  const yMean = mean(y);
  
  const numerator = x.reduce((sum, xi, i) => 
    sum + (xi - xMean) * (y[i] - yMean), 0);
  
  const xDev = Math.sqrt(x.reduce((sum, xi) => 
    sum + Math.pow(xi - xMean, 2), 0));
  const yDev = Math.sqrt(y.reduce((sum, yi) => 
    sum + Math.pow(yi - yMean, 2), 0));
  
  if (xDev === 0 || yDev === 0) return 0;
  return numerator / (xDev * yDev);
}