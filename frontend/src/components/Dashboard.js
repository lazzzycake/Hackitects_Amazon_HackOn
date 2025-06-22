import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import logo from "../assets/firetvlogo.jpeg";

const Dashboard = () => {
  const genreData = [
    { name: "Horror", percent: 35, color: "#ff4d4d" },
    { name: "Comedy", percent: 25, color: "#ffcc00" },
    { name: "Action", percent: 20, color: "#4dd2ff" },
    { name: "Thriller", percent: 20, color: "#c266ff" }
  ];

  const [genres, setGenres] = useState(
    genreData.map((g) => ({ ...g, percent: 0 }))
  );

  useEffect(() => {
    const timer = setTimeout(() => setGenres(genreData), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <img src={logo} alt="Fire TV Logo" className="dashboard-logo" />
        <h1 className="dashboard-title">User Dashboard</h1>
        <i className="fas fa-user user-icon"></i>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat-box">
          <p>Movies Watched</p>
          <span>78</span>
        </div>
        <div className="stat-box">
          <p>Your Achievements</p>
          <span>🥉🥈🥇🥇</span>
        </div>
        <div className="stat-box">
          <p>Total Watch-time</p>
          <span>14 h 32 m</span>
        </div>
        <div className="stat-box">
          <p>Eco Points</p>
          <span>15</span>
        </div>
      </div>

      {/* Split Section */}
      <div className="split-section">
        {/* LEFT COLUMN */}
        <div className="left-column">
          {/* Top Genres */}
          <div className="section-box">
            <h2>Your top genres this month</h2>
            {genres.map((genre, index) => (
              <div className="genre" key={index}>
                <div className="genre-label">
                  <p>{genre.name}</p>
                  <span>{genre.percent}%</span>
                </div>
                <div className="bar-container">
                  <div
                    className="bar"
                    style={{
                      width: `${genre.percent}%`,
                      backgroundColor: genre.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Health Mode */}
          <div className="section-box">
            <h3><strong>Health Mode</strong></h3>
            <p className="desc">
              Tracks your screen time and suggests wellness breaks and breathing sessions.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-split-wrapper">
          <div className="top-media-section">
            <div className="section">
              <h3><strong>Your top Movies</strong></h3>
              <ol className="list orange-text">
                <li>Silence of the Lambs</li>
                <li>Interstellar</li>
                <li>The Dark Knight</li>
              </ol>
            </div>

            <div className="section">
              <h3><strong>Your top Shows</strong></h3>
              <ol className="list orange-text">
                <li>Brooklyn 99</li>
                <li>Mr. Robot</li>
                <li>Stranger Things</li>
              </ol>
            </div>
          </div>

          <div className="section">
            <h3><strong>Language Tutor Mode</strong></h3>
            <p className="desc">
              For language learners, this mode provides real-time translations and grammar tips
              during viewing, and even recommends shows in the target language.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
