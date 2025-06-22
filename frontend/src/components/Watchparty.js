import React from 'react';
import { Link } from 'react-router-dom';
import './Watchparty.css';
import firetvLogo from '../assets/firetvlogo.jpeg';
import userIcon from '../assets/userIcon.jpg';
import { FaUserFriends, FaSearch, FaHandshake } from 'react-icons/fa';

const WatchParty = () => {
  return (
    <div className="watch-party">
      {/* Top Bar */}
      <div className="watch-party-header">
        <img src={firetvLogo} alt="Fire TV" className="watch-party-logo" />
        <img src={userIcon} alt="User" className="watch-party-user" />
      </div>

      {/* Main Content */}
      <div className="watch-party-content">
        <h1 className="title">WATCH PARTY</h1>
        <h2 className="subtitle">Host / watch shows and movies together, from anywhere.</h2>
        <p className="desc">Your couch. Their couch. One party.</p>

        {/* Host & Search Buttons */}
        <div className="button-row">
          <Link to="/host-party">
            <button><FaUserFriends /> Host</button>
          </Link>
          <button><FaSearch /> Search for buddies</button>
        </div>

        {/* Input + Join Button Row */}
        <div className="join-section">
          <input className="join-input" placeholder="Enter link to join" />
          <button><FaHandshake /> Join</button>
        </div>
      </div>
    </div>
  );
};

export default WatchParty;
