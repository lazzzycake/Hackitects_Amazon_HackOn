import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import { FaSearch, FaHome, FaTv, FaArrowLeft } from 'react-icons/fa';

import netflixLogo from '../assets/Netflix.jpeg';
import primeLogo from '../assets/primevideo.png';
import appleLogo from '../assets/appletv.png';
import spotifyLogo from '../assets/spotify.png';
import huluLogo from '../assets/hulu.png';
import zee5Logo from '../assets/zee5icon.png';
import youtubeLogo from '../assets/youtube.png';

const NavBar = ({ searchQuery, onSearchChange, searchResults, onMovieSelect, onRestartPopup }) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setShowDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchVisible(false);
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show dropdown when there are search results and query exists
  useEffect(() => {
    const shouldShow = searchQuery && searchQuery.length > 0 && searchResults && searchResults.length > 0;
    setShowDropdown(shouldShow);
    console.log('Search state:', { searchQuery, resultsCount: searchResults?.length, shouldShow });
  }, [searchQuery, searchResults]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    onSearchChange(value);
    console.log('Search input changed:', value);
  };

  const handleMovieSelect = (movie) => {
    console.log('Movie selected:', movie);
    onMovieSelect(movie);
    onSearchChange(''); // Clear search
    setShowDropdown(false);
    setIsSearchVisible(false);
  };

  return (
    <div className="nav-bar">
      <div className="nav-content">
        <div className="nav-icons">
          <div className="nav-item" onClick={onRestartPopup} style={{ cursor: 'pointer' }}>
            <FaArrowLeft size={32} />
          </div>
          <div className="nav-item search-item" ref={searchRef}>
            <FaSearch size={32} onClick={toggleSearch} style={{ cursor: 'pointer' }} />
            {isSearchVisible && (
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for a movie..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                />
                {showDropdown && (
                  <div className="search-dropdown">
                    {searchResults.map((movie) => (
                      <div
                        key={movie.title}
                        className="search-result-item"
                        onClick={() => handleMovieSelect(movie)}
                      >
                        <img src={movie.url} alt={movie.title} className="search-result-image" />
                        <div className="search-result-info">
                          <span className="search-result-title">{movie.title}</span>
                          {movie.description && (
                            <span className="search-result-description">{movie.description}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Link to="/" className="nav-item">
            <FaHome size={32} className="home-icon" />
            <p>Home</p>
          </Link>
          <div className="nav-item">
            <FaTv size={32} />
            <p>TV</p>
          </div>
        </div>
        <div className="app-logos">
          <a href="https://www.netflix.com" target="_blank" rel="noopener noreferrer">
            <img src={netflixLogo} alt="Netflix" className="app-tile" />
          </a>
          <a href="https://www.primevideo.com" target="_blank" rel="noopener noreferrer">
            <img src={primeLogo} alt="Prime Video" className="app-tile" />
          </a>
          <a href="https://tv.apple.com" target="_blank" rel="noopener noreferrer">
            <img src={appleLogo} alt="Apple TV" className="app-tile" />
          </a>
          <a href="https://www.spotify.com" target="_blank" rel="noopener noreferrer">
            <img src={spotifyLogo} alt="Spotify" className="app-tile" />
          </a>
          <a href="https://www.hulu.com" target="_blank" rel="noopener noreferrer">
            <img src={huluLogo} alt="Hulu" className="app-tile" />
          </a>
          <a href="https://www.zee5.com" target="_blank" rel="noopener noreferrer">
            <img src={zee5Logo} alt="Zee5" className="app-tile" />
          </a>
          <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
            <img src={youtubeLogo} alt="YouTube" className="app-tile" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
