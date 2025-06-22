import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone } from 'react-icons/fa';
import './ListeningPopup.css';

const SpeechPopup = ({ onClose, onTranscriptComplete }) => {
  const [status, setStatus] = useState('Listening...');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);
  const recordingTimeout = useRef(null);

  useEffect(() => {
    startRecording();

    return () => {
      clearTimeout(recordingTimeout.current);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await sendToAssemblyAI(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);

      recordingTimeout.current = setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
          setStatus('Processing...');
        }
      }, 7000);
    } catch (err) {
      console.error("Mic access error:", err);
      setStatus("Mic access denied or not available.");
    }
  };

  const sendToAssemblyAI = async (audioBlob) => {
    setStatus('Uploading audio...');

    try {
      const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': 'aefd5dd6846540588bb2d7b7cac114b3'
        },
        body: audioBlob,
      });

      const uploadData = await uploadRes.json();

      const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': 'aefd5dd6846540588bb2d7b7cac114b3',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ audio_url: uploadData.upload_url }),
      });

      const { id } = await transcriptRes.json();

      let completed = false;
      while (!completed) {
        const polling = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: { authorization: 'aefd5dd6846540588bb2d7b7cac114b3' },
        });

        const result = await polling.json();
        console.log("Polling result:", result);

        if (result.status === 'completed') {
          setStatus(`Transcript: ${result.text}`);
          completed = true;

          // 🔥 Auto-close and notify App after 1.5s
          if (onTranscriptComplete) {
            setTimeout(() => {
              onClose();
              onTranscriptComplete(result.text);
            }, 1500);
          }
        } else if (result.status === 'error') {
          setStatus('Transcription error. Please try again.');
          completed = true;
        } else {
          await new Promise(res => setTimeout(res, 2000));
        }
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setStatus("Something went wrong. Try again.");
    }
  };

  const stopRecording = () => {
    clearTimeout(recordingTimeout.current);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setStatus('Recording cancelled.');
    onClose();
  };

  return (
    <div className="speech-popup">
      <div className="speech-popup-content">
        <FaMicrophone className="mic-icon" />
        <p>{status}</p>
        <button onClick={stopRecording}>Cancel</button>
      </div>
    </div>
  );
};

export default SpeechPopup;
