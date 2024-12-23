// Importing necessary modules and components from React and local files
import React, { useState } from 'react';
import { GiMuscleUp } from 'react-icons/gi';// Workout icon from react-icons library
import './WorkoutIntegration.css';


/**
 * WorkoutIntegration Component
 * @param {Object} props - The properties passed to the component.
 * @param {Function} props.onConnectWorkout - Function to handle workout connection.
 * @returns {JSX.Element} - The rendered WorkoutIntegration component.
 */
const WorkoutIntegration = ({ onConnectWorkout }) => {
    const [workout, setWorkout] = useState('');


    /**
     * Handles the workout connection based on the entered workout.
     */
    const handleConnect = () => {
        onConnectWorkout(workout);
    };

    return (
        <div className="workout-integration">
             {/* Input field for entering the workout details */}
            <input
                type="text"
                placeholder="Enter your workout here"
                value={workout}
                onChange={(e) => setWorkout(e.target.value)}
            />
            {/* Button to trigger the workout connection */}
            <button onClick={handleConnect}>
                <GiMuscleUp /> Connect Workout
            </button>
        </div>
    );
};

export default WorkoutIntegration;











