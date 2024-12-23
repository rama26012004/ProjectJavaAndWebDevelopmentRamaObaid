/**
 * Import necessary modules and components for the Fitbit service.
 */
import axios from 'axios';
/**
 * Fitbit service object containing methods for interacting with the Fitbit API.
 */
const fitbitService = {
      /**
     * Function to connect to Fitbit.
     * @param {string} userId - The user ID for the Fitbit connection.
     * @returns {Promise<Object>} - The response data from the Fitbit login endpoint.
     */
    connectFitbit: async (userId) => {
        const response = await axios.get(`http://localhost:3001/fitbit-login`);
        return response.data;
    },
     /**
     * Function to generate music recommendations based on fitness data.
     * @param {string} userId - The user ID for fetching fitness data.
     * @returns {Promise<Object>} - The response data containing music recommendations.
     */
    fitnessBasedMusic: async (userId) => {
        const response = await axios.get(`http://localhost:3001/fitness-based-music?userId=${userId}`);
        return response.data;
    }
};

/**
 * Export the fitbitService object as the default export.
 */
export default fitbitService;
