// Importing necessary modules and components from React and local files
import React, { useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa'; 
import './PlaylistGenerator.css';


/**
 * PlaylistGenerator Component
 * @param {Object} props - The properties passed to the component.
 * @param {Function} props.onGeneratePlaylist - Function to handle playlist generation.
 */
const PlaylistGenerator = ({ onGeneratePlaylist }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(null);


    
    /**
     * Handles the playlist generation based on user input.
     */
    const handleGenerate = () => {
        if (!input.trim()) {
            setError('Please enter a mood, genre, or artist.');
            return;
        }
        setError(null);
        onGeneratePlaylist(input.trim());
    };

    return (
        <div className="playlist-generator">
            <div className="input-container">
                <input
                    type="text"
                    placeholder="Enter mood, genre, or artist, e.g. mood=happy, genre=pop ..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <div className="info-icon">
                    <FaInfoCircle />
                    <span className="tooltip">
                        Please enter the wanted value as: mood=, genre=, artistName=, relatedArtists=.
                        If logged in your Spotify account, you can enter the previous values in addition to: library_mood=, library_genre=, playlist_mood=, playlist_genre= for a better experience.
                    </span>
                </div>
            </div>
            <button onClick={handleGenerate}>Generate Playlist</button>
            {error && <p className="error-message">{error}</p>}
            <p className="instruction">Or let the music weave its magic and surprise you</p>
        </div>
    );
};

export default PlaylistGenerator;







