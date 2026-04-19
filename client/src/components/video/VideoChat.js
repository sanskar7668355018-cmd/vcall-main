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

const ParticipantsPanel = ({ onClose }) => {
  const participants = useParticipants();
  const room = useRoomContext();
  const localParticipant = room.localParticipant;

  return (
    <div className="participants-area">
      <div className="chat-sidebar-header" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <h3 style={{ margin: 0, color: 'white' }}>Participants ({participants.length})</h3>
        <button className="close-chat-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      <div className="participants-list">
        <div className="participant-item">
          <div className="participant-avatar">
            {localParticipant.identity.charAt(0).toUpperCase()}
          </div>
          <div className="participant-info">
            <span className="participant-name">
              {localParticipant.identity} (You)
            </span>
            <span className="participant-status">
              {localParticipant.isSpeaking ? 'Speaking' : 'Online'}
            </span>
          </div>
        </div>

        {participants.filter(p => !p.isLocal).map(participant => (
          <div className="participant-item" key={participant.sid}>
            <div className="participant-avatar">
              {participant.identity.charAt(0).toUpperCase()}
            </div>
            <div className="participant-info">
              <span className="participant-name">
                {participant.identity}
              </span>
              <span className="participant-status">
                {participant.isSpeaking ? 'Speaking' : 'Online'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const livekitUrl = process.env.REACT_APP_LIVEKIT_URL;

const VideoChat = ({ video, audio, roomId: propRoomId, user: propUser }) => {
  const { user: contextUser } = useAuth();
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

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const activeRoomId = propRoomId || urlRoomId;
  const activeUser = propUser || contextUser;

  useEffect(() => {
    if (!activeUser?.name || !activeRoomId) return;

    const authToken = localStorage.getItem("authToken");

    (async () => {
      try {
        const resp = await axios.get(
          `${API_URL}/api/livekit/token?roomName=${activeRoomId}&participantName=${activeUser.name}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setToken(String(resp.data.token));
      } catch (e) {
        console.log("TOKEN FETCH ERROR:", e);
      }
    })();
  }, [activeUser?.name, activeRoomId, API_URL]);

  const onLeave = () => {
    navigate('/');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      recordedStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.start(1000);
      setRecStartTime(Date.now());
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.log("Recording failed", error);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    const durationInSeconds = Math.round((Date.now() - recStartTime) / 1000);
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `meeting-${activeRoomId}.webm`, { type: 'video/webm' });
      const formData = new FormData();
      formData.append("roomName", activeRoomId);
      formData.append("duration", durationInSeconds);
      formData.append("video", file);
      try {
        await axios.post(`${API_URL}/api/recording/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert(`Recording saved! ✅`);
      } catch (err) {
        console.error(err);
      }
      recordedStreamRef.current?.getTracks().forEach(track => track.stop());
    };
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  if (token === "") {
    return (
      <div className="loading-container">
        <Loader2 className="loader-icon animate-spin" size={36} />
        <p className="loading-text">Connecting to room...</p>
      </div>
    );
  }

  return (
    <div className="video-meeting-container" style={{ height: '100vh', width: '100vw', backgroundColor: '#111', overflow: 'hidden' }}>
      <LiveKitRoom
        data-lk-theme="default"
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        video={video}
        audio={audio}
        className="video-chat-container"
        onDisconnected={onLeave}
        style={{ height: '100%' }}
      >
        <div className={`video-chat-layout ${showChat || showParticipants ? 'chat-active' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="video-main-area" style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'row' }}>
            
            <div style={{ flex: 1, position: 'relative' }}>
              <MyVideoConference />
              <RoomAudioRenderer />
            </div>

            {/* Chat Sidebar */}
            <div className={`chat-area ${showChat ? 'visible' : 'hidden'}`} 
                 style={{ 
                   width: showChat ? '350px' : '0px', 
                   transition: 'width 0.3s ease', 
                   display: showChat ? 'flex' : 'none', 
                   flexDirection: 'column', 
                   backgroundColor: '#1e1e1e', 
                   borderLeft: '1px solid #333', 
                   height: '100%', 
                   zIndex: 5 
                 }}>
              <div className="chat-sidebar-header" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
                <h3 style={{ margin: 0, color: 'white' }}>Chat</h3>
                <button className="close-chat-btn" onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <ChatComponent />
              </div>
            </div>

            {/* Participants Sidebar */}
            {showParticipants && !showChat && (
              <div className="participants-sidebar" style={{ width: '350px', backgroundColor: '#1e1e1e', borderLeft: '1px solid #333', height: '100%' }}>
                <ParticipantsPanel onClose={() => setShowParticipants(false)}/>
              </div>
            )}
          </div>

          {/* Control Bar */}
          <div className="meeting-controls-area" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '10px 20px', backgroundColor: 'rgba(0,0,0,0.9)', height: '80px', zIndex: 10, flexShrink: 0 }}>
            <ControlBar variation="minimal" controls={{ microphone: true, camera: true, screenShare: true, leave: true }} />

            <button className={`control-btn ${showChat ? 'active' : ''}`} onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}>
              <MessageSquare size={20} />
              <span className="control-btn-label">Chat</span>
            </button>

            <button className={`control-btn ${showParticipants ? 'active' : ''}`} onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}>
              <Users size={20} />
              <span className="control-btn-label">Participants</span>
            </button>

            <button className={`control-btn ${isRecording ? 'active' : ''}`} style={{ color: isRecording ? 'red' : 'white' }} onClick={isRecording ? stopRecording : startRecording}>
              <Video size={20} />
              <span className="control-btn-label">{isRecording ? "Stop Recording" : "Record"}</span>
            </button>
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
};

function MyVideoConference() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ], { onlySubscribed: false });

  return (
    <GridLayout tracks={tracks} className="video-grid-layout">
      <ParticipantTile />
    </GridLayout>
  );
}

const ChatComponent = () => {
  const { chatMessages, send, isSending } = useChat();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && !isSending) {
      send(messageText);
      setMessageText('');
    }
  };

  return (
    <div className="enhanced-chat-container">
      <div className="chat-messages-wrapper">
        <div className="chat-messages">
          {chatMessages.map((msg, index) => (
            <div key={index} className="message" style={{ color: 'white', marginBottom: '8px', padding: '8px', background: '#333', borderRadius: '4px' }}>
              <strong>{msg.from?.identity}: </strong> {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-container">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="chat-input-field"
          disabled={isSending}
        />
        <button type="submit" className="chat-send-button"><Send size={16} /></button>
      </form>
    </div>
  );
};

export default VideoChat;
