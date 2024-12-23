const mongoose = require('mongoose');

// Define the Playlist schema for storing playlists based on moods
const playlistSchema = new mongoose.Schema({
  mood: { type: String, required: true }, // Mood, e.g., happy, sad
  tracks: [String], // Array of song names
  createdAt: { type: Date, default: Date.now } // Automatically store creation time
});

// Export the Playlist model
module.exports = mongoose.model('Playlist', playlistSchema);
