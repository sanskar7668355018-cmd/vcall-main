import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2,
  MessageSquare,
  Users,
  X,
  Send,
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
      <div className="chat-sidebar-header">
        <h3>Participants ({participants.length})</h3>
        <button className="close-chat-btn" onClick={onClose}>
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

const VideoChat = ({ video, audio,roomId: propRoomId, user: propUser }) => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [token, setToken] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordedStreamRef = useRef(null);

  const navigate = useNavigate();
  //const API_URL = "https://vcall-2vlg.onrender.com";
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
   const { roomId: urlRoomId } = useParams();
    const { user: contextUser } = useAuth();
    const activeRoomId = propRoomId || urlRoomId;
    const activeUser = propUser || contextUser;
  useEffect(() => {
    console.log("VideoChat useEffect triggered");
    console.log("Active User Name:", activeUser?.name);
    console.log("Active Room ID:", activeRoomId);
    
   if (!activeUser?.name || !activeRoomId) {
      console.log("Missing data, waiting...");
      return;
    }

    const authToken = localStorage.getItem("authToken");

    (async () => {
      try {
        //added a comma after the url string
        const resp = await axios.get(
          `${API_URL}/api/livekit/token?roomName=${activeRoomId}&participantName=${activeUser.name}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        console.log("FULL RESPONSE:", resp.data);
        console.log("TOKEN:", resp.data.token);
        console.log("TYPE:", typeof resp.data.token);

        // ✅ FORCE STRING (CRITICAL FIX)
        const safeToken = String(resp.data.token);

        setToken(safeToken);

      } catch (e) {
        console.log("TOKEN FETCH ERROR:", e);
      }
    })();
  }, [activeUser?.name, activeRoomId, API_URL]);

  const onLeave = () => {
    navigate('/');
  };
  const [recStartTime, setRecStartTime] = useState(null);
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      recordedStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
      });

      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
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
      const blob = new Blob(recordedChunksRef.current, {
        type: 'video/webm',
      });

      // 🔥 create file
      const file = new File([blob], `meeting-${roomId}.webm`, {
        type: 'video/webm',
      });

      const formData = new FormData();
      formData.append("roomName", roomId);
      formData.append("duration", durationInSeconds);
      formData.append("video", file);
      try {
        await axios.post("http://localhost:5000/api/recording/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        alert(`Recording saved to DB! Duration: ${durationInSeconds}s✅`);
      } catch (err) {
        console.error(err);
      }

      recordedStreamRef.current?.getTracks().forEach(track =>
        track.stop()
      );
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
    <div className="video-meeting-container">
      <LiveKitRoom
        data-lk-theme="default"
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        video={video}
        audio={audio}
        className="video-chat-container"
        onDisconnected={onLeave}
      >
        <div className={`video-chat-layout ${showChat || showParticipants ? 'chat-active' : ''}`}>
          <div className="video-main-area">
            <MyVideoConference />
            <RoomAudioRenderer />
          </div>

          <div className={`chat-area ${showChat ? 'visible' : 'hidden'}`}>
            <div className="chat-sidebar-header">
              <h3>Chat</h3>
              <button
                className="close-chat-btn"
                onClick={() => setShowChat(false)}
              >
                <X size={18} />
              </button>
            </div>
            <ChatComponent />
          </div>

          {showParticipants && !showChat && (
            <ParticipantsPanel
              onClose={() => setShowParticipants(false)}
            />
          )}

          <div className="meeting-controls-area" style={{ position: "relative" }}>
            <ControlBar
              variation="minimal"
              controls={{
                microphone: true,
                camera: true,
                screenShare: true,
                leave: true
              }}
            />

            <button
              style={{
                position: "absolute",
                bottom: "80px",
                right: "20px",
                zIndex: 9999,
                background: "red",
                color: "white",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer"
              }}
              onClick={isRecording ? stopRecording : startRecording}
            >
              🎥 {isRecording ? "Stop" : "Record"}
            </button>

            <button
              className={`control-btn ${showChat ? 'active' : ''}`}
              onClick={() => {
                setShowChat(!showChat);
                if (!showChat) setShowParticipants(false);
              }}
            >
              <MessageSquare size={20} />
              <span className="control-btn-label">Chat</span>
            </button>

            <button
              className={`control-btn ${showParticipants ? 'active' : ''}`}
              onClick={() => {
                setShowParticipants(!showParticipants);
                if (!showParticipants) setShowChat(false);
              }}
            >
              <Users size={20} />
              <span className="control-btn-label">Participants</span>
            </button>

            <button
              className={`control-btn ${isRecording ? 'active' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              <span className="control-btn-label">
                {isRecording ? "Stop Recording" : "Record"}
              </span>
            </button>
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
};

function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

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
  const room = useRoomContext();
  const localParticipantIdentity = room.localParticipant.identity;
  console.log("Local user identity:", localParticipantIdentity);


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
            <div key={index} className="message">
              {msg.message}
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
        <button type="submit" className="chat-send-button">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default VideoChat;