import React from 'react';
import './RecommendedMovies.css';

const RecommendedMovies = ({ movies }) => {
  if (!movies || movies.length === 0) {
    return null; // Don't render anything if there are no movies
  }

  return (
    <div className="recommended-container">
      <div className="movies-grid">
        {movies.map((movie) => (
          <div key={movie.title} className="movie-card">
            <img src={movie.url} alt={movie.title} className="movie-banner" />
            <div className="movie-info">
              <p className="movie-title">{movie.title}</p>
              {/* Like/Dislike buttons can be added here later */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedMovies; 