import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import NavBar from './components/NavBar';
import HeroBanner from './components/HeroBanner';
import RecommendedMovies from './components/RecommendedMovies';
import HostParty from './components/HostParty';
import Watchparty from './components/Watchparty';
import PopupModal from './components/PopupModal';
import ListeningPopup from './components/ListeningPopup';
import Dashboard from './components/Dashboard';
import Buddies from './components/Buddies';

// This component now represents the main page content, including the popups and recommendations.
const HomePage = ({ 
  recommendedMovies, 
  setRecommendedMovies, 
  showPopup, 
  setShowPopup, 
  step, 
  setStep,
  responses,
  setResponses,
  subIntentText,
  setSubIntentText,
  loading,
  setLoading,
  error,
  setError,
  handleGetRecommendations,
  handleSelection,
  handleSubIntentSubmit,
  openListeningPopup,
  cancelListening,
  showListening,
  setShowListening,
  handleTranscriptComplete,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  allMovies,
  setAllMovies,
  handleRestartPopup
}) => {
  return (
    <div className="home-page-container">
      {showPopup && (
        <>
          <PopupModal visible={step === 1} onTalkToAI={openListeningPopup} onClose={() => { setShowPopup(false); setStep(1); }}>
            <div className="popup-content">
              <div className="popup-header">Hey! How was your day?</div>
              <div className="popup-buttons">
                <button onClick={() => handleSelection(1, 'How was your day?', 'Good')}>Good</button>
                <button onClick={() => handleSelection(1, 'How was your day?', 'Bad')}>Bad</button>
                <button onClick={() => handleSelection(1, 'How was your day?', 'Okay')}>Okay</button>
              </div>
            </div>
          </PopupModal>

          <PopupModal visible={step === 2} onTalkToAI={openListeningPopup} onClose={() => { setShowPopup(false); setStep(1); }}>
            <div className="popup-content">
              <div className="popup-header">What are you up to?</div>
              <div className="popup-buttons">
                <button onClick={() => handleSelection(2, 'What are you up to?', 'watch a movie')}>Looking to watch something</button>
                <button onClick={() => handleSelection(2, 'What are you up to?', 'go to bed')}>Preparing for bed</button>
                <button onClick={() => handleSelection(2, 'What are you up to?', 'get things done')}>Getting things done</button>
              </div>
            </div>
          </PopupModal>

          <PopupModal visible={step === 3} onClose={() => { setShowPopup(false); setStep(1); }}>
            <div className="popup-content">
              <div className="popup-header">What specific task are you doing?</div>
              <textarea
                className="popup-textarea"
                value={subIntentText}
                onChange={(e) => setSubIntentText(e.target.value)}
                placeholder="e.g., cooking dinner, going for a run..."
              />
              <div className="popup-buttons">
                 <button onClick={handleSubIntentSubmit}>Submit</button>
              </div>
            </div>
          </PopupModal>

          <PopupModal visible={step === 4} onClose={() => { setShowPopup(false); setStep(1); }}>
            <div className="popup-content">
              <div className="popup-header">Here are your recommendations...</div>
              <p>{loading ? 'Loading...' : 'Enjoy your curated suggestions!'}</p>
              <div className="popup-buttons">
                 <button onClick={() => setShowPopup(false)}>Close</button>
              </div>
            </div>
          </PopupModal>
        </>
      )}

      {showListening && (
        <ListeningPopup
          onClose={cancelListening}
          onTranscriptComplete={handleTranscriptComplete}
        />
      )}

      <HeroBanner />
      <NavBar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        searchResults={searchResults}
        onMovieSelect={(movie) => {
          console.log('Selected movie:', movie);
        }}
        onRestartPopup={handleRestartPopup}
      />

      <div className="recommendations-section">
        {recommendedMovies.length > 0 && <h2 className="recommendations-title">Recommended For You</h2>}
        {loading && !recommendedMovies.length && <p className="loading-message">Getting your personalized recommendations...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {recommendedMovies.length > 0 && <RecommendedMovies movies={recommendedMovies} />}
      </div>
    </div>
  );
};


function App() {
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [responses, setResponses] = useState({});
  const [subIntentText, setSubIntentText] = useState("");
  const [showListening, setShowListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allMovies, setAllMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const handleRestartPopup = () => {
    setResponses({});
    setStep(1);
    setShowPopup(true);
  };

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/movies');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAllMovies(data);
        console.log('Movies loaded for search:', data.length);
      } catch (err) {
        console.error("Failed to fetch all movies:", err);
        // Fallback: try to load from local data if API is not available
        try {
          const localMovies = [
            {"title":"Inside Out 2","description":"Riley navigates the challenges of adolescence as new emotions join the mix.","url":"https://www.themoviedb.org/t/p/w1280/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg","mood_tag":"Neutral","intent":"Entertainment"},
            {"title":"Furiosa: A Mad Max Saga","description":"A prequel that follows Furiosa before she teams up with Max.","url":"https://www.themoviedb.org/t/p/w1280/iADOJ8Zymht2JPMoy3R7xceZprc.jpg","mood_tag":"Sad","intent":"Entertainment"},
            {"title":"Deadpool & Wolverine","description":"Deadpool and Wolverine team up in the most chaotic MCU entry yet.","url":"https://www.themoviedb.org/t/p/w1280/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg","mood_tag":"Happy","intent":"Relaxation"}
          ];
          setAllMovies(localMovies);
          console.log('Using fallback movies for search:', localMovies.length);
        } catch (fallbackErr) {
          console.error("Fallback also failed:", fallbackErr);
        }
      }
    };
    fetchAllMovies();

    // Check if user has seen popup before - use a more persistent approach
    const hasSeenPopup = localStorage.getItem('hasSeenPopup');
    const isFirstVisit = !hasSeenPopup;
    
    if (isFirstVisit) {
      setShowPopup(true);
      setStep(1);
    }
  }, []); // Only run once on app initialization
  
  useEffect(() => {
    if (searchQuery) {
      const results = allMovies.filter(movie =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      console.log('Search performed:', { query: searchQuery, resultsCount: results.length, allMoviesCount: allMovies.length });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allMovies]);

  const handleGetRecommendations = async (userDataObject) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userDataObject),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendedMovies(data.recommendations || []);

      if (data.recommendations && data.recommendations.length > 0) {
        localStorage.setItem('hasSeenPopup', 'true');
      }
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setSubIntentText("");
    }
  };

  const handleSelection = (currentStep, question, answer) => {
    const newResponses = { ...responses, [currentStep]: { question, answer } };
    setResponses(newResponses);

    if (currentStep === 1) {
      setStep(2);
    } else if (currentStep === 2) {
      if (answer === 'get things done') {
        setStep(3); // Move to the sub-intent text input step
      } else {
        // This is a final step for other options
        setStep(4); // Move to the confirmation popup
        const finalObject = {
          mood_response: newResponses[1].answer,
          activity_response: newResponses[2].answer,
          user_id: "user_10000"
        };
        handleGetRecommendations(finalObject);
      }
    }
  };

  const handleSubIntentSubmit = () => {
    // This is the final step for the 'get things done' flow
    setStep(4); // Move to the confirmation popup
    const finalObject = {
      mood_response: responses[1].answer,
      activity_response: 'get things done',
      sub_intent_text: subIntentText,
      user_id: "user_10000"
    };
    handleGetRecommendations(finalObject);
  };

  const openListeningPopup = () => setShowListening(true);
  const cancelListening = () => setShowListening(false);
  
  const handleTranscriptComplete = (transcript) => {
    setShowListening(false);
    setShowPopup(true);
    setStep(4); // Show confirmation
    handleGetRecommendations({
        mood_response: transcript, // Send full transcript for backend processing
        user_id: "user_voice_10000"
    });
  };

  return (
    <Router>
      <div className="App">
        <main className="content-area">
          <Routes>
            <Route path="/" element={
              <HomePage 
                recommendedMovies={recommendedMovies} 
                setRecommendedMovies={setRecommendedMovies}
                showPopup={showPopup}
                setShowPopup={setShowPopup}
                step={step}
                setStep={setStep}
                responses={responses}
                setResponses={setResponses}
                subIntentText={subIntentText}
                setSubIntentText={setSubIntentText}
                loading={loading}
                setLoading={setLoading}
                error={error}
                setError={setError}
                handleGetRecommendations={handleGetRecommendations}
                handleSelection={handleSelection}
                handleSubIntentSubmit={handleSubIntentSubmit}
                openListeningPopup={openListeningPopup}
                cancelListening={cancelListening}
                showListening={showListening}
                setShowListening={setShowListening}
                handleTranscriptComplete={handleTranscriptComplete}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                setSearchResults={setSearchResults}
                allMovies={allMovies}
                setAllMovies={setAllMovies}
                handleRestartPopup={handleRestartPopup}
              />
            } />
            <Route path="/host-party" element={<HostParty />} />
            <Route path="/watch-party" element={<Watchparty />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/buddies" element={<Buddies />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
