import React from 'react';
import './Header.css';
import { FaFire } from 'react-icons/fa';

const Header = () => {
  return (
    <header className="site-header">
      <div className="logo-container">
        <FaFire className="logo-icon" />
        <h1 className="logo-title">Fire TV Mock</h1>
      </div>
    </header>
  );
};

export default Header; 