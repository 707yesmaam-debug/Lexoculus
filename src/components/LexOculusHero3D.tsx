'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LexOculusHero3D() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xF7F5F0);

        // Camera
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.z = 7;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Logo Group
        const logoGroup = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x121212 });

        // Helper to create line from points
        const createLine = (points: THREE.Vector3[], material = lineMaterial) => {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            return new THREE.Line(geometry, material);
        };

        // 1. OUTER RECTANGULAR FRAME
        const frameWidth = 3.2;
        const frameHeight = 2.2;
        const framePoints = [
            new THREE.Vector3(-frameWidth / 2, -frameHeight / 2, 0),
            new THREE.Vector3(frameWidth / 2, -frameHeight / 2, 0),
            new THREE.Vector3(frameWidth / 2, frameHeight / 2, 0),
            new THREE.Vector3(-frameWidth / 2, frameHeight / 2, 0),
            new THREE.Vector3(-frameWidth / 2, -frameHeight / 2, 0),
        ];
        logoGroup.add(createLine(framePoints));

        // 2. THE EYE SHAPE (Vesica Piscis - 4 curved arcs)
        const createArc = (startAngle: number, endAngle: number, radius: number, offsetX: number, segments = 32) => {
            const points: THREE.Vector3[] = [];
            for (let i = 0; i <= segments; i++) {
                const angle = startAngle + (endAngle - startAngle) * (i / segments);
                points.push(new THREE.Vector3(
                    offsetX + Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    0
                ));
            }
            return points;
        };

        // Left arc (right side of left circle)
        const leftArc = createArc(-Math.PI / 3, Math.PI / 3, 2.2, -1.1);
        logoGroup.add(createLine(leftArc));

        // Right arc (left side of right circle)
        const rightArc = createArc(Math.PI - Math.PI / 3, Math.PI + Math.PI / 3, 2.2, 1.1);
        logoGroup.add(createLine(rightArc));

        // Top arc
        const topArc = createArc(Math.PI / 2 - Math.PI / 4, Math.PI / 2 + Math.PI / 4, 2.5, 0);
        // Rotate top arc
        const topArcRotated = topArc.map(p => new THREE.Vector3(p.y, -p.x + 1.2, 0));
        logoGroup.add(createLine(topArcRotated));

        // Bottom arc
        const bottomArcRotated = topArc.map(p => new THREE.Vector3(-p.y, p.x - 1.2, 0));
        logoGroup.add(createLine(bottomArcRotated));

        // 3. CENTRAL GOLD SQUARE
        const squareSize = 0.55;
        const squareGeometry = new THREE.BoxGeometry(squareSize, squareSize, squareSize * 0.3);
        const squareMaterial = new THREE.MeshStandardMaterial({
            color: 0xD4AF37,
            metalness: 0.85,
            roughness: 0.15,
        });
        const goldSquare = new THREE.Mesh(squareGeometry, squareMaterial);
        logoGroup.add(goldSquare);

        // Square outline
        const squareOutline = [
            new THREE.Vector3(-squareSize / 2, -squareSize / 2, 0.1),
            new THREE.Vector3(squareSize / 2, -squareSize / 2, 0.1),
            new THREE.Vector3(squareSize / 2, squareSize / 2, 0.1),
            new THREE.Vector3(-squareSize / 2, squareSize / 2, 0.1),
            new THREE.Vector3(-squareSize / 2, -squareSize / 2, 0.1),
        ];
        logoGroup.add(createLine(squareOutline));

        // 4. DIAGONAL GRID LINES (the geometric pattern)
        const gridExtent = 1.8;
        const gridSpacing = 0.4;

        // Diagonal lines (top-left to bottom-right)
        for (let i = -4; i <= 4; i++) {
            const offset = i * gridSpacing;
            const start = new THREE.Vector3(-gridExtent + offset, gridExtent, 0);
            const end = new THREE.Vector3(gridExtent + offset, -gridExtent, 0);
            logoGroup.add(createLine([start, end]));
        }

        // Diagonal lines (top-right to bottom-left)
        for (let i = -4; i <= 4; i++) {
            const offset = i * gridSpacing;
            const start = new THREE.Vector3(gridExtent + offset, gridExtent, 0);
            const end = new THREE.Vector3(-gridExtent + offset, -gridExtent, 0);
            logoGroup.add(createLine([start, end]));
        }

        // 5. CONCENTRIC CIRCLES
        const createCircle = (radius: number, segments = 48) => {
            const points: THREE.Vector3[] = [];
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    0
                ));
            }
            return points;
        };

        logoGroup.add(createLine(createCircle(0.9)));
        logoGroup.add(createLine(createCircle(1.4)));

        // 6. HORIZONTAL AND VERTICAL LINES THROUGH CENTER
        logoGroup.add(createLine([
            new THREE.Vector3(-frameWidth / 2, 0, 0),
            new THREE.Vector3(frameWidth / 2, 0, 0),
        ]));
        logoGroup.add(createLine([
            new THREE.Vector3(0, -frameHeight / 2, 0),
            new THREE.Vector3(0, frameHeight / 2, 0),
        ]));

        scene.add(logoGroup);

        // Environment for metallic reflections
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0xFFFFFF);
        const envMap = pmremGenerator.fromScene(envScene).texture;
        scene.environment = envMap;

        // Lighting
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
        keyLight.position.set(2, 3, 5);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 1);
        fillLight.position.set(-3, 0, 3);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xD4AF37, 0.4);
        rimLight.position.set(0, -2, -3);
        scene.add(rimLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // Target rotation for smooth lerp
        const targetRotation = { x: 0, y: 0 };

        // Mouse tracking
        const handleMouseMove = (event: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        container.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Update target based on mouse
            targetRotation.x = mouseRef.current.y * 0.15;
            targetRotation.y = mouseRef.current.x * 0.25;

            // Smooth heavy lerp
            logoGroup.rotation.x += (targetRotation.x - logoGroup.rotation.x) * 0.04;
            logoGroup.rotation.y += (targetRotation.y - logoGroup.rotation.y) * 0.04;

            // Slow rotation for gold square
            goldSquare.rotation.y += 0.003;
            goldSquare.rotation.z += 0.001;

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            container.removeEventListener('mousemove', handleMouseMove);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
            pmremGenerator.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-[500px] border-b-2 border-[#121212]"
            style={{ cursor: 'crosshair' }}
        />
    );
}
