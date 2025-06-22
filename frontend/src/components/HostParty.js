import React, { useState } from 'react';
import './HostParty.css';
import firetvLogo from '../assets/firetvlogo.jpeg';
import userIcon from '../assets/userIcon.jpg';

const HostParty = () => {
  const [buddies, setBuddies] = useState(['']);

  const handleAddBuddy = () => {
    setBuddies([...buddies, '']);
  };

  const handleBuddyChange = (index, value) => {
    const newBuddies = [...buddies];
    newBuddies[index] = value;
    setBuddies(newBuddies);
  };

  const handleRemoveBuddy = (index) => {
    const newBuddies = buddies.filter((_, i) => i !== index);
    setBuddies(newBuddies);
  };

  return (
    <div className="host-party">
      <div className="host-party-header">
        <img src={firetvLogo} alt="Fire TV" className="host-party-logo" />
        <h1 className="host-party-title">Host a Watch Party</h1>
        <img src={userIcon} alt="User" className="host-party-user" />
      </div>

      <div className="host-party-content">
        <div className="host-form">
          <div className="form-group">
            <label htmlFor="title">Enter title</label>
            <input type="text" id="title" placeholder="Enter the title of the movie or show" />
          </div>

          <div className="form-group">
            <label htmlFor="time">Time</label>
            <input type="time" id="time" />
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" placeholder="Enter your name" />
          </div>

          <div className="form-group sync-group">
            <label>Video playback</label>
            <div className="sync-toggle">
              <span>Sync</span>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Buddies</label>
            {buddies.map((buddy, index) => (
              <div key={index} className="buddy-input">
                <input
                  type="text"
                  placeholder={`Buddy ${index + 1}`}
                  value={buddy}
                  onChange={(e) => handleBuddyChange(index, e.target.value)}
                />
                {buddies.length > 1 && (
                  <button type="button" onClick={() => handleRemoveBuddy(index)} className="remove-buddy-btn">
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddBuddy} className="add-buddy-btn">
              + Add Buddy
            </button>
          </div>

          <button type="submit" className="create-party-btn">Create</button>
        </div>
      </div>
    </div>
  );
};

export default HostParty; 