// Importing necessary modules and components from React and local files
import React, { useEffect, useRef, useState } from 'react';
import './Playlist.css'; 



/**
 * YouTubePlayer Component
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.videoId - The ID of the YouTube video to play.
 * @param {string} props.playlistId - The ID of the YouTube playlist.
 * @param {Function} props.onError - Function to handle errors.
 * @returns {JSX.Element} - The rendered YouTubePlayer component.
 */
const YouTubePlayer = ({ videoId, playlistId, onError }) => {
    const playerRef = useRef(null);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [playlistTitle, setPlaylistTitle] = useState('');

    useEffect(() => {
         /**
         * Loads the YouTube API and initializes the player.
         */
        const loadYouTubeAPI = () => {
            if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                script.async = true;
                script.onload = () => {
                    if (typeof YT !== 'undefined') {
                        playerRef.current = new YT.Player('youtube-player', {
                            height: '100%',
                            width: '100%',
                            videoId: videoId,
                            playerVars: {
                                listType: 'playlist',
                                list: playlistId,
                            },
                            events: {
                                'onReady': (event) => {
                                    event.target.playVideo();
                                    fetchPlaylistDetails(playlistId, event.target);
                                },
                                'onError': (event) => onError(event.data),
                                'onStateChange': (event) => {
                                    if (event.data === YT.PlayerState.PLAYING) {
                                        setCurrentVideoIndex(event.target.getPlaylistIndex());
                                    }
                                },
                            },
                        });
                    }
                };
                document.body.appendChild(script);
            } else {
                playerRef.current = new YT.Player('youtube-player', {
                    height: '100%',
                    width: '100%',
                    videoId: videoId,
                    playerVars: {
                        listType: 'playlist',
                        list: playlistId,
                    },
                    events: {
                        'onReady': (event) => {
                            event.target.playVideo();
                            fetchPlaylistDetails(playlistId, event.target);
                        },
                        'onError': (event) => onError(event.data),
                        'onStateChange': (event) => {
                            if (event.data === YT.PlayerState.PLAYING) {
                                setCurrentVideoIndex(event.target.getPlaylistIndex());
                            }
                        },
                    },
                });
            }
        };

        loadYouTubeAPI();

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, [videoId, playlistId, onError]);
      /**
     * Fetches the playlist details from the YouTube API.
     * @param {string} playlistId - The ID of the YouTube playlist.
     */

    const fetchPlaylistDetails = (playlistId) => {
        fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=YOUR_YOUTUBE_API_KEY`)
            .then(response => response.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    setPlaylistTitle(data.items[0].snippet.title);
                }
            })
            .catch(error => console.error('Error fetching playlist details:', error));
    };
    /**
     * Handles navigating to the next video in the playlist.
     */
    const handleNext = () => {
        if (playerRef.current) {
            playerRef.current.nextVideo();
        }
    };

     /**
     * Handles navigating to the previous video in the playlist.
     */

    const handlePrev = () => {
        if (playerRef.current) {
            playerRef.current.previousVideo();
        }
    };

    return (
        <div className="player-container">
             {/* Container for the YouTube player */}
            <div id="youtube-player"></div>
            <div className="playlist-info">
                {/* Displaying the playlist title */}
                <h3>{playlistTitle}</h3>
                {/* Displaying the current video index in the playlist */}
                <p>Current Video in PL: {currentVideoIndex + 1}</p>
            </div>
            <div className="navigation-buttons">
                {/* Buttons to navigate through the playlist */}
                <button className="playlist-nav-button" onClick={handlePrev}>Previous in PL</button>
                <button className="playlist-nav-button" onClick={handleNext}>Next in PL</button>
            </div>
        </div>
    );
};

export default YouTubePlayer;
