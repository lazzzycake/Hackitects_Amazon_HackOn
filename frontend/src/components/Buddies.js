import React from 'react';
import './Buddies.css';
import { FaEye, FaMedal, FaUser } from 'react-icons/fa';
import { MdRecommend } from 'react-icons/md';
import logo from "../assets/firetvlogo.jpeg";

import buddy1 from '../assets/buddy1.jpg';
import buddy2 from '../assets/buddy2.jpg';
import buddy3 from '../assets/buddy3.jpg';
import buddy4 from '../assets/buddy4.jpg';

const buddyData = [
  { name: 'buddy_1', image: buddy1, movies: 23, badges: 4, recs: true },
  { name: 'buddy_2', image: buddy2, movies: 45, badges: 7, recs: true },
  { name: 'buddy_3', image: buddy3, movies: 12, badges: 2, recs: true },
  { name: 'buddy_4', image: buddy4, movies: 4, badges: '-', recs: false },
];

const Buddies = () => {
  return (
    <div className="watch-buddies-fullpage">
      {/* 🔶 Header Row */}
      <div className="header-row">
        <img src={logo} alt="Fire TV Logo" className="dashboard-logo" />
        <h1 className="page-title">WATCH BUDDIES</h1>
        <FaUser className="user-icon" />
      </div>

      {/* 🔶 Table */}
      <div className="buddy-table-wrapper">
        <table className="buddy-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Movies Watched</th>
              <th>Badges Earned</th>
              <th>Recommendations</th>
            </tr>
          </thead>
          <tbody>
            {buddyData.map((buddy, index) => (
              <tr key={index}>
                <td className="name-cell">
                 <img
                  src={buddy.image}
                  alt={buddy.name}
                  className="buddy-avatar"
                />
                  {buddy.name}
                </td>
                <td><FaEye className="icon" /> {buddy.movies}</td>
                <td><FaMedal className="icon" /> {buddy.badges}</td>
                <td>{buddy.recs && <MdRecommend className="icon" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔶 Blend Row */}
      <div className="blend-row">
        <input type="text" placeholder="enter buddy name" />
        <button>Create Blend</button>
      </div>
    </div>
  );
};

export default Buddies; 