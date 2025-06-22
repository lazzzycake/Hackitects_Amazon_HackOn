import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HeroBanner.css';
import { FaUsers, FaDesktop, FaUser } from 'react-icons/fa';
import hero1 from '../assets/hero1.jpg';
import hero2 from '../assets/hero2.jpg';
import hero3 from '../assets/hero3.jpg';

const heroImages = [hero1, hero2, hero3];

const AUTO_ROTATE_INTERVAL = 4000; // 4 seconds

const HeroBanner = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  // Auto-rotate logic
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Manual navigation resets timer
  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    resetInterval();
  };
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    resetInterval();
  };
  const resetInterval = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, AUTO_ROTATE_INTERVAL);
  };

  return (
    <div className="hero-section">
      <img
        src={heroImages[currentIndex]}
        alt={`Promotional banner ${currentIndex + 1}`}
        className="hero-background-image"
      />
      {/* Left Arrow */}
      <button className="hero-arrow left" onClick={goToPrev} aria-label="Previous banner">&#60;</button>
      {/* Right Arrow */}
      <button className="hero-arrow right" onClick={goToNext} aria-label="Next banner">&#62;</button>

      <div className="top-right-icons">
        <Link to="/buddies" className="icon-circle">
          <FaUsers size={22} />
        </Link>
        <Link to="/watch-party" className="icon-circle">
          <FaDesktop size={22} />
        </Link>
        <Link to="/dashboard" className="icon-circle">
          <FaUser size={22} />
        </Link>
      </div>
      <div className="hero-content-area">
        <div className="hero-buttons">
          <button className="watch-now">{currentIndex === 2 ? 'Watch Now | Netflix' : 'Watch Now | Prime Video'}</button>
          <button className="learn-more">Learn More</button>
        </div>
      </div>
      {/* Pagination dots */}
      <div className="hero-pagination-dots">
        {heroImages.map((_, idx) => (
          <span
            key={idx}
            className={`hero-dot${currentIndex === idx ? ' active' : ''}`}
          />
        ))}
      </div>
      {children}
    </div>
  );
};

export default HeroBanner;
