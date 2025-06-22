import React from 'react';
import './PopupModal.css';
import fireLogo from '../assets/firetvlogo.jpeg';
import { FaMicrophone } from 'react-icons/fa';

const PopupModal = ({ visible, children, onTalkToAI, onClose }) => {
  if (!visible) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-card">
        <div className="logo-circle">
          <img src={fireLogo} alt="Fire TV" />
        </div>
        {children}
        {onTalkToAI && (
          <div className="popup-footer">
            <FaMicrophone className="mic" />
            <button onClick={onTalkToAI}>Talk to AI</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupModal;
