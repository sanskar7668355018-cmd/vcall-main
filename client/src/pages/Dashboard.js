/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import Credits from '../components/credits/Credits';
import {
  Video,
  X,
  Users,
  Plus,
  Copy,
  Check,
  CreditCard
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser, hasEnoughCredits, deductCredits, credits, fetchCredits } = useAuth();
  const navigate = useNavigate();
  
  // Cleaned up unused state variables
  const [roomId, setRoomId] = useState('');
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [meetingSettings, setMeetingSettings] = useState({
    title: '',
    description: '',
    maxParticipants: 10,
    isPrivate: false
  });
  const [showCredits, setShowCredits] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      fetchCredits();
    }
  }, [currentUser, navigate, fetchCredits]);

  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createMeeting = async () => {
    try {
      const result = await deductCredits();

      if (result.success) {
        // Correctly scoped variable
        const newRoomId = generateMeetingId(); 
        setIsCreatingMeeting(false);
        setError('');
        
        // Navigate to dedicated video page
        navigate(`/video-call/${newRoomId}`); 
      } else {
        setError(result.message || 'Failed to deduct credits.');
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      setError('An error occurred while creating the meeting.');
    }
  };

  const startCall = () => {
    if (roomId.trim()) {
      // FIX: Changed newRoomId to roomId to use the input value
      navigate(`/video-call/${roomId.trim()}`);
    } else {
      setError("Please enter a Room ID to join.");
    }
  };

  const handleMeetingSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMeetingSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser?.name}</h1>
        <div className="dashboard-actions">
          <div className="credits-display" onClick={() => setShowCredits(true)}>
            <CreditCard size={16} className="icon-left" />
            <span>{credits} Credits</span>
          </div>
        </div>
      </div>

      {showCredits ? (
        <div className="credits-section">
          <div className="section-header">
            <h2>Manage Credits</h2>
            <button
              className="close-btn"
              onClick={() => setShowCredits(false)}
            >
              <X size={20} />
            </button>
          </div>
          <Credits />
        </div>
      ) : (
        <div className="dashboard-content">
          {/* REMOVED !isInCall ternary to fix "isInCall is not defined" error */}
          <div className="call-setup">
            <h2>Start a Video Call</h2>
            {error && <div className="error-message">{error}</div>}
            
            {!isCreatingMeeting ? (
              <div className="room-input">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="room-id-input"
                />
                <button onClick={startCall} className="btn btn-primary join-call-btn">
                  <Video size={16} className="icon-left" />
                  Join Call
                </button>
                <button
                  onClick={() => setIsCreatingMeeting(true)}
                  className="btn btn-secondary create-meeting-btn"
                  disabled={!hasEnoughCredits()}
                  title={!hasEnoughCredits() ? "You need credits to create a meeting" : ""}
                >
                  <Plus size={16} className="icon-left" />
                  Create New Meeting {hasEnoughCredits() ? "" : "(Need Credits)"}
                </button>

                <button
                  onClick={() => setShowCredits(true)}
                  className="btn btn-outline buy-credits-btn"
                >
                  <CreditCard size={16} className="icon-left" />
                  Buy Credits
                </button>
              </div>
            ) : (
              <div className="create-meeting-container">
                <h3 className="create-meeting-title">Create New Meeting</h3>
                <div className="meeting-settings">
                  <div className="form-group">
                    <label htmlFor="title">Meeting Title</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      placeholder="Enter meeting title"
                      value={meetingSettings.title}
                      onChange={handleMeetingSettingsChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Meeting Description</label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Enter meeting description"
                      value={meetingSettings.description}
                      onChange={handleMeetingSettingsChange}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="maxParticipants">Maximum Participants</label>
                    <input
                      type="number"
                      id="maxParticipants"
                      name="maxParticipants"
                      placeholder="Maximum participants"
                      value={meetingSettings.maxParticipants}
                      onChange={handleMeetingSettingsChange}
                      min="2"
                      max="50"
                      className="form-control"
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label htmlFor="isPrivate" className="checkbox-label">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        name="isPrivate"
                        checked={meetingSettings.isPrivate}
                        onChange={handleMeetingSettingsChange}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Private Meeting</span>
                    </label>
                  </div>

                  <div className="credit-info">
                    <p>This will use 1 credit. Remaining: {credits}</p>
                  </div>
                </div>
                <div className="meeting-action-buttons">
                  <button
                    onClick={createMeeting}
                    className="btn btn-primary create-btn"
                    disabled={!hasEnoughCredits()}
                  >
                    <Video size={16} className="icon-left" />
                    Create Meeting
                  </button>
                  <button onClick={() => setIsCreatingMeeting(false)} className="btn btn-secondary cancel-btn">
                    <X size={16} className="icon-left" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;