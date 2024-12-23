
// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const qs = require('qs');
const cors = require('cors');
require('dotenv').config();

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3001;

// Destructure environment variables 
const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  FITBIT_CLIENT_ID,
  FITBIT_CLIENT_SECRET,
  YOUTUBE_API_KEY,
  MONGODB_URI,
} = process.env;

// Define redirect URIs for Spotify and Fitbit authentication
const SPOTIFY_REDIRECT_URI = `http://localhost:${PORT}/callback`;
const FITBIT_DYNAMIC_REDIRECT_URI = `http://localhost:${PORT}/google-fit-callback`;

// Middleware to parse JSON bodies and enable CORS
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
})
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));


// Define Mongoose schema for User model
  const userSchema = new mongoose.Schema({
    spotifyId: String,
    fitbitId: { type: String, unique: true }, 
    accessToken: String,
    refreshToken: String,
    displayName: String,
    email: String,
    fitbitAccessToken: String,
    fitbitRefreshToken: String,
    fitbitName: String,
    fitbitEmail: String,
    fitbitData: Object,
});

// Create Mongoose model for User
const User = mongoose.model('User', userSchema);

//Function to refresh Spotify access token using the refresh token
async function refreshAccessToken(userId, refreshToken) {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
    });

    const newAccessToken = response.data.access_token;
    await User.findByIdAndUpdate(userId, { accessToken: newAccessToken });
    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error.message);
    throw error;
  }
}

// Spotify authentication route
app.get('/login', (req, res) => {
  const scopes = 'user-library-read user-read-email playlist-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';
  const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}`;
  res.redirect(authURL);
});

// Spotify callback route to handle the authorization code
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
      console.error('Spotify Authorization Code Missing');
      return res.redirect('http://localhost:3000/?error=spotify_auth_code_missing');
  }

  try {
      // Exchange code for tokens
      const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          client_id: SPOTIFY_CLIENT_ID,
          client_secret: SPOTIFY_CLIENT_SECRET,
      }), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, refresh_token } = tokenResponse.data;

      // Fetch Spotify user profile
      const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id, display_name, email } = profileResponse.data;

      // Update or create user in MongoDB
      const user = await User.findOneAndUpdate(
          { spotifyId: id },
          { accessToken: access_token, refreshToken: refresh_token, displayName: display_name, email },
          { new: true, upsert: true }
      );

      res.redirect(`http://localhost:3000/?spotify=true&userId=${user._id}`);
  } catch (err) {
      console.error('Error authenticating with Spotify:', err.response?.data || err.message);
      res.redirect('http://localhost:3000/?error=spotify_authentication_failed');
  }
});


// Fitbit authentication route
app.get('/fitbit-login', (req, res) => {
  const authURL = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(FITBIT_DYNAMIC_REDIRECT_URI)}&scope=activity%20profile%20heartrate%20location`;
  res.redirect(authURL);
});

// Fitbit callback route to handle the authorization code
app.get('/google-fit-callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
      console.error('Fitbit Authorization Code Missing');
      return res.redirect('http://localhost:3000/?error=fitbit_auth_code_missing');
  }

  try {
      // Exchange authorization code for tokens
      const tokenResponse = await axios.post('https://api.fitbit.com/oauth2/token', qs.stringify({
          code,
          redirect_uri: FITBIT_DYNAMIC_REDIRECT_URI,
          grant_type: 'authorization_code',
      }), {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`,
          },
      });

      const { access_token, refresh_token } = tokenResponse.data;

      // Fetch Fitbit user profile
      const profileResponse = await axios.get('https://api.fitbit.com/1/user/-/profile.json', {
          headers: { Authorization: `Bearer ${access_token}` },
      });

      const { encodedId, fullName, email } = profileResponse.data.user;

      // Ensure only the current user's data is updated
      const user = await User.findOneAndUpdate(
          { fitbitId: encodedId }, // Match by Fitbit's unique ID
          { 
              fitbitAccessToken: access_token, 
              fitbitRefreshToken: refresh_token, 
              fitbitName: fullName, 
              fitbitEmail: email,
              fitbitId: encodedId // Ensure `fitbitId` is set
          },
          { new: true, upsert: true } // Create a new record if no match is found
      );

      res.redirect(`http://localhost:3000/?fitbit=true&userId=${user._id}`);
  } catch (err) {
      console.error('Error authenticating with Fitbit:', err.response?.data || err.message);
      res.redirect('http://localhost:3000/?error=fitbit_authentication_failed');
  }
});

let spotifyAccessToken = '';

/**
 * Function to fetch Spotify client credentials token
 */
async function fetchSpotifyClientCredentialsToken() {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
      grant_type: 'client_credentials'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      }
    });

    spotifyAccessToken = response.data.access_token;
    console.log("Spotify Access Token obtained (Client Credentials Flow)");
  } catch (error) {
    console.error("Error fetching Spotify client credentials token:", error.message);
  }
}


// Fetch Spotify client credentials token initially and periodically
fetchSpotifyClientCredentialsToken();
setInterval(fetchSpotifyClientCredentialsToken, 3600 * 1000);


// Endpoint to check Spotify token validity
app.get('/check-spotify-token', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).send('User ID not provided.');

  try {
    const user = await User.findById(userId);
    if (!user || !user.accessToken) {
      return res.status(401).send('User not logged in.');
    }

    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    if (response.status === 200) {
      res.status(200).json({ userId: user._id, accessToken: user.accessToken });
    } else {
      res.status(401).send('User not logged in.');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      try {
        const newAccessToken = await refreshAccessToken(userId, user.refreshToken);
        res.status(200).json({ userId: user._id, accessToken: newAccessToken });
      } catch (refreshError) {
        res.status(401).send('User not logged in.');
      }
    } else {
      res.status(500).send('Error checking Spotify token.');
    }
  }
});

/**
 * Endpoint to fetch random playlists based on mood from Spotify.
 * Requires a user ID to access the user's Spotify access token.
 */
app.get('/search-playlists', async (req, res) => {
  const { query, userId } = req.query;

    // Validate the presence of query and userId
  if (!query || !userId) {
    return res.status(400).json({ error: 'Search query and user ID are required.' });
  }

  try {
        // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Generate a random offset between 0 and 1000 for different results
    const randomOffset = Math.floor(Math.random() * 1000);

    let searchResponse;

    try {
      // Attempt to fetch playlists with the current access token
      searchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params: {
          q: query,
          type: 'playlist',
          limit: 5,
          offset: randomOffset,
        },
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Refresh token if access token expired
        const newAccessToken = await refreshSpotifyToken(user);
        searchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${newAccessToken}` },
          params: {
            q: query,
            type: 'playlist',
            limit: 5,
            offset: randomOffset,
          },
        });
      } else {
        throw error;
      }
    }

    // Safeguard against null or undefined response
    const playlistsData = searchResponse?.data?.playlists;
    if (!playlistsData || !Array.isArray(playlistsData.items) || playlistsData.items.length === 0) {
      return res.status(404).json({ error: 'No playlists found for the given query.' });
    }

    // Map and handle missing data
    const playlists = playlistsData.items.map((playlist) => ({
      name: playlist?.name || 'Unknown Playlist',
      url: playlist?.external_urls?.spotify || '#',
      image: playlist?.images?.[0]?.url || '/image2.jpg', 
      tracks: playlist?.tracks?.total || 0,
      owner: playlist?.owner?.display_name || 'Unknown Owner',
    })).filter((playlist) => playlist.name !== 'Unknown Playlist');

    res.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching playlists.' });
  }
});

/**
 * Endpoint to fetch random public playlists based on mood from Spotify.
 * No user ID is needed as it uses the client credentials token.
 */
app.get('/spotify/public-playlists-by-mood', async (req, res) => {
  const { mood } = req.query;

  // Validate the presence of the mood query parameter
  if (!mood) {
    return res.status(400).send('Mood query parameter is required.');
  }

  try {
    // Fetch the total number of playlists for the query
    const totalPlaylistsResponse = await axios.get('https://api.spotify.com/v1/search', {
      headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
      params: {
        q: mood,
        type: 'playlist',
        limit: 1, // Fetch only one item to get the total count
      }
    });

    const totalPlaylists = totalPlaylistsResponse?.data?.playlists?.total || 0;

    if (totalPlaylists === 0) {
      return res.status(404).json({ success: false, message: 'No playlists found for the given mood.' });
    }

    // Adjust the randomOffset to stay within the range of available playlists
    const randomOffset = Math.floor(Math.random() * Math.max(totalPlaylists - 5, 1)); // Subtract 5 to avoid empty results

    // Fetch playlists with the adjusted offset
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
      params: {
        q: mood,
        type: 'playlist',
        limit: 5,
        offset: randomOffset,
      }
    });

    const playlistsData = response?.data?.playlists;
    if (!playlistsData || !playlistsData.items || playlistsData.items.length === 0) {
      return res.status(404).json({ success: false, message: 'No playlists found for the given mood.' });
    }

    const playlists = playlistsData.items.map(playlist => ({
      name: playlist?.name || 'Unknown Playlist',
      url: playlist?.external_urls?.spotify || '#',
      tracks: playlist?.tracks?.total || 0,
      image: playlist?.images?.[0]?.url || '/image2.jpg', 
      owner: playlist?.owner?.display_name || 'Unknown Owner',
    })).filter(playlist => playlist.name !== 'Unknown Playlist');

    res.json({ playlists });
  } catch (error) {
    console.error('Error fetching public playlists by mood:', error.response?.data || error.message);
    res.status(500).send('Error fetching public playlists by mood.');
  }
});


/**
 * Endpoint to fetch random playlists based on genre from Spotify.
 * Requires a user ID to access the user's Spotify access token.
 */
app.get('/search-playlists-by-genre', async (req, res) => {
  const { genre, userId } = req.query;

  // Validate the presence of genre and userId
  if (!genre || !userId) {
    return res.status(400).send('Genre and user ID are required.');
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Generate a random offset between 0 and 1000 for different results
    const randomOffset = Math.floor(Math.random() * 1000);

    let searchResponse;
    try {
      // Attempt to fetch playlists with the current access token
      searchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params: {
          q: `genre:"${genre}"`, // Query the genre directly
          type: 'playlist', // Search for playlists
          limit: 5, // Limit to 5 results
          offset: randomOffset, // Use the random offset
        },
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshSpotifyToken(user);
        searchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${newAccessToken}` },
          params: {
            q: `genre:"${genre}"`, // Query the genre directly
            type: 'playlist', // Search for playlists
            limit: 5, // Limit to 5 results
            offset: randomOffset, // Use the random offset
          },
        });
      } else {
        throw error;
      }
    }

    // Safeguard against null or undefined response
    const playlistsData = searchResponse?.data?.playlists;
    if (!playlistsData || !Array.isArray(playlistsData.items) || playlistsData.items.length === 0) {
      return res.status(404).send('No playlists found for the specified genre.');
    }

    // Map the response to extract playlist details
    const playlists = playlistsData.items.map((playlist) => ({
      name: playlist?.name || 'Unknown Playlist',
      description: playlist?.description || '',
      url: playlist?.external_urls?.spotify || '#',
      image: playlist?.images?.[0]?.url || '/image2.jpg', 
    }));

    res.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists by genre:', {
      message: error.message,
      data: error.response?.data || '',
      status: error.response?.status || '',
    });
    res.status(500).send('Error fetching playlists by genre.');
  }
});

/**
 * Endpoint to fetch random public playlists based on genre from Spotify.
 * No user ID is needed as it uses the client credentials token.
 */
app.get('/spotify/public-playlists-by-genre', async (req, res) => {
  const { genre } = req.query;

  // Validate the presence of the genre query parameter
  if (!genre) {
    return res.status(400).send('Genre query parameter is required.');
  }

  try {
    // Generate a random offset between 0 and 995 to ensure the sum of limit and offset does not exceed 1000
    const randomOffset = Math.floor(Math.random() * 995);

    let searchResponse;
    try {
      // Attempt to fetch playlists with the current access token
      searchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${spotifyAccessToken}` },
        params: {
          q: `genre:"${genre}"`, // Query the genre directly
          type: 'playlist', // Search for playlists
          limit: 5, // Limit to 5 results
          offset: randomOffset, // Use the random offset
        },
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Refresh token if access token expired
        const newAccessToken = await refreshSpotifyToken();
        searchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${newAccessToken}` },
          params: {
            q: `genre:"${genre}"`, // Query the genre directly
            type: 'playlist', // Search for playlists
            limit: 5, // Limit to 5 results
            offset: randomOffset, // Use the random offset
          },
        });
      } else {
        throw error;
      }
    }

    // Safeguard against null or undefined response
    const playlistsData = searchResponse?.data?.playlists;
    if (!playlistsData || !Array.isArray(playlistsData.items) || playlistsData.items.length === 0) {
      return res.status(404).send('No playlists found for the specified genre.');
    }

    // Map the response to extract playlist details
    const playlists = playlistsData.items.map((playlist) => ({
      name: playlist?.name || 'Unknown Playlist',
      description: playlist?.description || '',
      url: playlist?.external_urls?.spotify || '#',
      image: playlist?.images?.[0]?.url || '/image2.jpg', 
    }));

    res.json({ playlists });
  } catch (error) {
    console.error('Error fetching public playlists by genre:', {
      message: error.message,
      data: error.response?.data || '',
      status: error.response?.status || '',
    });
    res.status(500).send('Error fetching public playlists by genre.');
  }
});

/**
 * Endpoint to fetch songs related to the same artist from Spotify.
 * Requires a user ID to access the user's Spotify access token.
 */
app.get('/search-artist-songs', async (req, res) => {
  const { artistName, userId } = req.query;

  // Validate the presence of artist name and user ID
  if (!artistName || !userId) {
    return res.status(400).send('Artist name and user ID are required.');
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Generate a random offset between 0 and 1000 for varied results
    const randomOffset = Math.floor(Math.random() * 1000);

    let searchResponse;
    try {
      // Make an initial request to the Spotify API
      searchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` },
        params: { q: artistName, type: 'track', limit: 5, offset: randomOffset }
      });
    } catch (error) {
      // If a 401 error occurs, attempt to refresh the token
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshSpotifyToken(user);
        searchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: { q: artistName, type: 'track', limit: 5, offset: randomOffset }
        });
      } else {
        throw error;
      }
    }

    // Map the response to extract song details 
    const songs = searchResponse.data.tracks.items.map(track => ({
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      url: track.external_urls.spotify,
      album: track.album.name,
      image: track.album.images?.[0]?.url || '/image2.jpg', 
    }));

    res.json({ songs });

  } catch (error) {
    console.error('Error fetching artist songs:', error.message);
    res.status(500).send('Error fetching artist songs.');
  }
});

/**
 * Endpoint to fetch public songs related to the same artist from Spotify.
 * No user ID is needed as it uses the client credentials token.
 */
app.get('/spotify/public-artist-songs', async (req, res) => {
  const { artistName } = req.query;

  // Validate the presence of the artist name query parameter
  if (!artistName) {
    return res.status(400).send('Artist name is required.');
  }

  try {
    // Generate a random offset value for variety in results
    const randomOffset = Math.floor(Math.random() * 1000); 

    // Make the API request to fetch songs
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
      params: {
        q: artistName,
        type: 'track',
        limit: 5,
        offset: randomOffset // Use random offset for varied results
      }
    });
   
    // Map the response to extract song details
    const songs = response.data.tracks.items.map(track => ({
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      url: track.external_urls.spotify,
      album: track.album.name,
      image: track.album.images?.[0]?.url || '/image2.jpg', 
    }));

    res.json({ songs });
  } catch (error) {
    console.error('Error fetching public artist songs:', error.message);
    res.status(500).send('Error fetching public artist songs.');
  }
});


/**
 * Endpoint to fetch random playlists based on mood from YouTube.
 * No user ID is needed.
 */
// Searches for music content based on overall feel
// Adjusts the search with a random order parameter each time
// Focuses on music video results and limits results for variety
app.get('/youtube/music-playlists-by-mood', async (req, res) => {
  const { mood } = req.query;

  // Validate the presence of the mood query parameter
  if (!mood) {
    return res.status(400).send('Mood query parameter is required.');
  }

  try {
    // Define random order options and query variations
    const orderOptions = ['date', 'relevance', 'viewCount'];
    const randomOrder = orderOptions[Math.floor(Math.random() * orderOptions.length)];
    const queryVariations = [`${mood} music`, `${mood} playlist`, `${mood} hits`, `${mood} songs`];
    const randomQuery = queryVariations[Math.floor(Math.random() * queryVariations.length)];

    // Make the API request to youtube
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet,id',
        q: randomQuery,
        order: randomOrder,
        type: 'video',
        videoCategoryId: '10', //Music category
        key: process.env.YOUTUBE_API_KEY,
        maxResults: 50
      }
    });

    const videoIds = response.data.items.map(item => item.id.videoId).filter(Boolean).join(',');

    // Fetch video details for duration and view count
    const videoDetailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
        key: process.env.YOUTUBE_API_KEY
      }
    });

    // Convert ISO8601 duration format to seconds
    const parseDuration = (isoDuration) => {
      if (!isoDuration) return 0; // If duration is missing, return 0
      const match = isoDuration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0; // If regex fails, return 0
      const minutes = parseInt(match[1] || '0', 10);
      const seconds = parseInt(match[2] || '0', 10);
      return minutes * 60 + seconds;
    };

    // Define unwanted keywords and set minimum view count
    const excludeKeywords = ['reaction', 'review', 'interview', 'analysis', 'vlog', 'shorts', 'trailer', 'asmr', 'recap','top'];
    const minViewCount = 1000;

    // Filter videos: exclude short videos, low-view videos, and videos with unwanted keywords
    const filteredVideos = videoDetailsResponse.data.items
      .filter(video => {
        const durationInSeconds = parseDuration(video.contentDetails?.duration);
        const viewCount = parseInt(video.statistics?.viewCount || '0', 10); // Handle missing statistics
        const title = video.snippet.title.toLowerCase();

        return (
          durationInSeconds > 60 && // Exclude videos shorter than 60 seconds
          viewCount >= minViewCount && // Exclude videos with low views
          !excludeKeywords.some(keyword => title.includes(keyword)) // Exclude videos with unwanted keywords
        );
      })
      .map(video => ({
        title: video.snippet.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.snippet.thumbnails.default.url
      }))
      .sort(() => Math.random() - 0.5) // Shuffle for variety
      .slice(0, 5); // Limit to 5 results

    if (filteredVideos.length === 0) {
      return res.status(404).json({ success: false, message: 'No suitable videos found for the given mood.' });
    }

    res.json({ success: true, videos: filteredVideos });
  } catch (error) {
    console.error('Error fetching music playlists by mood:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching music playlists from YouTube.' });
  }
});


/**
 * Endpoint to fetch random public playlists based on genre from YouTube.
 * No user ID is needed.
 */
// Searches for music content based on the provided style
// Targets playlist results specifically, filtered for music
// Limits the result count and fetches from YouTube API
app.get('/youtube/videos-by-genre', async (req, res) => {
  const { genre } = req.query;

  // Validate the presence of the genre query parameter
  if (!genre) {
    return res.status(400).send('Genre query parameter is required.');
  }

  try {
    // Define random order options and query variations
    const orderOptions = ['date', 'relevance', 'viewCount'];
    const randomOrder = orderOptions[Math.floor(Math.random() * orderOptions.length)];
    const queryVariations = [`${genre} music`, `${genre} hits`, `${genre} songs` ,`${genre} playlist` ];
    const randomQuery = queryVariations[Math.floor(Math.random() * queryVariations.length)];

    // Make the API request to youtube 
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet,id',
        q: randomQuery,
        order: randomOrder,
        type: 'video',
        videoCategoryId: '10', // Music category
        key: process.env.YOUTUBE_API_KEY,
        maxResults: 50
      }
    });

    const videoIds = response.data.items.map(item => item.id.videoId).filter(Boolean).join(',');

    // Fetch video details for duration and view count
    const videoDetailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
        key: process.env.YOUTUBE_API_KEY
      }
    });

    // Parse ISO8601 duration to seconds
    const parseDuration = (isoDuration) => {
      if (!isoDuration) return 0;
      const match = isoDuration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      const minutes = parseInt(match?.[1] || '0', 10);
      const seconds = parseInt(match?.[2] || '0', 10);
      return minutes * 60 + seconds;
    };

    // Define unwanted keywords and set minimum view count
    const excludeKeywords = ['reaction', 'review', 'interview', 'analysis', 'vlog', 'shorts', 'trailer', 'asmr', 'recap', 'top'];
    const minViewCount = 1000;

    // Filter videos: exclude short videos, low-view videos, and videos with unwanted keywords
    const filteredVideos = videoDetailsResponse.data.items
      .filter(video => {
        const durationInSeconds = parseDuration(video.contentDetails?.duration);
        const viewCount = parseInt(video.statistics?.viewCount || '0', 10); // Handle missing statistics
        const title = video.snippet.title.toLowerCase();

        return (
          durationInSeconds > 60 && // Exclude videos shorter than 60 seconds
          viewCount >= minViewCount && // Exclude videos with low views
          !excludeKeywords.some(keyword => title.includes(keyword)) // Exclude videos with unwanted keywords
        );
      })
      .map(video => ({
        title: video.snippet.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.snippet.thumbnails.default.url
      }))
      .sort(() => Math.random() - 0.5) // Shuffle for variety
      .slice(0, 5); // Limit to 5 results

    if (filteredVideos.length === 0) {
      return res.status(404).json({ success: false, message: 'No suitable videos found for the given genre.' });
    }

    res.json({ success: true, videos: filteredVideos });
  } catch (error) {
    console.error('Error fetching YouTube videos by genre:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Error fetching YouTube videos by genre.' });
  }
});


/**
 * Endpoint to fetch songs related to the same artist from YouTube.
 * No user ID is needed as it uses the client credentials token.
 */
app.get('/youtube/related-songs-by-artist', async (req, res) => {
  const { artistName } = req.query;

  // Validate the presence of the artist name query parameter
  if (!artistName) {
    return res.status(400).send('Artist name query parameter is required.');
  }

  try {
    // Define random order options and keyword variations
    const orderOptions = ['date', 'relevance', 'viewCount'];
    const randomOrder = orderOptions[Math.floor(Math.random() * orderOptions.length)];
    const keywordVariations = [
      `${artistName} official music video`,
      `${artistName} lyric video`,
      `${artistName} songs`,
      `${artistName} hits`,
      `${artistName} playlist`
    ];
    const randomQuery = keywordVariations[Math.floor(Math.random() * keywordVariations.length)];

    // Make the API request
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet,id',
        q: randomQuery,
        order: randomOrder,
        type: 'video',
        videoCategoryId: '10',
        key: process.env.YOUTUBE_API_KEY,
        maxResults: 50
      }
    });

    const videoIds = response.data.items.map(item => item.id.videoId).filter(Boolean).join(',');

    // Fetch video details for duration and view count
    const videoDetailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoIds,
        key: process.env.YOUTUBE_API_KEY
      }
    });

    // Parse ISO8601 duration to seconds
    const parseDuration = (isoDuration) => {
      const match = isoDuration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      const minutes = parseInt(match?.[1] || '0', 10);
      const seconds = parseInt(match?.[2] || '0', 10);
      return minutes * 60 + seconds;
    };

    // Define unwanted keywords and minimum view count
    const excludeKeywords = ['reaction', 'review', 'interview', 'analysis', 'vlog', 'shorts', 'trailer', 'asmr', 'recap', 'top'];
    const minViewCount = 1000;

    // Filter videos based on criteria
    const filteredVideos = videoDetailsResponse.data.items
      .filter(video => {
        const durationInSeconds = parseDuration(video.contentDetails?.duration);
        const viewCount = parseInt(video.statistics?.viewCount || '0', 10); // Handle missing statistics
        const title = video.snippet.title.toLowerCase();

        return (
          durationInSeconds > 60 && // Exclude videos shorter than 1 minute
          viewCount >= minViewCount && // Exclude videos with low views
          !excludeKeywords.some(keyword => title.includes(keyword)) // Exclude unwanted keywords
        );
      })
      .map(video => ({
        title: video.snippet.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.snippet.thumbnails.default.url
      }))
      .sort(() => Math.random() - 0.5) // Shuffle for randomness
      .slice(0, 5); // Limit to 5 results

    if (filteredVideos.length === 0) {
      return res.status(404).json({ success: false, message: 'No suitable videos found for the given artist.' });
    }

    res.json({ success: true, videos: filteredVideos });
  } catch (error) {
    console.error('Error fetching songs related to artist:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Error fetching songs related to artist from YouTube.' });
  }
});

/**
 *  Search User's Playlists Based on Mood , Spotify , user id is needed
 */
// Function to refresh the Spotify access token
async function refreshSpotifyToken(user) {
  try {
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const newAccessToken = tokenResponse.data.access_token;
    user.accessToken = newAccessToken;
    await user.save();

    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error.message);
    throw new Error('Failed to refresh access token');
  }
}
/**
 * Endpoint to search user's playlists based on mood from Spotify.
 * Requires a user ID to access the user's Spotify access token.
 */
app.get('/user-playlists-by-mood', async (req, res) => {
  const { mood, userId } = req.query;

  // Validate the presence of mood and user ID
  if (!mood || !userId) {
    return res.status(400).send('Mood and user ID are required.');
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Try fetching user's playlists
    let playlistResponse;
    try {
      playlistResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` },
        params: { limit: 20 }
      });
    } catch (error) {
      // If token has expired, refresh it
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshSpotifyToken(user);
        playlistResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: { limit: 20 }
        });
      } else {
        throw error;
      }
    }

    // Safeguard against null or undefined response
    const playlistsData = playlistResponse?.data?.items;
    if (!playlistsData || !Array.isArray(playlistsData)) {
      return res.status(404).send('No playlists found for the user.');
    }

    // Filter playlists based on mood
    const playlists = playlistsData
      .filter(playlist => playlist?.name?.toLowerCase().includes(mood.toLowerCase()))
      .map(playlist => ({
        name: playlist?.name || 'Unknown Playlist',
        url: playlist?.external_urls?.spotify || '#',
        tracks: playlist?.tracks?.total || 0,
        owner: playlist?.owner?.display_name || 'Unknown Owner',
        image: playlist?.images?.[0]?.url || '/image2.jpg', 
      }));

    res.json({ playlists });

  } catch (error) {
    console.error('Error fetching user playlists by mood:', error.message);
    res.status(500).send('Error fetching user playlists by mood.');
  }
});


/**
 * Endpoint to search user's playlists based on genre from Spotify.
 * Requires a user ID to access the user's Spotify access token.
 */
app.get('/user-playlists-by-genre', async (req, res) => {
  const { genre, userId } = req.query;

  // Validate the presence of genre and user ID
  if (!genre || !userId) {
    return res.status(400).send('Genre and user ID are required.');
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Fetch user's playlists
    let playlistResponse;
    try {
      playlistResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` },
        params: { limit: 20 }
      });
    } catch (error) {
      // If token has expired, refresh it
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshSpotifyToken(user);
        playlistResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: { limit: 20 }
        });
      } else {
        throw error;
      }
    }

    // Safeguard against null or undefined response
    const playlistsData = playlistResponse?.data?.items;
    if (!playlistsData || !Array.isArray(playlistsData)) {
      return res.status(404).send('No playlists found for the user.');
    }

    let genrePlaylists = [];

    // Fetch all the tracks from each playlist to get artist genre
    for (const playlist of playlistsData) {
      if (!playlist || !playlist.id) {
        continue;
      }

      let tracksResponse;
      try {
        tracksResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
          headers: { 'Authorization': `Bearer ${user.accessToken}` },
          params: { limit: 50 }
        });
      } catch (error) {
        // If token has expired, refresh it
        if (error.response && error.response.status === 401) {
          const newAccessToken = await refreshSpotifyToken(user);
          tracksResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
            headers: { 'Authorization': `Bearer ${newAccessToken}` },
            params: { limit: 50 }
          });
        } else {
          throw error;
        }
      }

      // Safeguard against null or undefined response
      const tracksData = tracksResponse?.data?.items;
      if (!tracksData || !Array.isArray(tracksData)) {
        continue;
      }

      for (const trackItem of tracksData) {
        const artist = trackItem.track?.artists?.[0];
        if (!artist || !artist.id) {
          continue;
        }

        let artistResponse;
        try {
          artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}`, {
            headers: { 'Authorization': `Bearer ${user.accessToken}` }
          });
        } catch (error) {
          // If token has expired, refresh it
          if (error.response && error.response.status === 401) {
            const newAccessToken = await refreshSpotifyToken(user);
            artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}`, {
              headers: { 'Authorization': `Bearer ${newAccessToken}` }
            });
          } else {
            throw error;
          }
        }

        // Safeguard against null or undefined response
        const artistGenres = artistResponse?.data?.genres;
        if (!artistGenres || !Array.isArray(artistGenres)) {
          continue;
        }

        if (artistGenres.includes(genre.toLowerCase())) {
          genrePlaylists.push({
            name: playlist.name || 'Unknown Playlist',
            url: playlist.external_urls?.spotify || '#',
            tracks: playlist.tracks?.total || 0,
            owner: playlist.owner?.display_name || 'Unknown Owner',
            image: playlist.images?.[0]?.url || '/image2.jpg', 
          });
          break;
        }
      }
    }

    res.json({ playlists: genrePlaylists });

  } catch (error) {
    console.error('Error fetching user playlists by genre:', error.message);
    res.status(500).send('Error fetching user playlists by genre.');
  }
});


/**
 * Endpoint to search user's library based on mood from Spotify.
 * Requires a user ID to access the user's Spotify access token.
 */
app.get('/user-library-by-mood', async (req, res) => {
  const { mood, userId } = req.query;

  // Validate the presence of mood and user ID
  if (!mood || !userId) {
    return res.status(400).send('Mood and user ID are required.');
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    let accessToken = user.accessToken;

    try {
      // Fetch user's saved tracks
      let libraryResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: { limit: 50 }
      });


      // Filter tracks based on mood
      const savedTracks = libraryResponse.data.items
        .filter(item => item.track.name.toLowerCase().includes(mood.toLowerCase()))
        .map(item => ({
          name: item.track.name,
          artists: item.track.artists.map(artist => artist.name).join(', '),
          url: item.track.external_urls.spotify,
          album: item.track.album.name,
          image: item.track.album.images?.[0]?.url || '/image2.jpg', 
        }));

      res.json({ savedTracks });
    } catch (error) {
      // If token has expired, refresh it
      if (error.response && error.response.status === 401) {
        
        accessToken = await refreshSpotifyToken(user);

        // Fetch user's saved tracks with the new access token
        let libraryResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          params: { limit: 50 }
        });

        // Filter tracks based on mood
        const savedTracks = libraryResponse.data.items
          .filter(item => item.track.name.toLowerCase().includes(mood.toLowerCase()))
          .map(item => ({
            name: item.track.name,
            artists: item.track.artists.map(artist => artist.name).join(', '),
            url: item.track.external_urls.spotify,
            album: item.track.album.name,
            image: item.track.album.images?.[0]?.url || '/image2.jpg', 
          }));

        res.json({ savedTracks });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error fetching user library by mood:', error.message);
    res.status(500).send('Error fetching user library by mood.');
  }
});

/**
 * Endpoint to search user's library based on genre from Spotify.
 * Requires a user ID to access the user's Spotify access token.
 */
app.get('/user-library-by-genre', async (req, res) => {
  const { genre, userId } = req.query;

  // Validate the presence of genre and user ID
  if (!genre || !userId) {
    return res.status(400).send('Genre and user ID are required.');
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    let accessToken = user.accessToken;

    try {
      // Fetch user's saved tracks
      let libraryResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: { limit: 50 }
      });

      let genreTracks = [];

      // Filter tracks based on genre
      for (const trackItem of libraryResponse.data.items) {
        const artistId = trackItem.track.artists[0].id;
        let artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (artistResponse.data.genres.includes(genre.toLowerCase())) {
          genreTracks.push({
            name: trackItem.track.name,
            artists: trackItem.track.artists.map(artist => artist.name).join(', '),
            url: trackItem.track.external_urls.spotify,
            album: trackItem.track.album.name,
            image: trackItem.track.album.images?.[0]?.url || '/image2.jpg', // Fetch the image URL
          });
        }
      }

      res.json({ tracks: genreTracks });
    } catch (error) {
      // If token has expired, refresh it
      if (error.response && error.response.status === 401) {
        accessToken = await refreshSpotifyToken(user);

        // Fetch user's saved tracks with the new access token
        let libraryResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          params: { limit: 50 }
        });

        let genreTracks = [];

        // Filter tracks based on genre
        for (const trackItem of libraryResponse.data.items) {
          const artistId = trackItem.track.artists[0].id;
          let artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (artistResponse.data.genres.includes(genre.toLowerCase())) {
            genreTracks.push({
              name: trackItem.track.name,
              artists: trackItem.track.artists.map(artist => artist.name).join(', '),
              url: trackItem.track.external_urls.spotify,
              album: trackItem.track.album.name,
              image: trackItem.track.album.images?.[0]?.url || '/image2.jpg', 
            });
          }
        }

        res.json({ tracks: genreTracks });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error fetching user library by genre:', error.message);
    res.status(500).send('Error fetching user library by genre.');
  }
});

/** 
 *  Fetch Similar Artists Vibe along with Their Top Tracks , Spotify and user id is needed
 */
/**
 * Helper function to shuffle an array.
 * @param {Array} array - The array to be shuffled.
 * @returns {Array} - The shuffled array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

//Function to refresh the Spotify access token.
async function refreshAccessToken(userId, refreshToken) {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
    });

    const newAccessToken = response.data.access_token;
    await User.findByIdAndUpdate(userId, { accessToken: newAccessToken });
    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error.message);
    throw error;
  }
}

/**
 * Endpoint to fetch similar artists' vibe along with their top tracks from Spotify.
 * Requires a user ID to access the user's Spotify access token.
 */
app.get('/related-artists', async (req, res) => {
  const { artistName, userId } = req.query;

  // Validate the presence of artist name and user ID
  if (!artistName || !userId) {
    return res.status(400).send('Artist name and user ID are required.');
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Fetch artist details to get the artist ID
    let artistSearchResponse;
    try {
      artistSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` },
        params: {
          q: artistName,
          type: 'artist',
          limit: 1 //Only the first match
        }
      });
    } catch (error) {
      // If token has expired, refresh it
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken(user);
        artistSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: artistName,
            type: 'artist',
            limit: 1 //only the first match
          }
        });
      } else {
        throw error;
      }
    }

    const artist = artistSearchResponse.data.artists?.items?.[0];
    if (!artist) {
      return res.status(404).send('Artist not found.');
    }

    const artistId = artist.id;

    // Fetch related artists using the search API
    let relatedArtistsResponse;
    try {
      relatedArtistsResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` },
        params: {
          q: `genre:"${artist.genres[0]}"`, // Use the genre of the artist to find related artists
          type: 'artist',
          limit: 5 
        }
      });
    } catch (error) {
      // If token has expired, refresh it
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken(user);
        relatedArtistsResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: `genre:"${artist.genres[0]}"`, // Use the genre of the artist to find related artists
            type: 'artist',
            limit: 5 
          }
        });
      } else {
        throw error;
      }
    }

    const relatedArtists = relatedArtistsResponse.data.artists?.items || [];

    // Fetch top tracks for each related artist
    const artistsWithTracks = await Promise.all(relatedArtists.map(async artist => {
      try {
        const topTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks`, {
          headers: { 'Authorization': `Bearer ${user.accessToken}` },
          params: { market: 'US' }
        });

        // Shuffle and limit top tracks for each artist
        const topTracks = shuffleArray(topTracksResponse.data.tracks).slice(0, 3).map(track => ({ 
          name: track.name,
          album: track.album.name,
          url: track.external_urls.spotify
        }));

        return {
          name: artist.name,
          genres: artist.genres,
          url: artist.external_urls.spotify,
          topTracks
        };
      } catch (trackError) {
        console.error(`Error fetching top tracks for artist ${artist.name}:`, trackError.message);
        return {
          name: artist.name,
          genres: artist.genres,
          url: artist.external_urls.spotify,
          topTracks: []
        };
      }
    }));

    // Shuffle final result for variety on each refresh
    const shuffledArtistsWithTracks = shuffleArray(artistsWithTracks);

    res.json({ artists: shuffledArtistsWithTracks });

  } catch (error) {
    console.error('Error fetching related artists and tracks:', error.message);
    res.status(500).send('Error fetching related artists and tracks.');
  }
});

/**
 * Please note here, and until 27/November /2024 I used this code to ensure that Spotify videos got fetched based on genre, but unfortunately the endpoints 
 got terminated for users with Development accounts and I'm unable to use it anymore, the previous code which worked perfectly for the aim :

 * function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

app.get('/related-artists', async (req, res) => {
  const { artistName, userId } = req.query;

  if (!artistName || !userId) {
    return res.status(400).send('Artist name and user ID are required.');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Fetch artist details to get the artist ID
    const artistSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
      headers: { 'Authorization': `Bearer ${user.accessToken}` },
      params: {
        q: artistName,
        type: 'artist',
        limit: 1 // We only need the first match
      }
    });

    const artist = artistSearchResponse.data.artists.items[0];
    if (!artist) {
      return res.status(404).send('Artist not found.');
    }

    const artistId = artist.id;

    // Fetch related artists
    const relatedArtistsResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
      headers: { 'Authorization': `Bearer ${user.accessToken}` }
    });

    // Shuffle and limit related artists for variety
    const relatedArtists = shuffleArray(relatedArtistsResponse.data.artists).slice(0, 5); // Adjust 5 as needed

    // Fetch top tracks for each related artist
    const artistsWithTracks = await Promise.all(relatedArtists.map(async artist => {
      try {
        const topTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks`, {
          headers: { 'Authorization': `Bearer ${user.accessToken}` },
          params: { market: 'US' }
        });

        // Shuffle and limit top tracks for each artist
        const topTracks = shuffleArray(topTracksResponse.data.tracks).slice(0, 3).map(track => ({ // Adjust 3 as needed
          name: track.name,
          album: track.album.name,
          url: track.external_urls.spotify
        }));

        return {
          name: artist.name,
          genres: artist.genres,
          url: artist.external_urls.spotify,
          topTracks
        };
      } catch (trackError) {
        console.error(`Error fetching top tracks for artist ${artist.name}:`, trackError.message);
        return {
          name: artist.name,
          genres: artist.genres,
          url: artist.external_urls.spotify,
          topTracks: []
        };
      }
    }));

    // Shuffle final result for variety on each refresh
    const shuffledArtistsWithTracks = shuffleArray(artistsWithTracks);

    res.json({ artists: shuffledArtistsWithTracks });

  } catch (error) {
    console.error('Error fetching related artists and tracks:', error.message);
    res.status(500).send('Error fetching related artists and tracks.');
  }
});*/


/*---------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

/** 
 * Fetch Similar Artists Vibe along with Their Top Tracks , Spotify - No User ID Needed
 */


/**
 * Endpoint to fetch similar artists' vibe along with their top tracks from Spotify.
 * No user ID is needed as it uses the client credentials token.
 */
app.get('/spotify/public-related-artists', async (req, res) => {
  const { artistName } = req.query;

  // Validate the presence of the artist name query parameter
  if (!artistName) {
    return res.status(400).send('Artist name is required.');
  }

  try {
    // Fetch artist details to get the artist ID
    let artistSearchResponse;
    try {
      artistSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
        params: {
          q: artistName,
          type: 'artist',
          limit: 1 
        }
      });
    } catch (error) {
      // If token has expired, refresh it
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        artistSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: artistName,
            type: 'artist',
            limit: 1 
          }
        });
      } else {
        throw error;
      }
    }

    const artist = artistSearchResponse.data.artists?.items?.[0];
    if (!artist) {
      return res.status(404).send('Artist not found.');
    }

    const artistId = artist.id;

    // Fetch related artists using the search API
    let relatedArtistsResponse;
    try {
      relatedArtistsResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
        params: {
          q: `genre:"${artist.genres[0]}"`, // Use the genre of the artist to find related artists
          type: 'artist',
          limit: 5 
        }
      });
    } catch (error) {
      // If token has expired, refresh it
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        relatedArtistsResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: `genre:"${artist.genres[0]}"`, // Use the genre of the artist to find related artists
            type: 'artist',
            limit: 5 
          }
        });
      } else {
        throw error;
      }
    }

    const relatedArtists = relatedArtistsResponse.data.artists?.items || [];

    // Fetch top tracks for each related artist
    const artistsWithTracks = await Promise.all(relatedArtists.map(async artist => {
      try {
        const topTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks`, {
          headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
          params: { market: 'US' }
        });

        // Shuffle and limit top tracks for each artist
        const topTracks = shuffleArray(topTracksResponse.data.tracks).slice(0, 3).map(track => ({ 
          name: track.name,
          album: track.album.name,
          url: track.external_urls.spotify,
          image: track.album.images?.[0]?.url || '/image2.jpg' 

        }));

        return {
          name: artist.name,
          genres: artist.genres,
          url: artist.external_urls.spotify,
          image: artist.images?.[0]?.url || '/image2.jpg', 

          topTracks
        };
      } catch (trackError) {
        console.error(`Error fetching top tracks for artist ${artist.name}:`, trackError.message);
        return {
          name: artist.name,
          genres: artist.genres,
          url: artist.external_urls.spotify,
          image: artist.images?.[0]?.url || '/image2.jpg', 
          topTracks: []
        };
      }
    }));

    // Shuffle final result for variety on each refresh
    const shuffledArtistsWithTracks = shuffleArray(artistsWithTracks);

    res.json({ artists: shuffledArtistsWithTracks });

  } catch (error) {
    console.error('Error fetching related artists and tracks:', error.message);
    res.status(500).send('Error fetching related artists and tracks.');
  }
});


/**
 * Please note here, and until 27/November /2024 I used this code to ensure that Spotify videos got fetched based on genre, but unfortunately the endpoints 
 got terminated for users with Development accounts and I'm unable to use it anymore, the previous code which worked perfectly for the aim :


 * function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

app.get('/spotify/public-related-artists', async (req, res) => {
  const { artistName } = req.query;

  if (!artistName) {
      return res.status(400).send('Artist name is required.');
  }

  try {
      // Fetch artist details to get the artist ID
      const artistSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
          params: {
              q: artistName,
              type: 'artist',
              limit: 1 // Only fetch the first match
          }
      });

      const artist = artistSearchResponse.data.artists.items[0];
      if (!artist) {
          return res.status(404).send('Artist not found.');
      }

      const artistId = artist.id;

      // Fetch related artists
      const relatedArtistsResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
          headers: { 'Authorization': `Bearer ${spotifyAccessToken}` }
      });

      // Shuffle and limit the related artists for variety
      const relatedArtists = shuffleArray(relatedArtistsResponse.data.artists).slice(0, 5); // Limit to 5 artists

      // Fetch top tracks for each related artist
      const artistsWithTracks = await Promise.all(relatedArtists.map(async artist => {
          try {
              const topTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks`, {
                  headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
                  params: { market: 'US' }
              });

              // Shuffle and limit top tracks for each artist
              const topTracks = shuffleArray(topTracksResponse.data.tracks).slice(0, 3).map(track => ({ // Limit to 3 tracks
                  name: track.name,
                  album: track.album.name,
                  url: track.external_urls.spotify
              }));

              return {
                  name: artist.name,
                  genres: artist.genres,
                  url: artist.external_urls.spotify,
                  topTracks
              };
          } catch (trackError) {
              console.error(`Error fetching top tracks for artist ${artist.name}:`, trackError.message);
              return {
                  name: artist.name,
                  genres: artist.genres,
                  url: artist.external_urls.spotify,
                  topTracks: []
              };
          }
      }));

      // Shuffle final result for variety on each refresh
      const shuffledArtistsWithTracks = shuffleArray(artistsWithTracks);

      res.json({ artists: shuffledArtistsWithTracks });
  } catch (error) {
      console.error('Error fetching related artists and tracks:', error.message);
      res.status(500).send('Error fetching related artists and tracks.');
  }
});**/



/**
 * Endpoint to fetch random tracks based on a given video URL for the "Surprise Me" feature.
 */
// Pool of video IDs to simulate different starting points for recommendations
const videoIdPool = [
  'lPXi-5XhDPE', '6NNmDcisnQ8', 'tRj67DHPsro', 'zPyg4N7bcHM', 
  '0d8R1u4vj1Q', 'bHbSqH_xf0A', 'khRJMiquAjA', 'vW2HWHYd_jg', 'z79SoohPrgg',
  '4-S4unSPNJQ','jyWqLnUYkEc','nSveado5ZKU','-I4iPvLblVE','PIqMYtF0DoA',
  'Xyj0Mq-YdUY','n7YSG0AV5iI','VsTY-kyp2Js','ExN66QlCf7Y','IcIv_YExiJ8','Y_jvuLZW0_I','Vn4bBO78bJc',
  'fviMGUZcUgk','H4Dk2T0AQ2U','m-HeBQLb7C8','1-Au_oI3iBM','GKN-GEkJihQ','zAd4uTaUiDM','J1GerpUssss','428zWT8w8IE'
];

// Track the last selected video ID to avoid repetition
let lastVideoId = null;

// Helper function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper function to fetch video details
async function fetchVideoDetails(videoId) {
  const url = 'https://www.googleapis.com/youtube/v3/videos';
  try {
    const response = await axios.get(url, {
      params: {
        part: 'snippet',
        id: videoId,
        key: YOUTUBE_API_KEY
      }
    });

    if (response.data && response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0].snippet;
      return {
        title: video.title,
        description: video.description,
        tags: video.tags || []
      };
    } else {
      throw new Error('No video details found');
    }
  } catch (error) {
    console.error('Error fetching video details:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Helper function to fetch recommended videos using a randomized search query
async function fetchRecommendedVideos(query) {
  const url = 'https://www.googleapis.com/youtube/v3/search';
  
  // Randomly choose an order parameter to vary results
  const orderOptions = ['relevance', 'date', 'viewCount'];
  const randomOrder = orderOptions[Math.floor(Math.random() * orderOptions.length)];

  try {
    const response = await axios.get(url, {
      params: {
        part: 'snippet',
        type: 'video',
        maxResults: 3,
        q: query,
        order: randomOrder,
        key: YOUTUBE_API_KEY,
        videoCategoryId: '10' // Restricting to music category
      }
    });

    return response.data.items.map((item) => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails.default.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  } catch (error) {
    console.error('Error fetching recommended videos:', error.response ? error.response.data : error.message);
    return [];
  }
}

// Route to fetch random recommended videos based on a rotating pool of YouTube video IDs
app.get('/api/surprise', async (req, res) => {
  try {
    // Select a random video ID from the pool, avoiding the last one
    let videoId;
    do {
      const randomIndex = Math.floor(Math.random() * videoIdPool.length);
      videoId = videoIdPool[randomIndex];
    } while (videoId === lastVideoId);
    lastVideoId = videoId;

    const videoDetails = await fetchVideoDetails(videoId);

    if (!videoDetails) {
      return res.status(404).json({ success: false, message: 'No video details found' });
    }

    // Shuffle tags to create a slightly different query each time
    const shuffledTags = shuffleArray([...videoDetails.tags]).slice(0, 2).join(' ');
    const searchQuery = shuffledTags || videoDetails.title;

    const recommendedVideos = await fetchRecommendedVideos(searchQuery);

    if (recommendedVideos.length === 0) {
      return res.status(404).json({ success: false, message: 'No recommended videos found' });
    }

    res.json({ success: true, videos: recommendedVideos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recommended videos' });
  }
});

/**
 * Endpoint to fetch videos based on a randomly selected keyword from the list.
 */

// Keywords for searching
const keywords = ['playlist', 'playlist, slowed', 'playlist, reverb' , 'playlist , edits','playlist , aesthetic','playlist , mood booster'
  ,'late night drive playlist', 'nostalgia playlist', 'study with me playlist','dark academia playlist','classical playlist','chillhop playlist','rainy day playlist',
  'vaporwave  playlist',
];

// Helper function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper function to fetch YouTube videos with a specific keyword
async function fetchYouTubeVideos(keyword) {
  const url = 'https://www.googleapis.com/youtube/v3/search';
  try {
    const response = await axios.get(url, {
      params: {
        part: 'snippet',
        type: 'video',
        maxResults: 200, // Fetch more results for broader selection
        q: keyword,
        key: YOUTUBE_API_KEY,
        videoCategoryId: '10' // Restricting to music category
      }
    });

    // Shuffle and limit to 15 random results for variety
    return shuffleArray(response.data.items).slice(0, 3).map((item) => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails.default.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  } catch (error) {
    console.error('Error fetching videos:', error.response ? error.response.data : error.message);
    return [];
  }
}

// Route to fetch videos using a random keyword from the list
app.get('/api/music-keyword-videos', async (req, res) => {
  try {
    // Select a random keyword
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];

    // Fetch videos using the selected keyword
    const videos = await fetchYouTubeVideos(randomKeyword);

    if (videos.length === 0) {
      return res.status(404).json({ success: false, message: 'No videos found' });
    }

    res.json({
      success: true,
      keyword: randomKeyword,
      videos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
});

/**
 * Endpoint to fetch fitness data from Fitbit.
 * Requires a user ID to access the user's Fitbit access token.
 */
app.get('/fetch-fitness-data', async (req, res) => {
  const { userId } = req.query;


// Validate the presence of user ID
  if (!userId) {
    return res.status(400).send('User ID is required.');
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user || !user.fitbitAccessToken) {
      return res.status(404).send('User or Fitbit access token not found.');
    }

    // Use Fitbit API to fetch fitness data
    const fitnessDataResponse = await axios.get('https://api.fitbit.com/1/user/-/activities.json', {
      headers: {
        Authorization: `Bearer ${user.fitbitAccessToken}`
      }
    });

    const fitnessData = fitnessDataResponse.data;

    // Check if meaningful data is present
    const totalSteps = fitnessData.lifetime?.total?.steps || 0;

    if (totalSteps === 0) {
      return res.json({
        message: 'No meaningful fitness data found. Please ensure your Fitbit is synced.',
        data: fitnessData
      });
    }

    // Save the fitness data to the database
    user.fitbitData = fitnessData;
    await user.save();

    res.json({ message: 'Fitness data fetched successfully!', data: fitnessData });
  } catch (error) {
    console.error('Error fetching fitness data:', error.message);
    res.status(500).send('Failed to fetch fitness data.');
  }
});



/**
 * Endpoint to generate music recommendations based on Fitbit data.
 * Requires a user ID to access the user's fitness data.
 */
app.get('/fitness-based-music', async (req, res) => {
  const { userId } = req.query;

  // Validate the presence of user ID
  if (!userId) {
    return res.status(400).send('User ID is required.');
  }

  try {
    // Fetch user from the database
    const user = await User.findById(userId);
    if (!user || !user.fitbitData) {
      return res.status(404).send('User or fitness data not found.');
    }

    // Analyze Fitbit data
    const steps = user.fitbitData?.lifetime?.total?.steps || 0;
    const activities = user.fitbitData?.activities || []; // Fitbit-provided activities

    // Default mood and genre
    let mood = 'relaxed';
    let genre = 'classical';

    // Determine mood and genre based on Fitbit data
    if (steps > 12000) {
      mood = 'energetic';
      genre = 'pop';
    } else if (steps > 5000) {
      mood = 'happy';
      genre = 'indie';
    }

    // Check specific workouts for customization
    const activityTypes = activities.map((activity) => activity.name.toLowerCase());
    if (activityTypes.includes('hiit') || activityTypes.includes('circuit training')) {
      mood = 'focused';
      genre = 'electronic';
    } else if (activityTypes.includes('pilates') || activityTypes.includes('yoga')) {
      mood = 'relaxed';
      genre = 'ambient';
    } else if (activityTypes.includes('weight training') || activityTypes.includes('strength training')) {
      mood = 'motivational';
      genre = 'rock';
    } else if (activityTypes.includes('running') || activityTypes.includes('cycling')) {
      mood = 'energetic';
      genre = 'dance';
    } else if (activityTypes.includes('walking') || activityTypes.includes('functional training')) {
      mood = 'peaceful';
      genre = 'acoustic';
    }

    // Fetch music recommendations
    let spotifyMoodPlaylists = [];
    let spotifyGenrePlaylists = [];
    let youtubePlaylists = [];

    // Generate a random offset between 0 and 1000 for different results
    const randomOffset = Math.floor(Math.random() * 1000);

    // Fetch Spotify playlists by mood
    let moodSearchResponse;
    try {
      moodSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
        params: {
          q: `mood:${mood}`,
          type: 'playlist',
          limit: 5,
          offset: randomOffset
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        moodSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: `mood:${mood}`,
            type: 'playlist',
            limit: 5,
            offset: randomOffset
          }
        });
      } else {
        throw error;
      }
    }

    spotifyMoodPlaylists = moodSearchResponse.data.playlists?.items
      .filter(playlist => playlist?.name && playlist?.external_urls?.spotify && playlist?.images?.[0]?.url)
      .map(playlist => ({
        name: playlist.name,
        url: playlist.external_urls.spotify,
        image: playlist.images[0].url
      })) || [];

    // Fetch Spotify playlists by genre
    let genreSearchResponse;
    try {
      genreSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
        params: {
          q: `genre:"${genre}"`,
          type: 'playlist',
          limit: 5,
          offset: randomOffset
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        genreSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: `genre:"${genre}"`,
            type: 'playlist',
            limit: 5,
            offset: randomOffset
          }
        });
      } else {
        throw error;
      }
    }

    spotifyGenrePlaylists = genreSearchResponse.data.playlists?.items
      .filter(playlist => playlist?.name && playlist?.external_urls?.spotify && playlist?.images?.[0]?.url)
      .map(playlist => ({
        name: playlist.name,
        url: playlist.external_urls.spotify,
        image: playlist.images[0].url
      })) || [];

    // Fetch YouTube playlists by mood
    try {
      const youtubeResponse = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: 'snippet',
          q: `${mood} playlist`,
          type: 'playlist',
          key: process.env.YOUTUBE_API_KEY,
          maxResults: 5
        }
      });
      youtubePlaylists = youtubeResponse.data.items
        .filter(item => item?.snippet?.title && item?.id?.playlistId)
        .map(item => ({
          name: item.snippet.title,
          url: `https://www.youtube.com/playlist?list=${item.id.playlistId}`,
          image: item.snippet.thumbnails.default.url
        })) || [];
    } catch (error) {
      console.error('Error fetching YouTube playlists:', error.message);
    }

    res.json({
      message: 'Music recommendations generated based on your fitness data!',
      mood,
      genre,
      recommendations: {
        spotify: {
          moodPlaylists: spotifyMoodPlaylists,
          genrePlaylists: spotifyGenrePlaylists
        },
        youtube: youtubePlaylists
      }
    });
  } catch (error) {
    console.error('Error generating music recommendations:', error.response?.data || error.message);
    res.status(500).send('Failed to generate music recommendations.');
  }
});

/**
 * Endpoint to generate music recommendations based on workout type.
 * No user ID is needed.
 */
// Generate Music Based on Workout Type no need for user login
// Workout-Based Music Recommendations (No Fitbit Required)
app.get('/workout-music', async (req, res) => {
  const { workout } = req.query;

 // Validate the presence of workout type
  if (!workout) {
    return res.status(400).send('Workout type is required.');
  }

  try {
    // Determine mood and genre based on workout
    let mood = 'happy';
    let genre = 'pop';

    switch (workout.toLowerCase()) {
      case 'cardio training':
      case 'running':
      case 'cycling':
        mood = 'energetic';
        genre = 'dance';
        break;
      case 'weight training':
      case 'strength training':
      case 'squats':
      case 'lunge':
        mood = 'motivational';
        genre = 'rock';
        break;
      case 'pilates':
      case 'yoga':
      case 'dynamic stretching':
      case 'flexibility training':
        mood = 'relaxed';
        genre = 'ambient';
        break;
      case 'circuit training':
      case 'hiit':
        mood = 'intense'; 
        genre = 'hardcore'; 
        break;
      case 'swimming':
      case 'functional training':
        mood = 'peaceful';
        genre = 'classical';
        break;
      default:
        mood = 'happy';
        genre = 'pop';
    }

    // Generate a random offset between 0 and 1000 for different results
    const randomOffset = Math.floor(Math.random() * 1000);

    // Fetch music recommendations
    let spotifyMoodPlaylists = [];
    let spotifyGenrePlaylists = [];
    let youtubePlaylists = [];

    // Fetch Spotify playlists by mood
    let moodSearchResponse;
    try {
      moodSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
        params: {
          q: `${mood}`,
          type: 'playlist',
          limit: 5,
          offset: randomOffset
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        moodSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: `${mood}`,
            type: 'playlist',
            limit: 5,
            offset: randomOffset
          }
        });
      } else {
        throw error;
      }
    }

    spotifyMoodPlaylists = moodSearchResponse.data.playlists?.items
      .filter(playlist => playlist?.name && playlist?.external_urls?.spotify && playlist?.images?.[0]?.url)
      .map(playlist => ({
        name: playlist.name,
        url: playlist.external_urls.spotify,
        image: playlist.images[0].url
      })) || [];

    // Fetch Spotify playlists by genre
    let genreSearchResponse;
    try {
      genreSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
        params: {
          q: `genre:${genre}`,
          type: 'playlist',
          limit: 5,
          offset: randomOffset
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        genreSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: `genre:${genre}`,
            type: 'playlist',
            limit: 5,
            offset: randomOffset
          }
        });
      } else {
        throw error;
      }
    }

    spotifyGenrePlaylists = genreSearchResponse.data.playlists?.items
      .filter(playlist => playlist?.name && playlist?.external_urls?.spotify && playlist?.images?.[0]?.url)
      .map(playlist => ({
        name: playlist.name,
        url: playlist.external_urls.spotify,
        image: playlist.images[0].url
      })) || [];

    // Fetch YouTube playlists by mood
    try {
      const youtubeResponse = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: 'snippet',
          q: `${mood} ${genre} playlist`,
          type: 'playlist',
          key: process.env.YOUTUBE_API_KEY,
          maxResults: 5
        }
      });
      youtubePlaylists = youtubeResponse.data.items
        .filter(item => item?.snippet?.title && item?.id?.playlistId)
        .map(item => ({
          name: item.snippet.title,
          url: `https://www.youtube.com/playlist?list=${item.id.playlistId}`,
          image: item.snippet.thumbnails.default.url
        })) || [];
    } catch (error) {
      console.error('Error fetching YouTube playlists:', error.message);
    }

    res.json({
      message: 'Music recommendations generated for your workout!',
      mood,
      genre,
      recommendations: {
        spotify: {
          moodPlaylists: spotifyMoodPlaylists,
          genrePlaylists: spotifyGenrePlaylists
        },
        youtube: youtubePlaylists
      }
    });
  } catch (error) {
    console.error('Error generating workout music recommendations:', error.response?.data || error.message);
    res.status(500).send('Failed to generate music recommendations.');
  }
});

/**
 * Endpoint to generate music recommendations based on weather.
 */
app.get('/weather-music', async (req, res) => {
  const { city } = req.query;

  // Validate the presence of the city query parameter
  if (!city) {
    return res.status(400).send('City is required.');
  }

  // Log the API key to verify it's being set correctly
  console.log('OPENWEATHERMAP_API_KEY:', process.env.OPENWEATHER_API_KEY);

  try {
    // Fetch weather data
    const weatherEndpoint = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
    console.log('Weather API Endpoint:', weatherEndpoint);
    const weatherResponse = await axios.get(weatherEndpoint);
    const weatherData = weatherResponse.data;

    const temperature = weatherData.main.temp; // Current temperature
    const weatherCondition = weatherData.weather[0].main.toLowerCase(); // Weather condition

    // Determine mood and genre based on weather conditions
    let mood = 'happy';
    let genre = 'pop';

    if (temperature < 10) {
      // Cold weather
      mood = 'relaxed';
      genre = 'acoustic';
    } else if (temperature >= 10 && temperature <= 20) {
      // Cool weather
      mood = 'calm';
      genre = 'classical';
    } else if (temperature > 20) {
      // Warm or hot weather
      mood = 'energetic';
      genre = 'summer';
    }

    if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
      mood = 'reflective';
      genre = 'lo-fi';
    } else if (weatherCondition.includes('snow')) {
      mood = 'cozy';
      genre = 'holiday';
    } else if (weatherCondition.includes('clear') && temperature > 20) {
      mood = 'upbeat';
      genre = 'party';
    }

    // Generate a random offset between 0 and 1000 for different results
    const randomOffset = Math.floor(Math.random() * 1000);

    // Fetch music recommendations
    let spotifyMoodPlaylists = [];
    let spotifyGenrePlaylists = [];
    let youtubePlaylists = [];

    // Fetch Spotify playlists by mood
    let moodSearchResponse;
    try {
      moodSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
        params: {
          q: `mood:${mood}`,
          type: 'playlist',
          limit: 5,
          offset: randomOffset
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        moodSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: `mood:${mood}`,
            type: 'playlist',
            limit: 5,
            offset: randomOffset
          }
        });
      } else {
        throw error;
      }
    }

    spotifyMoodPlaylists = moodSearchResponse.data.playlists?.items
      .filter(playlist => playlist?.name && playlist?.external_urls?.spotify && playlist?.images?.[0]?.url)
      .map(playlist => ({
        name: playlist.name,
        url: playlist.external_urls.spotify,
        image: playlist.images[0].url
      })) || [];

    // Fetch Spotify playlists by genre
    let genreSearchResponse;
    try {
      genreSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${spotifyAccessToken}` },
        params: {
          q: `genre:"${genre}"`,
          type: 'playlist',
          limit: 5,
          offset: randomOffset
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        genreSearchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` },
          params: {
            q: `genre:"${genre}"`,
            type: 'playlist',
            limit: 5,
            offset: randomOffset
          }
        });
      } else {
        throw error;
      }
    }

    spotifyGenrePlaylists = genreSearchResponse.data.playlists?.items
      .filter(playlist => playlist?.name && playlist?.external_urls?.spotify && playlist?.images?.[0]?.url)
      .map(playlist => ({
        name: playlist.name,
        url: playlist.external_urls.spotify,
        image: playlist.images[0].url
      })) || [];

    // Fetch YouTube playlists by mood
    try {
      const youtubeResponse = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: 'snippet',
          q: `${mood} playlist`,
          type: 'playlist',
          key: process.env.YOUTUBE_API_KEY,
          maxResults: 5
        }
      });
      youtubePlaylists = youtubeResponse.data.items
        .filter(item => item?.snippet?.title && item?.id?.playlistId)
        .map(item => ({
          name: item.snippet.title,
          url: `https://www.youtube.com/playlist?list=${item.id.playlistId}`,
          image: item.snippet.thumbnails.default.url
        })) || [];
    } catch (error) {
      console.error('Error fetching YouTube playlists:', error.message);
    }

    res.json({
      message: `Music recommendations generated based on current weather in ${city}!`,
      weather: {
        temperature,
        condition: weatherCondition
      },
      mood,
      genre,
      recommendations: {
        spotify: {
          moodPlaylists: spotifyMoodPlaylists,
          genrePlaylists: spotifyGenrePlaylists
        },
        youtube: youtubePlaylists
      }
    });
  } catch (error) {
    console.error('Error generating weather music recommendations:', error.response?.data || error.message);
    res.status(500).send('Failed to generate music recommendations.');
  }
});



// Start the server on port 3001
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});






