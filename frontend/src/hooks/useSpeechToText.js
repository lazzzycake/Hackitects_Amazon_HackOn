import { useState, useRef } from 'react';

const useSpeechToText = () => {
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const initializeRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const result = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setTranscript(result);
    };

    recognition.onerror = (event) => {
      console.error('Speech Recognition Error:', event.error);
    };

    return recognition;
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initializeRecognition();
    }
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  return {
    transcript,
    startListening,
    stopListening,
    resetTranscript, // ✅ make sure this is returned
  };
};

export default useSpeechToText;