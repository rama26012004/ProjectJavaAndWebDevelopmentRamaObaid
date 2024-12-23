// Importing necessary modules and components from React and local files
import React from 'react';
import './PlaylistItem.css';


/**
 * PlaylistItem Component
 * @param {Object} props - The properties passed to the component.
 * @param {Object} props.playlist - The playlist item data.
 * @param {number} props.index - The index of the playlist item.
 * @param {Function} props.setCurrentPlaylist - Function to set the current playlist.
 * @param {Function} props.setShowBlur - Function to toggle the blur effect.
 * @param {Function} props.setPlayingPlatform - Function to set the playing platform.
 * @param {number} props.currentIndex - The current index of the playlist.
 */
const PlaylistItem = ({ playlist, index, setCurrentPlaylist, setShowBlur, setPlayingPlatform,  setCurrentIndex,  }) => {
    console.log('Playlist Item:', playlist); 

     /**
     * Handles the click event to play the playlist item.
     */
    const handlePlayClick = () => {
        setPlayingPlatform(playlist.platform); 
        setCurrentPlaylist(playlist);
        setCurrentIndex(index);
        setShowBlur(true);
    };

    return (
        <div className="playlist-item" onClick={handlePlayClick}>
            {playlist.image ? (
                <img src={playlist.image} alt={playlist.name || playlist.title} className="playlist-image" />
            ) : (
                <div className="playlist-image-placeholder">No Image</div>
            )}
            <p className="playlist-name">{playlist.name || 'No Name'}</p>
            {playlist.topTracks && playlist.topTracks.length > 0 && (
                <div className="playlist-tracks">
                    {playlist.topTracks.map((track, index) => (
                        <div key={index} className="track-item">
                            <p className="track-name">{track.name}</p>
                            <p className="track-album">{track.album}</p>
                            <a href={track.url} target="_blank" rel="noopener noreferrer" className="track-link">
                                Listen on Spotify
                            </a>
                            <img src={track.image} alt={track.name} className="track-image" />
                        </div>
                    ))}
                </div>
            )}
            {playlist.url && playlist.platform === 'Spotify' && (
                <a href={playlist.url} target="_blank" rel="noopener noreferrer" className="playlist-link">
                    Open in Spotify
                </a>
            )}
        </div>
    );
};

export default PlaylistItem;
