/**
 * Import necessary modules, icons, and styles for the Login component.
 */
import React from 'react';
import { FaSpotify } from 'react-icons/fa';
import './Login.css';


/**
 * Login component displays a button to connect to Spotify for tailoring music generation.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {Function} props.onLogin - The function to handle the login action.
 * @returns {JSX.Element} The rendered Login component.
 */
const Login = ({ onLogin }) => {
    return (
        <div className="login-container">
            <button onClick={onLogin} className="login-button spotify">
                <FaSpotify /> Connect to Spotify to tailor your music generation
            </button>
        </div>
    );
};

export default Login;

