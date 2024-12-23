// Importing necessary modules and components from React and local files
import React from 'react';
import './QuoteSection.css';

/**
 * QuoteSection Component
 * @returns {JSX.Element} - The rendered QuoteSection component.
 */
const QuoteSection = () => {
    return (
        /* Displaying an image from the public directory */
        <div className="quote-section">
            <img src={`${process.env.PUBLIC_URL}/QuotePhoto.jpg`} alt="Aesthetic Photo" className="quote-image" />
            {/*Displaying a quote */}
            <p>"Where words fail, music speaks."</p>
        </div>
    );
};

export default QuoteSection;





