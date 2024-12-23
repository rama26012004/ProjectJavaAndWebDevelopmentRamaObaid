/**
 * Import necessary modules, icons, and styles for the Header component.
 */
import React from 'react';
import { FaSpotify, FaCloudSun } from 'react-icons/fa';
import { SiFitbit } from 'react-icons/si';
import './Header.css';


/**
 * Header component for the MoodMelody application.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {boolean} props.isSpotifyLoggedIn - Indicates if the user is logged in to Spotify.
 * @param {boolean} props.isFitbitLoggedIn - Indicates if the user is logged in to Fitbit.
 * @param {Object} props.tailoredExperienceRef - Ref object for the tailored experience section.
 * @param {Function} props.setNotification - Function to set a notification message.
 * @param {Object} props.fitbitButtonRef - Ref object for the Fitbit button.
 * @param {Object} props.notificationRef - Ref object for the notification section.
 * @param {Object} props.weatherSyncRef - Ref object for the weather sync section.
 * @returns {JSX.Element} The rendered Header component.
 */

const Header = ({ isSpotifyLoggedIn, isFitbitLoggedIn, tailoredExperienceRef, setNotification, fitbitButtonRef, notificationRef, weatherSyncRef }) => {
     /**
     * Handles the click event for the Spotify icon.
     */
    const handleSpotifyIconClick = () => {
        if (isSpotifyLoggedIn) {
            setNotification('You are already logged in to Spotify.');
            if (notificationRef.current) {
                notificationRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            tailoredExperienceRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleFitbitIconClick = () => {
        /**
     * Handles the click event for the Fitbit icon.
     */
        if (isFitbitLoggedIn) {
            setNotification('You are already logged in to Fitbit.');
            if (notificationRef.current) {
                notificationRef.current.scrollIntoView({ behavior: 'smooth' });
            }
            fitbitButtonRef.current.scrollIntoView({ behavior: 'smooth' });
        } else {
            tailoredExperienceRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

     /**
     * Handles the click event for the Weather icon.
     */
    const handleWeatherIconClick = () => {
        weatherSyncRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <header>
            <div className="logo">MoodMelody</div>
            <nav>
                <div className="nav-link" onClick={handleSpotifyIconClick}>
                    <FaSpotify className="icon" />
                </div>
                <div className="nav-link" onClick={handleFitbitIconClick}>
                    <SiFitbit className="icon" />
                </div>
                <div className="nav-link" onClick={handleWeatherIconClick}>
                    <FaCloudSun className="icon" />
                </div>
            </nav>
        </header>
    );
};

export default Header;
