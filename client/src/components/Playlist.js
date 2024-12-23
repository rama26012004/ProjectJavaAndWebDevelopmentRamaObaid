// Importing necessary modules and components from React and local files
import React, { useState } from 'react';
import PlaylistItem from './PlaylistItem';
import YouTubePlayer from './YouTubePlayer';
import Notification from './Notification';
import './Playlist.css';


/**
 * Playlist Component
 * @param {Array} playlistItems - The list of playlist items.
 * @param {Function} setNotification - Function to set notification messages.
 */
const Playlist = ({ playlistItems, setNotification }) => {
    const [currentPlaylist, setCurrentPlaylist] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showBlur, setShowBlur] = useState(false);
    const [playingPlatform, setPlayingPlatform] = useState(null);
    const [notificationMessage, setNotificationMessage] = useState(null);

    console.log('Playlist Items:', playlistItems); // Debug log

    /**
     * Handles closing the blur effect and resetting the playlist state.
     */
    const handleCloseBlur = () => {
        setShowBlur(false);
        setCurrentPlaylist(null);
        setPlayingPlatform(null);
        setNotificationMessage(null);
    };

    /**
     * Handles navigating to the next playlist item.
     */
    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % playlistItems.length);
        setCurrentPlaylist(playlistItems[(currentIndex + 1) % playlistItems.length]);
    };

     /**
     * Handles navigating to the previous playlist item.
     */
    const handleBack = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + playlistItems.length) % playlistItems.length);
        setCurrentPlaylist(playlistItems[(currentIndex - 1 + playlistItems.length) % playlistItems.length]);
    };

      /**
     * Extracts the video ID from a YouTube URL.
     * @param {string} url - The YouTube URL.
     * @returns {string|null} - The extracted video ID or null if not found.
     */
    const extractVideoId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9\-_]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };
     /**
     * Extracts the playlist ID from a YouTube URL.
     * @param {string} url - The YouTube URL.
     * @returns {string|null} - The extracted playlist ID or null if not found.
     */

    const extractPlaylistId = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:playlist\?list=|embed\/videoseries\?list=))([a-zA-Z0-9\-_]{34})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    return (
        <div className="playlist-container">
            {playlistItems.map((item, index) => (
                <PlaylistItem
                    key={index}
                    playlist={item}
                    index={index}
                    setCurrentPlaylist={setCurrentPlaylist}
                    setShowBlur={setShowBlur}
                    setPlayingPlatform={setPlayingPlatform}
                    playingPlatform={playingPlatform}
                    totalItems={playlistItems.length}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                    setNotification={setNotificationMessage}
                />
            ))}
            {showBlur && currentPlaylist && (
                <div className="player-container">
                    <button className="close-button" onClick={handleCloseBlur}>X</button>
                    <div id="player">
                        {currentPlaylist.platform === 'YouTube' && (
                            <YouTubePlayer
                                videoId={extractVideoId(currentPlaylist.url)}
                                playlistId={extractPlaylistId(currentPlaylist.url)}
                                onError={console.error}
                            />
                        )}
                        {currentPlaylist.platform === 'Spotify' && (
                            <div className="spotify-player-container">
                                <img src={currentPlaylist.image} alt={currentPlaylist.name} className="spotify-image" />
                                <p className="playlist-name">{currentPlaylist.name}</p>
                                <a href={currentPlaylist.url} target="_blank" rel="noopener noreferrer" className="spotify-link">
                                    Open in Spotify
                                </a>
                            </div>
                        )}
                    </div>
                    <div className="navigation-buttons">
                        <button className="item-nav-button" onClick={handleBack}>Back</button>
                        <button className="item-nav-button" onClick={handleNext}>Next</button>
                    </div>
                </div>
            )}
            {notificationMessage && <Notification message={notificationMessage} />}
        </div>
    );
};

export default Playlist;
