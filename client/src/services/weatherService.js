import axios from 'axios';
/**
 * The weatherService object encapsulates methods to interact with the weather-related backend API.
 */

const weatherService = {
    /**
     * Fetches weather data for a specific city.
     * @param {string} city - The name of the city to get weather data for.
     * @returns {Promise<Object>} The weather data for the specified city.
     */
    syncWeather: async (city) => {
        const response = await axios.get(`http://localhost:3001/weather-music?city=${city}`);
        return response.data;
    }
};

export default weatherService;






