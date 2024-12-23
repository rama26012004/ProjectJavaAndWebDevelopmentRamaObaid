/**
 * Import necessary modules and styles for the Notification component.
 */
import React, { useEffect, useState, useRef } from 'react';
import './Notification.css';


/**
 * Notification component displays a notification message that disappears after a specified duration.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.message - The notification message to display.
 * @param {number} [props.duration=5000] - The duration in milliseconds for which the notification is visible.
 * @param {Object} props.notificationRef - The ref object to forward to the notification container.
 * @returns {JSX.Element|null} The rendered Notification component or null if not visible.
 */
const Notification = ({ message, duration = 5000, notificationRef }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    useEffect(() => {
        if (notificationRef.current) {
            notificationRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [message, notificationRef]);

    if (!visible) return null;

    return (
        <div className="notification" ref={notificationRef}>
            {message}
        </div>
    );
};

export default Notification;
