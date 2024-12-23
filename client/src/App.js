/**
 * Import necessary modules and components.
 */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Footer from './components/Footer';
import QuoteSection from './components/QuoteSection';
import PlaylistGenerator from './components/PlaylistGenerator';
import SurpriseMe from './components/SurpriseMe';
import TailoredExperience from './components/TailoredExperience';
import LoadingAnimation from './components/LoadingAnimation';
import Playlist from './components/Playlist';
import Notification from './components/Notification';
import spotifyService from './services/spotifyService';
import fitbitService from './services/fitbitService';
import weatherService from './services/weatherService';
import './App.css';

/**
 * Main App component.
 * Manages the state and logic for the application, including user authentication, playlist generation, and API interactions.
 */
const App = () => {
    const [loading, setLoading] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [isSpotifyLoggedIn, setIsSpotifyLoggedIn] = useState(false);
    const [isFitbitLoggedIn, setIsFitbitLoggedIn] = useState(localStorage.getItem('isFitbitLoggedIn') === 'true');
    const [isGoogleFitLoggedIn, setIsGoogleFitLoggedIn] = useState(localStorage.getItem('isGoogleFitLoggedIn') === 'true');
    const resultsRef = useRef(null);
    const tailoredExperienceRef = useRef(null);
    const loadingRef = useRef(null); 
    const notificationRef = useRef(null);
    const [notification, setNotification] = useState(null);
    const [accessToken, setAccessToken] = useState(''); 
    const [userId, setUserId] = useState(''); 

    /**
     * Effect to check Spotify login status on component mount.
     */
    useEffect(() => {
        const checkSpotifyLoginStatus = async () => {
            const userId = localStorage.getItem('spotifyUserId'); 
            if (userId) {
                try {
                    const response = await axios.get(`http://localhost:3001/check-spotify-token?userId=${userId}`);
                    if (response.status === 200) {
                        setIsSpotifyLoggedIn(true);
                        localStorage.setItem('isSpotifyLoggedIn', 'true');
                        setAccessToken(response.data.accessToken);
                        setUserId(response.data.userId); 
                        console.log('User logged in with userId:', response.data.userId, 'and accessToken:', response.data.accessToken); // Debug log
                    } else {
                        setIsSpotifyLoggedIn(false);
                        localStorage.removeItem('isSpotifyLoggedIn');
                    }
                } catch (error) {
                    setIsSpotifyLoggedIn(false);
                    localStorage.removeItem('isSpotifyLoggedIn');
                }
            }
        };

        checkSpotifyLoginStatus();
    }, []);

    /**
     * Effect to handle URL parameters for Spotify and Fitbit login status.
     */
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const spotify = urlParams.get('spotify');
        const fitbit = urlParams.get('fitbit');
        const userId = urlParams.get('userId');
    
        if (spotify === 'true') {
            setIsSpotifyLoggedIn(true);
            localStorage.setItem('isSpotifyLoggedIn', 'true');
            if (userId) {
                localStorage.setItem('spotifyUserId', userId);
                setUserId(userId);
            }
        } else if (spotify === 'false' || !spotify) {
            setIsSpotifyLoggedIn(false);
            localStorage.removeItem('isSpotifyLoggedIn');
            localStorage.removeItem('spotifyUserId');
        }
    
        if (fitbit === 'true') {
            setIsFitbitLoggedIn(true);
            localStorage.setItem('isFitbitLoggedIn', 'true');
            if (userId) {
                localStorage.setItem('fitbitUserId', userId);
                setUserId(userId);
            }
        } else if (fitbit === 'false' || !fitbit) {
            setIsFitbitLoggedIn(false);
            localStorage.removeItem('isFitbitLoggedIn');
            localStorage.removeItem('fitbitUserId');
        }
    }, []);
    
    
  /**
     * Effect to scroll to the results section when playlists are updated.
     */
    useEffect(() => {
        if (playlists.length > 0 && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [playlists]);

    /**
     * Effect to scroll to the tailored experience section if any login status is false.
     */
    useEffect(() => {
        if (!isSpotifyLoggedIn || !isFitbitLoggedIn || !isGoogleFitLoggedIn) {
            tailoredExperienceRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isSpotifyLoggedIn, isFitbitLoggedIn, isGoogleFitLoggedIn]);

     /**
     * Effect to scroll to the loading animation when loading state changes.
     */
    useEffect(() => {
        if (loading && loadingRef.current) {
            loadingRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [loading]);


       /**
     * Function to normalize playlist data.
     * @param {Object} playlist - The playlist data to be normalized.
     * @returns {Array} - The normalized playlist data.
     */
    const normalizePlaylistData = (playlist) => {
        if (Array.isArray(playlist)) {
            return playlist.flatMap(item => normalizePlaylistData(item));
        } else if (Array.isArray(playlist.tracks)) {
            return playlist.tracks.map(track => ({
                artistName: Array.isArray(track.artists) ? track.artists.join(', ') : track.artists,
                name: track.name,
                artists: Array.isArray(track.artists) ? track.artists.map(artist => ({ name: artist.name })) : [{ name: track.artists }],
                url: track.url,
                album: track.album,
                image: track.image,
                platform: 'Spotify',
                relatedArtists: track.relatedArtists ? track.relatedArtists.map(artist => ({
                    name: artist.name,
                    topTracks: artist.topTracks ? artist.topTracks.map(track => ({
                        name: track.name,
                        url: track.url,
                        album: track.album,
                        image: track.image
                    })) : []
                })) : []
            }));
        } else if (Array.isArray(playlist.savedTracks)) {
            return playlist.savedTracks.map(track => ({
                artistName: Array.isArray(track.artists) ? track.artists.join(', ') : track.artists,
                name: track.name,
                artists: Array.isArray(track.artists) ? track.artists.map(artist => ({ name: artist.name })) : [{ name: track.artists }],
                url: track.url,
                album: track.album,
                image: track.image,
                platform: 'Spotify',
                relatedArtists: track.relatedArtists ? track.relatedArtists.map(artist => ({
                    name: artist.name,
                    topTracks: artist.topTracks ? artist.topTracks.map(track => ({
                        name: track.name,
                        url: track.url,
                        album: track.album,
                        image: track.image
                    })) : []
                })) : []
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
                        platform: 'Spotify',
                        relatedArtists: playlist.relatedArtists ? playlist.relatedArtists.map(artist => ({
                            name: artist.name,
                            topTracks: artist.topTracks ? artist.topTracks.map(track => ({
                                name: track.name,
                                url: track.url,
                                album: track.album,
                                image: track.image
                            })) : []
                        })) : []
                    })),
                    ...playlist.recommendations.spotify.genrePlaylists.map(playlist => ({
                        name: playlist.name,
                        url: playlist.url,
                        thumbnail: playlist.image,
                        title: playlist.name,
                        image: playlist.image,
                        platform: 'Spotify',
                        relatedArtists: playlist.relatedArtists ? playlist.relatedArtists.map(artist => ({
                            name: artist.name,
                            topTracks: artist.topTracks ? artist.topTracks.map(track => ({
                                name: track.name,
                                url: track.url,
                                album: track.album,
                                image: track.image
                            })) : []
                        })) : []
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
                        platform: 'YouTube',
                        relatedArtists: playlist.relatedArtists ? playlist.relatedArtists.map(artist => ({
                            name: artist.name,
                            topTracks: artist.topTracks ? artist.topTracks.map(track => ({
                                name: track.name,
                                url: track.url,
                                album: track.album,
                                image: track.image
                            })) : []
                        })) : []
                    }))
                );
            }
            return normalizedPlaylists;
        } else if (Array.isArray(playlist.songs)) {
            return playlist.songs.map(song => ({
                artistName: Array.isArray(song.artists) ? song.artists.join(', ') : song.artists,
                name: song.name,
                artists: Array.isArray(song.artists) ? song.artists.map(artist => ({ name: artist })) : [{ name: song.artists }],
                url: song.url,
                album: song.album,
                image: song.image,
                platform: 'Spotify'
            }));
        } else if (Array.isArray(playlist.artists)) {
            const normalizedTracks = [];
            playlist.artists.forEach(artist => {
                if (Array.isArray(artist.topTracks)) {
                    artist.topTracks.forEach(track => {
                        normalizedTracks.push({
                            artistName: artist.name,
                            name: track.name,
                            album: track.album,
                            url: track.url,
                            image: track.image,
                            platform: 'Spotify'
                        });
                    });
                }
            });
            return normalizedTracks;
        } else {
            return {
                artistName: Array.isArray(playlist.artists) ? playlist.artists.join(', ') : playlist.artists,
                name: playlist.name || playlist.title,
                artists: Array.isArray(playlist.artists) ? playlist.artists.map(artist => ({ name: artist })) : [{ name: playlist.artists }],
                url: playlist.url,
                thumbnail: playlist.thumbnail || playlist.image || "/image1.jpeg",
                title: playlist.title || playlist.name,
                image: playlist.image || playlist.thumbnail || "/image2.jpeg",
                platform: playlist.thumbnail ? 'YouTube' : 'Spotify',
                album: playlist.album,
                relatedArtists: playlist.relatedArtists ? playlist.relatedArtists.map(artist => ({
                    name: artist.name,
                    topTracks: artist.topTracks ? artist.topTracks.map(track => ({
                        name: track.name,
                        url: track.url,
                        album: track.album,
                        image: track.image
                    })) : []
                })) : []
            };
        }
    };


      /**
     * Function to handle playlist generation based on input parameters.
     * @param {string} input - The input parameters for generating the playlist.
     */
    const handleGeneratePlaylist = async (input) => {
        setLoading(true);
        setPlaylists([]); // Reset playlists
        try {
            const promises = [];

            const params = input.split(',');
            console.log('Input parameters:', params); // Debug log

            params.forEach(param => {
                const [key, value] = param.split('=');
                const trimmedKey = key.trim();
                const trimmedValue = value.trim();
                console.log(`Parsed parameter: ${trimmedKey} = ${trimmedValue}`); // Debug log

                if (trimmedKey === 'mood') {
                    console.log('Fetching mood playlists for:', trimmedValue); // Debug log
                    if (isSpotifyLoggedIn) {
                        promises.push(axios.get(`http://localhost:3001/search-playlists?userId=${userId}&query=${encodeURIComponent(trimmedValue)}`));
                        promises.push(axios.get(`http://localhost:3001/youtube/music-playlists-by-mood?mood=${encodeURIComponent(trimmedValue)}`));
                    } else {
                        promises.push(axios.get(`http://localhost:3001/spotify/public-playlists-by-mood?mood=${encodeURIComponent(trimmedValue)}`));
                        promises.push(axios.get(`http://localhost:3001/youtube/music-playlists-by-mood?mood=${encodeURIComponent(trimmedValue)}`));
                    }
                } else if (trimmedKey === 'genre') {
                    console.log('Fetching genre playlists for:', trimmedValue); // Debug log
                    if (isSpotifyLoggedIn) {
                        promises.push(axios.get(`http://localhost:3001/search-playlists-by-genre?userId=${userId}&genre=${encodeURIComponent(trimmedValue)}`));
                        promises.push(axios.get(`http://localhost:3001/youtube/videos-by-genre?genre=${encodeURIComponent(trimmedValue)}`));
                    } else {
                        promises.push(axios.get(`http://localhost:3001/spotify/public-playlists-by-genre?genre=${encodeURIComponent(trimmedValue)}`));
                        promises.push(axios.get(`http://localhost:3001/youtube/videos-by-genre?genre=${encodeURIComponent(trimmedValue)}`));
                    }
                } else if (trimmedKey === 'artistName') {
                    console.log('Fetching artist songs for:', trimmedValue); // Debug log
                    if (isSpotifyLoggedIn) {
                        promises.push(axios.get(`http://localhost:3001/search-artist-songs?artistName=${encodeURIComponent(trimmedValue)}&userId=${userId}`));
                        promises.push(axios.get(`http://localhost:3001/youtube/related-songs-by-artist?artistName=${encodeURIComponent(trimmedValue)}`));
                    } else {
                        promises.push(axios.get(`http://localhost:3001/spotify/public-artist-songs?artistName=${encodeURIComponent(trimmedValue)}`));
                        promises.push(axios.get(`http://localhost:3001/youtube/related-songs-by-artist?artistName=${encodeURIComponent(trimmedValue)}`));
                    }
                } else if (trimmedKey === 'relatedArtists') {
                    console.log('Fetching related artists for:', trimmedValue); // Debug log
                    promises.push(axios.get(`http://localhost:3001/spotify/public-related-artists?artistName=${encodeURIComponent(trimmedValue)}`));
                } else if (trimmedKey === 'library_mood') {
                    console.log('Fetching library by mood for:', trimmedValue); // Debug log
                    if (isSpotifyLoggedIn) {
                        promises.push(axios.get(`http://localhost:3001/user-library-by-mood?userId=${userId}&mood=${encodeURIComponent(trimmedValue)}`));
                    }
                } else if (trimmedKey === 'library_genre') {
                    console.log('Fetching library by genre for:', trimmedValue); // Debug log
                    if (isSpotifyLoggedIn) {
                        promises.push(axios.get(`http://localhost:3001/user-library-by-genre?userId=${userId}&genre=${encodeURIComponent(trimmedValue)}`));
                    }
                } else if (trimmedKey === 'playlist_mood') {
                    console.log('Fetching playlist by mood for:', trimmedValue); // Debug log
                    if (isSpotifyLoggedIn) {
                        promises.push(axios.get(`http://localhost:3001/user-playlists-by-mood?userId=${userId}&mood=${encodeURIComponent(trimmedValue)}`));
                    }
                } else if (trimmedKey === 'playlist_genre') {
                    console.log('Fetching playlist by genre for:', trimmedValue); // Debug log
                    if (isSpotifyLoggedIn) {
                        promises.push(axios.get(`http://localhost:3001/user-playlists-by-genre?userId=${userId}&genre=${encodeURIComponent(trimmedValue)}`));
                    }
                }
            });

            if (promises.length === 0) {
                console.log('Fetching general playlist for:', input); // Debug log
                promises.push(spotifyService.generatePlaylist(input));
            }

            console.log('Promises:', promises); // Debug log

            const results = await Promise.allSettled(promises);
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const playlist = result.value.data;
                    console.log('Fetched Playlist:', playlist); // Debug log
                    if (playlist && Array.isArray(playlist.playlists)) {
                        console.log('Normalizing playlists:', playlist.playlists); // Debug log
                        setPlaylists(prevPlaylists => [
                            ...prevPlaylists,
                            ...normalizePlaylistData(playlist.playlists)
                        ]);
                    } else if (playlist && Array.isArray(playlist.videos)) {
                        console.log('Normalizing videos:', playlist.videos); // Debug log
                        setPlaylists(prevPlaylists => [
                            ...prevPlaylists,
                            ...normalizePlaylistData(playlist.videos)
                        ]);
                    } else if (playlist && Array.isArray(playlist.tracks)) {
                        console.log('Normalizing tracks:', playlist.tracks); // Debug log
                        setPlaylists(prevPlaylists => [
                            ...prevPlaylists,
                            ...playlist.tracks.flatMap(normalizePlaylistData)
                        ]);
                    } else if (playlist && Array.isArray(playlist.savedTracks)) {
                        console.log('Normalizing saved tracks:', playlist.savedTracks); // Debug log
                        setPlaylists(prevPlaylists => [
                            ...prevPlaylists,
                            ...playlist.savedTracks.flatMap(normalizePlaylistData)
                        ]);
                    } else if (playlist && Array.isArray(playlist.recommendations)) {
                        console.log('Normalizing recommendations:', playlist.recommendations); // Debug log
                        setPlaylists(prevPlaylists => [
                            ...prevPlaylists,
                            ...playlist.recommendations.flatMap(normalizePlaylistData)
                        ]);
                    } else if (playlist && Array.isArray(playlist.songs)) {
                        console.log('Normalizing songs:', playlist.songs); // Debug log
                        setPlaylists(prevPlaylists => [
                            ...prevPlaylists,
                            ...normalizePlaylistData(playlist.songs)
                        ]);
                    } else if (playlist && Array.isArray(playlist.artists)) {
                        console.log('Normalizing artists:', playlist.artists); // Debug log
                        setPlaylists(prevPlaylists => [
                            ...prevPlaylists,
                            ...normalizePlaylistData(playlist.artists)
                        ]);
                    } else {
                        console.log('Normalizing single playlist:', playlist); // Debug log
                        setPlaylists(prevPlaylists => [
                            ...prevPlaylists,
                            normalizePlaylistData(playlist)
                        ]);
                    }
                } else {
                    console.error('Error in promise:', result.reason);
                }
            });

            // If the user is logged in, fetch personalized results
            if (isSpotifyLoggedIn || isFitbitLoggedIn || isGoogleFitLoggedIn) {
                const personalizedPromises = [];
                if (isSpotifyLoggedIn) {
                    console.log('Generating personalized playlist with userId:', userId, 'and accessToken:', accessToken); // Debug log
                    personalizedPromises.push(spotifyService.generatePersonalizedPlaylist(input, userId, accessToken));
                }
                if (isFitbitLoggedIn) {
                    personalizedPromises.push(fitbitService.generatePersonalizedPlaylist(input));
                }

                const personalizedResults = await Promise.allSettled(personalizedPromises);
                personalizedResults.forEach(result => {
                    if (result.status === 'fulfilled') {
                        const playlist = result.value.data;
                        console.log('Fetched Personalized Playlist:', playlist); // Debug log
                        if (playlist && Array.isArray(playlist.tracks)) {
                            console.log('Normalizing personalized tracks:', playlist.tracks); // Debug log
                            setPlaylists(prevPlaylists => [
                                ...prevPlaylists,
                                ...playlist.tracks.flatMap(normalizePlaylistData)
                            ]);
                        } else if (playlist && Array.isArray(playlist.savedTracks)) {
                            console.log('Normalizing personalized saved tracks:', playlist.savedTracks); // Debug log
                            setPlaylists(prevPlaylists => [
                                ...prevPlaylists,
                                ...playlist.savedTracks.flatMap(normalizePlaylistData)
                            ]);
                        } else if (playlist && Array.isArray(playlist.recommendations)) {
                            console.log('Normalizing personalized recommendations:', playlist.recommendations); // Debug log
                            setPlaylists(prevPlaylists => [
                                ...prevPlaylists,
                                ...playlist.recommendations.flatMap(normalizePlaylistData)
                            ]);
                        } else if (playlist) {
                            console.log('Normalizing single personalized playlist:', playlist); // Debug log
                            setPlaylists(prevPlaylists => [
                                ...prevPlaylists,
                                normalizePlaylistData(playlist)
                            ]);
                        }
                    } else {
                        console.error('Error in personalized promise:', result.reason);
                    }
                });

            }
        } catch (error) {
            console.error('Error generating playlist:', error);
        }
        setLoading(false);
    };

    /**
     * Function to handle the "Surprise Me" feature.
     */
    const handleSurpriseMe = async () => {
        setLoading(true);
        try {
            const [surpriseResponse, keywordResponse] = await Promise.all([
                spotifyService.surpriseMe(),
                axios.get(`http://localhost:3001/api/music-keyword-videos`)
            ]);

            const surpriseVideos = surpriseResponse.videos || [];
            const keywordVideos = keywordResponse.data.videos || [];

            const combinedPlaylists = [
                ...surpriseVideos.map(normalizePlaylistData),
                ...keywordVideos.map(normalizePlaylistData)
            ];

            setPlaylists(combinedPlaylists);
        } catch (error) {
            console.error('Error generating surprise playlist:', error);
        }
        setLoading(false);
    };

       /**
     * Function to handle connecting a workout.
     * @param {string} workout - The type of workout.
     */
    const handleConnectWorkout = async (workout) => {
        setLoading(true);
        setPlaylists([]); // Clear existing playlists to ensure a refresh
        try {
            const response = await axios.get(`http://localhost:3001/workout-music?workout=${encodeURIComponent(workout)}`);
            const playlist = response.data;
            console.log('Fetched Workout Playlist:', playlist); // Debug log

            if (playlist && playlist.recommendations) {
                console.log('Normalizing workout playlists:', playlist.recommendations); // Debug log
                const normalizedPlaylists = normalizePlaylistData(playlist);
                setPlaylists(normalizedPlaylists); // Set new playlists
            } else {
                console.error('Unexpected data structure:', playlist);
            }
        } catch (error) {
            console.error('Error connecting workout:', error);
        }
        setLoading(false);
    };

    
    /**
     * Function to handle syncing weather data.
     * @param {string} city - The city for which to sync weather data.
     */
    const handleSyncWeather = async (city) => {
        setLoading(true); // Start loading
        try {
            // Use the weatherService to fetch the playlist
            const playlist = await weatherService.syncWeather(city);

            if (playlist && playlist.recommendations) {
                console.log('Fetched Weather Playlist:', playlist.recommendations); // Debug log
                setPlaylists(normalizePlaylistData(playlist)); // Set new playlists
            } else {
                console.error('Unexpected data structure:', playlist);
                setPlaylists([]); // Clear playlists if data is invalid
            }
        } catch (error) {
            console.error('Error syncing weather:', error);
            setPlaylists([]); // Clear playlists on error
        }
        setLoading(false); // Stop loading
    };

       /**
     * Function to handle Spotify login.
     */
    const handleSpotifyLogin = () => {
        if (isSpotifyLoggedIn) {
            setNotification('You are already logged in to Spotify.');
        } else {
            localStorage.removeItem('spotifyUserId');
            localStorage.removeItem('isSpotifyLoggedIn');
            setIsSpotifyLoggedIn(false); // Clear state
            window.location.href = `http://localhost:3001/login`;
        }
    };
    
     /**
     * Function to handle Fitbit login.
     */
    const handleFitbitLogin = () => {
        localStorage.removeItem('isFitbitLoggedIn');
        localStorage.removeItem('fitbitUserId');
        setIsFitbitLoggedIn(false);
        window.location.href = `http://localhost:3001/fitbit-login`;
    };
    
    
    /** 
     * Function to handle weather login.
     */
    const handleWeatherLogin = () => {
        tailoredExperienceRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="app">
            <Header
                isSpotifyLoggedIn={isSpotifyLoggedIn}
                isFitbitLoggedIn={isFitbitLoggedIn}
                handleSpotifyLogin={handleSpotifyLogin}
                handleFitbitLogin={handleFitbitLogin}
                handleWeatherLogin={handleWeatherLogin}
                tailoredExperienceRef={tailoredExperienceRef}
                setNotification={setNotification}
            />
            <main>
                {notification && <Notification message={notification} notificationRef={notificationRef} />}
                <QuoteSection />
                <div className="playlist-section">
                    <PlaylistGenerator onGeneratePlaylist={handleGeneratePlaylist} />
                </div>
                <SurpriseMe onSurpriseMe={handleSurpriseMe} />
                <TailoredExperience
                    ref={tailoredExperienceRef}
                    onConnectWorkout={handleConnectWorkout}
                    onSyncWeather={handleSyncWeather}
                    onLogin={handleSpotifyLogin}
                    onFitbitLogin={handleFitbitLogin}
                    onWeatherMusic={handleSyncWeather} // Pass the new function
                    isSpotifyLoggedIn={isSpotifyLoggedIn}
                    isFitbitLoggedIn={isFitbitLoggedIn}
                />
                {loading && <LoadingAnimation ref={loadingRef} />}
                <div className="playlists" ref={resultsRef}>
                    <Playlist playlistItems={playlists} setNotification={setNotification} />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default App;
