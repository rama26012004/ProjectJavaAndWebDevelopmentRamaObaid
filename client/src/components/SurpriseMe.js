// Importing necessary modules and components from React and local files
import React from 'react';
import './SurpriseMe.css';

/**
 * SurpriseMe Component
 * @param {Object} props - The properties passed to the component.
 * @param {Function} props.onSurpriseMe - Function to handle the "Surprise Me" action.
 * @returns {JSX.Element} - The rendered SurpriseMe component.
 */
const SurpriseMe = ({ onSurpriseMe }) => {
    return (
        <div className="surprise-me">
            {/* Button to trigger the surprise action */}
            <button onClick={onSurpriseMe}>Surprise Me</button>
        </div>
    );
};

export default SurpriseMe;







