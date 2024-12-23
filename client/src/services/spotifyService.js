// Import the Axios library for making HTTP requests.

import axios from 'axios';


// Define the spotifyService object that encapsulates methods to interact with the backend API.
const spotifyService = {
        /**
     * Generate a playlist based on the user's input and authentication.
     * If userId and authToken are provided, fetch personalized playlists;
     * otherwise, fetch public playlists matching the input.
     * @param {string} input - The search query or mood.
     * @param {string} userId - User ID for personalized data (optional).
     * @param {string} authToken - Authentication token for secure access (optional).
     * @returns {Promise<Object>} The playlist data.
     */
    generatePlaylist: async (input, userId, authToken) => {
        if (userId && authToken) {
          // Fetch personalized playlists for authenticated users.
            const response = await axios.get(`http://localhost:3001/search-playlists?userId=${userId}&query=${input}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            return response.data;
        } else {
          // Fetch public playlists by mood for unauthenticated requests.
            const response = await axios.get(`http://localhost:3001/spotify/public-playlists-by-mood?mood=${input}`);
            return response.data;
        }
    },

     /**
     * Fetch a random surprise playlist.
     * @returns {Promise<Object>} A random playlist data.
     */
    surpriseMe: async () => {
        const response = await axios.get('http://localhost:3001/api/surprise');
        return response.data;
    },

       /**
     * Search for songs by a specific artist.
     * If authenticated, fetch personalized results; otherwise, fetch public data.
     * @param {string} artistName - The name of the artist.
     * @param {string} userId - User ID for personalized data (optional).
     * @param {string} authToken - Authentication token for secure access (optional).
     * @returns {Promise<Object>} A list of songs by the artist.
     */
    searchArtistSongs: async (artistName, userId, authToken) => {
        if (userId && authToken) {
           // Fetch personalized results for authenticated users.
            const response = await axios.get(`http://localhost:3001/search-artist-songs?artistName=${artistName}&userId=${userId}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            return response.data;
        } else {
           // Fetch public results for unauthenticated users.
            const response = await axios.get(`http://localhost:3001/spotify/public-artist-songs?artistName=${artistName}`);
            return response.data;
        }
    },


    /**
     * Fetch related artists based on the given artist's name.
     * If authenticated, fetch personalized data; otherwise, fetch public data.
     * @param {string} artistName - The name of the artist.
     * @param {string} userId - User ID for personalized data (optional).
     * @param {string} authToken - Authentication token for secure access (optional).
     * @returns {Promise<Object>} A list of related artists.
     */
    relatedArtists: async (artistName, userId, authToken) => {
        if (userId && authToken) {
            const response = await axios.get(`http://localhost:3001/related-artists?artistName=${artistName}&userId=${userId}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            return response.data;
        } else {
            const response = await axios.get(`http://localhost:3001/spotify/public-related-artists?artistName=${artistName}`);
            return response.data;
        }
    },

     /**
     * Fetches user playlists by mood.
     * @param {string} mood - The mood to filter playlists by.
     * @param {string} userId - The user ID (optional).
     * @param {string} authToken - The authorization token (optional).
     * @returns {Promise<Object>} The data from the user playlists API.
     */
    userPlaylistsByMood: async (mood, userId, authToken) => {
        if (userId && authToken) {
            const response = await axios.get(`http://localhost:3001/user-playlists-by-mood?userId=${userId}&mood=${mood}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            return response.data;
        } else {
            const response = await axios.get(`http://localhost:3001/spotify/public-playlists-by-mood?mood=${mood}`);
            return response.data;
        }
    },

    /**
     * Fetches user playlists by genre.
     * @param {string} genre - The genre to filter playlists by.
     * @param {string} userId - The user ID (optional).
     * @param {string} authToken - The authorization token (optional).
     * @returns {Promise<Object>} The data from the user playlists API.
     */

    userPlaylistsByGenre: async (genre, userId, authToken) => {
        if (userId && authToken) {
            const response = await axios.get(`http://localhost:3001/user-playlists-by-genre?userId=${userId}&genre=${genre}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            return response.data;
        } else {
            const response = await axios.get(`http://localhost:3001/spotify/public-playlists-by-genre?genre=${genre}`);
            return response.data;
        }
    },

      /**
     * Fetches user library by mood.
     * @param {string} mood - The mood to filter the library by.
     * @param {string} userId - The user ID (optional).
     * @param {string} authToken - The authorization token (optional).
     * @returns {Promise<Object>} The data from the user library API.
     */
    userLibraryByMood: async (mood, userId, authToken) => {
        if (userId && authToken) {
            const response = await axios.get(`http://localhost:3001/user-library-by-mood?userId=${userId}&mood=${mood}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            return response.data;
        } else {
            const response = await axios.get(`http://localhost:3001/spotify/public-playlists-by-mood?mood=${mood}`);
            return response.data;
        }
    },

    /**
     * Fetches user library by genre.
     * @param {string} genre - The genre to filter the library by.
     * @param {string} userId - The user ID (optional).
     * @param {string} authToken - The authorization token (optional).
     * @returns {Promise<Object>} The data from the user library API.
     */
    userLibraryByGenre: async (genre, userId, authToken) => {
        if (userId && authToken) {
            const response = await axios.get(`http://localhost:3001/user-library-by-genre?userId=${userId}&genre=${genre}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            return response.data;
        } else {
            const response = await axios.get(`http://localhost:3001/spotify/public-playlists-by-genre?genre=${genre}`);
            return response.data;
        }
    },

      /**
     * Fetches YouTube music playlists by mood.
     * @param {string} mood - The mood to filter playlists by.
     * @returns {Promise<Object>} The data from the YouTube API.
     */
    youtubeMusicPlaylistsByMood: async (mood) => {
        const response = await axios.get(`http://localhost:3001/youtube/music-playlists-by-mood?mood=${mood}`);
        return response.data;
    },


    /**
     * Fetches related songs for an artist on YouTube.
     * @param {string} artistName - The name of the artist.
     * @returns {Promise<Object>} The data from the YouTube API.
     */
    youtubeRelatedSongsByArtist: async (artistName) => {
        const response = await axios.get(`http://localhost:3001/youtube/related-songs-by-artist?artistName=${artistName}`);
        return response.data;
    },

     /**
     * Fetches YouTube videos by genre.
     * @param {string} genre - The genre to filter videos by.
     * @returns {Promise<Object>} The data from the YouTube API.
     */
    youtubeVideosByGenre: async (genre) => {
        const response = await axios.get(`http://localhost:3001/youtube/videos-by-genre?genre=${genre}`);
        return response.data;
    },
        /**
     * Fetches public playlists from Spotify based on the specified mood.
     * @param {string} mood - The mood to filter playlists by.
     * @returns {Promise<Object>} The data from the Spotify public playlists API.
     */
    spotifyPublicPlaylistsByMood: async (mood) => {
        const response = await axios.get(`http://localhost:3001/spotify/public-playlists-by-mood?mood=${mood}`);
        return response.data;
    },

        /**
     * Fetches public playlists from Spotify based on the specified genre.
     * @param {string} genre - The genre to filter playlists by.
     * @returns {Promise<Object>} The data from the Spotify public playlists API.
     */
    spotifyPublicPlaylistsByGenre: async (genre) => {
        const response = await axios.get(`http://localhost:3001/spotify/public-playlists-by-genre?genre=${genre}`);
        return response.data;
    },

        /**
     * Fetches public songs by a specific artist from Spotify.
     * @param {string} artistName - The name of the artist.
     * @returns {Promise<Object>} The data from the Spotify public artist songs API.
     */
    spotifyPublicArtistSongs: async (artistName) => {
        const response = await axios.get(`http://localhost:3001/spotify/public-artist-songs?artistName=${artistName}`);
        return response.data;
    },

    
    /**
     * Fetches public related artists based on the given artist's name from Spotify.
     * @param {string} artistName - The name of the artist.
     * @returns {Promise<Object>} The data from the Spotify public related artists API.
     */
    spotifyPublicRelatedArtists: async (artistName) => {
        const response = await axios.get(`http://localhost:3001/spotify/public-related-artists?artistName=${artistName}`);
        return response.data;
    }
};

export default spotifyService;
