'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import { useRef } from 'react';
import { Group, Mesh } from 'three';

function ComplianceCore() {
    const meshRef = useRef<Mesh>(null);
    const innerRef = useRef<Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
            meshRef.current.rotation.x += delta * 0.1;
        }
    });

    return (
        <group>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                {/* Outer Glass Shell */}
                <mesh ref={meshRef}>
                    <icosahedronGeometry args={[2, 0]} />
                    <meshPhysicalMaterial
                        color="#00D9FF"
                        roughness={0}
                        metalness={0.1}
                        transmission={0.6}
                        thickness={2}
                        transparent
                        opacity={0.5}
                        wireframe={true}
                    />
                </mesh>

                {/* Inner Core - Solid Navy/Orange */}
                <mesh ref={innerRef} scale={0.5}>
                    <octahedronGeometry args={[2, 0]} />
                    <meshStandardMaterial color="#FF6B35" roughness={0.4} metalness={0.8} />
                </mesh>
            </Float>
        </group>
    );
}

export default function SafetyCube() {
    return (
        <div className="w-full h-full min-h-[500px]">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 6]} />
                <ambientLight intensity={1} />
                <pointLight position={[10, 10, 10]} intensity={2} color="#00D9FF" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#FF6B35" />
                <ComplianceCore />
                <OrbitControls enableZoom={false} autoRotate={true} autoRotateSpeed={2} />
            </Canvas>
        </div>
    );
}
