/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2,
  MessageSquare,
  Users,
  X,
  Send,
  Video,
} from 'lucide-react';

import {
  LiveKitRoom,
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  useChat,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";

import "@livekit/components-styles";
import { Track } from "livekit-client";
import axios from 'axios';

// ... ParticipantsPanel component remains the same ...

const VideoChat = ({ video, audio, roomId: propRoomId, user: propUser }) => {
  const { currentUser } = useAuth(); // Changed 'user' to 'currentUser' to match your AuthContext
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recStartTime, setRecStartTime] = useState(null);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordedStreamRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;
  const livekitUrl = process.env.REACT_APP_LIVEKIT_URL;
  
  const activeRoomId = propRoomId || urlRoomId;
  const activeUser = propUser || currentUser;

  useEffect(() => {
    // 🛑 CRITICAL FIX: Only run if we have both the user name and room ID
    if (!activeUser?.name || !activeRoomId) {
        console.log("Waiting for user data or roomId...");
        return;
    }

    const fetchToken = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        
        // Ensure the URL is constructed correctly
        const url = `${API_URL}/api/livekit/token`;
        
        const resp = await axios.get(url, {
          params: {
            roomName: activeRoomId,
            participantName: activeUser.name
          },
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (resp.data.token) {
          setToken(String(resp.data.token));
        }
      } catch (e) {
        console.error("TOKEN FETCH ERROR:", e.response?.data || e.message);
      }
    };

    fetchToken();
  }, [activeUser?.name, activeRoomId, API_URL]);

  // --- RECORDING FUNCTIONALITY ---

  const startRecording = async () => {
    try {
      // Capture the screen/window for recording
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        saveRecording();
        // Stop all tracks to turn off the "screen sharing" indicator
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Failed to start recording. Please ensure you grant screen capture permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async () => {
    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    const formData = new FormData();
    formData.append('video', blob, `recording-${activeRoomId}-${Date.now()}.webm`);
    formData.append('roomId', activeRoomId);
    formData.append('title', `Meeting at ${new Date().toLocaleString()}`);

    try {
      const authToken = localStorage.getItem("authToken");
      await axios.post(`${API_URL}/api/recordings/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}` 
        }
      });
      alert("Recording saved successfully!");
    } catch (err) {
      console.error("Error uploading recording:", err);
      alert("Recording captured but failed to save to server.");
    }
  };

  // --- END RECORDING FUNCTIONALITY ---

  const onLeave = () => {
    navigate('/dashboard'); // Better to navigate to dashboard than home
  };

  // ... start/stop recording functions remain same ...

  // This component is responsible for rendering the actual video grid
function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false } // Ensuring local tracks show up immediately
  );

  return (
    <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

  // Loading Screen
  if (!token) {
    return (
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111', color: 'white' }}>
        <Loader2 className="loader-icon animate-spin" size={48} style={{ marginBottom: '20px', color: '#3b82f6' }} />
        <p className="loading-text">Establishing secure connection to {activeRoomId}...</p>
        {!activeUser && <p style={{ fontSize: '12px', color: '#666' }}>Verifying user identity...</p>}
      </div>
    );
  }
  return (
    <div className="video-meeting-container" style={{ height: '100vh', width: '100vw', backgroundColor: '#111', overflow: 'hidden', position:'relative'}}>
      <LiveKitRoom
        data-lk-theme="default"
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        video={video ?? true}
        audio={audio ?? true}
        className="video-chat-container"
        onDisconnected={onLeave}
        style={{ height: '100%' }}
      >
        {/* ✅ This is what was missing: The actual components that render video */}
        <div className="video-chat-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%',position:'relative' }}>
           {/* ✅ FIXED RECORDING BUTTON: Positioned Absolute with High Z-Index */}
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            zIndex: 999, // Ensures it stays on top of the video
            display: 'flex',
            gap: '10px'
          }}>
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {isRecording && (
                <span style={{ 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: 'white', 
                  borderRadius: '50%', 
                  display: 'inline-block',
                  animation: 'pulse 1s infinite'
                }} />
              )}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
          </div>

          <div className="video-main-area" style={{ flex: 1, position: 'relative', display: 'flex' }}>
            
            {/* The component we defined earlier that uses useTracks */}
            <MyVideoConference /> 
            
            <RoomAudioRenderer />
          </div>
          
          {/* Controls like Mute/Unmute/Leave */}
          <div className="controls-area" style={{ padding: '20px', display: 'flex', justifyContent: 'center' ,backgroundColor:'#1a1a1a'}}>
            <ControlBar />
          </div>
        </div>
      </LiveKitRoom>
       {/* Adding Pulse Animation for Recording Dot */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
 
export default VideoChat;