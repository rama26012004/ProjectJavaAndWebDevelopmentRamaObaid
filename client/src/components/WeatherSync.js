// Importing necessary modules and components from React and local files
import React, { useState } from 'react';
import { WiDaySunny } from 'react-icons/wi';
import './WeatherSync.css';

/**
 * WeatherSync Component
 * @param {Object} props - The properties passed to the component.
 * @param {Function} props.onSyncWeather - Function to handle weather sync.
 * @returns {JSX.Element} - The rendered WeatherSync component.
 */
const WeatherSync = ({ onSyncWeather }) => {
    const [city, setCity] = useState('');

     /**
     * Handles the weather sync based on the entered city.
     */
    const handleSync = () => {
        onSyncWeather(city);
    };

    return (
        <div className="weather-sync">
            {/* Input field for entering the city name */}
            <input
                type="text"
                placeholder="Enter your city to harmonize with the weather"
                value={city}
                onChange={(e) => setCity(e.target.value)}
            />
             {/* Button to trigger the weather sync */}
            <button onClick={handleSync}>
                <WiDaySunny /> Sync Weather
            </button>
        </div>
    );
};

export default WeatherSync;










