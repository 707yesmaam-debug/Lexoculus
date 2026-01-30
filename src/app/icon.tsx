import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
    width: 32,
    height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'white',
                    position: 'relative',
                }}
            >
                {/* Outer Frame */}
                <div
                    style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        width: '28px',
                        height: '28px',
                        border: '2px solid black',
                        boxSizing: 'border-box',
                    }}
                />

                {/* Top Left Bracket */}
                <div
                    style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px', // Adjusted for visual alignment with SVG path
                        width: '6px',
                        height: '6px',
                        borderTop: '2px solid black',
                        borderLeft: '2px solid black',
                    }}
                />

                {/* Bottom Right Bracket */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        width: '6px',
                        height: '6px',
                        borderBottom: '2px solid black',
                        borderRight: '2px solid black',
                    }}
                />

                {/* Center Optical Sensor */}
                <div
                    style={{
                        width: '10px',
                        height: '10px',
                        background: '#FF4F00',
                    }}
                />
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
