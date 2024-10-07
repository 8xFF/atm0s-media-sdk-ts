import React, { useEffect, useState } from 'react';

interface ClockTimerProps {
    started_at: number; // Timestamp in milliseconds
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export function ClockTimer({ started_at }: ClockTimerProps) {
    const [secondsElapsed, setSecondsElapsed] = useState(formatTime(Math.floor((Date.now() - started_at) / 1000)));

    useEffect(() => {
        const intervalId = setInterval(() => {
            setSecondsElapsed(formatTime(Math.floor((Date.now() - started_at) / 1000)));
        }, 1000); // Update every second

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    return (
        <p>{secondsElapsed}</p>
    );
};
