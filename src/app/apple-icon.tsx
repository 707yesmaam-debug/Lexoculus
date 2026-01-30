import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
    width: 180,
    height: 180,
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
                {/* Outer Frame - Scaled for 180px (approx 5.6x scale of 32px) */}
                <div
                    style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        width: '156px',
                        height: '156px',
                        border: '12px solid black',
                        boxSizing: 'border-box',
                    }}
                />

                {/* Top Left Bracket */}
                <div
                    style={{
                        position: 'absolute',
                        top: '40px',
                        left: '40px',
                        width: '34px',
                        height: '34px',
                        borderTop: '12px solid black',
                        borderLeft: '12px solid black',
                    }}
                />

                {/* Bottom Right Bracket */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '40px',
                        right: '40px',
                        width: '34px',
                        height: '34px',
                        borderBottom: '12px solid black',
                        borderRight: '12px solid black',
                    }}
                />

                {/* Center Optical Sensor */}
                <div
                    style={{
                        width: '56px',
                        height: '56px',
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
