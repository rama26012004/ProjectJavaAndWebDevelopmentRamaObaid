/**
 * Import necessary modules and styles for the LoadingAnimation component.
 */
import React, { forwardRef } from "react";
import "./LoadingAnimation.css";

/**
 * LoadingAnimation component displays a loading animation.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {Object} ref - The ref object to forward to the loading animation container.
 * @returns {JSX.Element} The rendered LoadingAnimation component.
 */
const LoadingAnimation = forwardRef((props, ref) => {
  return (
    <div className="loading-animation" ref={ref}>
      <div className="bar bar1"></div>
      <div className="bar bar2"></div>
      <div className="bar bar3"></div>
      <div className="bar bar4"></div>
    </div>
  );
});

export default LoadingAnimation;





