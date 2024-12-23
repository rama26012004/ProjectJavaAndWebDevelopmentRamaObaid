// Importing necessary modules and components from React and local files
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import axios from 'axios'; // Import axios
import { FaSpotify } from 'react-icons/fa';
import { GiMuscleUp } from 'react-icons/gi';
import { WiDaySunny } from 'react-icons/wi';
import { SiFitbit } from 'react-icons/si';
import WorkoutIntegration from './WorkoutIntegration';
import WeatherSync from './WeatherSync';
import Playlist from './Playlist'; // Import Playlist component
import Header from './Header'; // Import Header component
import Notification from './Notification'; // Import Notification component
import './TailoredExperience.css';

/**
 * TailoredExperience Component
 * @param {Object} props - The properties passed to the component.
 * @param {Function} props.onConnectWorkout - Function to handle workout connection.
 * @param {Function} props.onSyncWeather - Function to handle weather sync.
 * @param {Function} props.onLogin - Function to handle Spotify login.
 * @param {Function} props.onFitbitLogin - Function to handle Fitbit login.
 * @param {boolean} props.isSpotifyLoggedIn - Indicates if Spotify is logged in.
 * @param {boolean} props.isFitbitLoggedIn - Indicates if Fitbit is logged in.
 * @returns {JSX.Element} - The rendered TailoredExperience component.
 */
const TailoredExperience = forwardRef(({ onConnectWorkout, onSyncWeather, onLogin, onFitbitLogin, isSpotifyLoggedIn, isFitbitLoggedIn }, ref) => {
    const loginButtonsRef = useRef(null);
    const fitbitButtonRef = useRef(null);
    const notificationRef = useRef(null);
    const weatherSyncRef = useRef(null);
    const [fitbitData, setFitbitData] = useState(null);
    const [fitbitPlaylists, setFitbitPlaylists] = useState([]);
    const [notificationMessage, setNotificationMessage] = useState(null);

    useImperativeHandle(ref, () => ({
        scrollIntoView: () => {
            if (loginButtonsRef.current) {
                loginButtonsRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }));

    
    /**
     * Normalizes the playlist data for consistent rendering.
     * @param {Object} playlist - The playlist data to normalize.
     * @returns {Array} - The normalized playlist data.
     */
    const normalizePlaylistData = (playlist) => {
        if (playlist.tracks) {
            return playlist.tracks.map(track => ({
                name: track.name,
                artists: track.artists,
                url: track.url,
                album: track.album,
                image: track.image,
                platform: 'Spotify'
            }));
        } else if (playlist.savedTracks) {
            return playlist.savedTracks.map(track => ({
                name: track.name,
                artists: track.artists,
                url: track.url,
                album: track.album,
                image: track.image,
                platform: 'Spotify'
            }));
        } else if (playlist.recommendations) {
            const normalizedPlaylists = [];
            if (playlist.recommendations.spotify) {
                normalizedPlaylists.push(
                    ...playlist.recommendations.spotify.moodPlaylists.map(playlist => ({
                        name: playlist.name,
                        url: playlist.url,
                        thumbnail: playlist.image,
                        title: playlist.name,
                        image: playlist.image,
                        platform: 'Spotify'
                    })),
                    ...playlist.recommendations.spotify.genrePlaylists.map(playlist => ({
                        name: playlist.name,
                        url: playlist.url,
                        thumbnail: playlist.image,
                        title: playlist.name,
                        image: playlist.image,
                        platform: 'Spotify'
                    }))
                );
            }
            if (playlist.recommendations.youtube) {
                normalizedPlaylists.push(
                    ...playlist.recommendations.youtube.map(playlist => ({
                        name: playlist.name,
                        url: playlist.url,
                        thumbnail: playlist.image,
                        title: playlist.name,
                        image: playlist.image,
                        platform: 'YouTube'
                    }))
                );
            }
            return normalizedPlaylists;
        } else {
            return {
                name: playlist.name || playlist.title,
                artists: playlist.artists,
                url: playlist.url,
                thumbnail: playlist.thumbnail || playlist.image || "/image1.jpeg",
                title: playlist.title || playlist.name,
                image: playlist.image || playlist.thumbnail || "/image2.jpeg",
                platform: playlist.thumbnail ? 'YouTube' : 'Spotify',
                album: playlist.album
            };
        }
    };

    /**
     * Handles generating fitness-based music using Fitbit data.
     */
    const handleGenerateFitbitMusic = async () => {
        try {
            const response = await axios.get(`http://localhost:3001/fitness-based-music?userId=670598476a98acaa6c5e0b42`);
            console.log('Fetched Fitness-Based Music:', response.data);
            setFitbitData(response.data); // Store the fetched data
            const normalizedPlaylists = normalizePlaylistData(response.data);
            setFitbitPlaylists(normalizedPlaylists);
        } catch (error) {
            console.error('Error generating fitness-based music:', error);
        }
    };

    return (
        <div className="tailored-experience">
            <Header
                isSpotifyLoggedIn={isSpotifyLoggedIn}
                isFitbitLoggedIn={isFitbitLoggedIn}
                handleSpotifyLogin={onLogin}
                handleFitbitLogin={onFitbitLogin}
                handleWeatherLogin={onSyncWeather}
                tailoredExperienceRef={loginButtonsRef}
                setNotification={setNotificationMessage}
                fitbitButtonRef={fitbitButtonRef}
                notificationRef={notificationRef}
                weatherSyncRef={weatherSyncRef}
            />
            {notificationMessage && <Notification message={notificationMessage} notificationRef={notificationRef} />}
            <h2>Tailor Your Experience</h2>

            <div className="spotify-login" ref={loginButtonsRef}>
                {!isSpotifyLoggedIn && !isFitbitLoggedIn && (
                    <>
                        <button className="login-button spotify" onClick={onLogin}>
                            <FaSpotify /> Login to Spotify
                        </button>
                        <button className="login-button fitbit" onClick={onFitbitLogin}>
                            <SiFitbit /> Login to Fitbit
                        </button>
                    </>
                )}
                {isSpotifyLoggedIn && !isFitbitLoggedIn && (
                    <button className="login-button fitbit" onClick={onFitbitLogin}>
                        <SiFitbit /> Login to Fitbit
                    </button>
                )}
                {!isSpotifyLoggedIn && isFitbitLoggedIn && (
                    <>
                        <button className="login-button spotify" onClick={onLogin}>
                            <FaSpotify /> Login to Spotify
                        </button>
                        <button className="login-button fitbit" onClick={handleGenerateFitbitMusic} ref={fitbitButtonRef}>
                            <SiFitbit /> Generate Music Based on Fitbit Data
                        </button>
                    </>
                )}
                {isSpotifyLoggedIn && isFitbitLoggedIn && (
                    <button className="login-button fitbit" onClick={handleGenerateFitbitMusic} ref={fitbitButtonRef}>
                        <SiFitbit /> Generate Music Based on Fitbit Data
                    </button>
                )}
                {fitbitPlaylists.length > 0 && (
                    <div>
                        <h3>Fitbit Recommendations</h3>
                        <Playlist playlistItems={fitbitPlaylists} setNotification={setNotificationMessage} />
                    </div>
                )}
            </div>

            <p className="poetic-text">
                Let your workout or the weather set the tone for your playlist
            </p>

            <div className="experience-options">
                <div className="option workout">
                    <h2><GiMuscleUp /> Workout Integration</h2>
                    <WorkoutIntegration onConnectWorkout={onConnectWorkout} />
                </div>
                <div className="option weather" ref={weatherSyncRef}>
                    <h2><WiDaySunny /> Weather Sync</h2>
                    <WeatherSync onSyncWeather={onSyncWeather} />
                </div>
            </div>
        </div>
    );
});

export default TailoredExperience;
