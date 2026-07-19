// this is ai slop for testing purposes, real pack 3d model will be done eventually

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export default function Test() {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // Get mount size
        const width = mount.clientWidth || window.innerWidth;
        const height = mount.clientHeight || window.innerHeight;

        // Check for WebGL support
        if (!window.WebGLRenderingContext) {
            console.error("WebGL not supported in this browser.");
            return;
        }

        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true });
        } catch (e) {
            console.error("Failed to create WebGLRenderer:", e);
            return;
        }
        renderer.setSize(width, height);
        mount.appendChild(renderer.domElement);

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x202020);

        // Camera
        const camera = new THREE.PerspectiveCamera(
            100,
            width / height,
            0.1,
            1000
        );
        camera.position.set(0, 2, 5);

        // Handle resize
        const handleResize = () => {
            const newWidth = mount.clientWidth || window.innerWidth;
            const newHeight = mount.clientHeight || window.innerHeight;
            renderer.setSize(newWidth, newHeight);
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", handleResize);


        // Load textures
        const textureLoader = new THREE.TextureLoader();

        const baseTexture = textureLoader.load(window.constructCDNUrl("/content/test/bottest.png"));
        baseTexture.colorSpace = THREE.SRGBColorSpace;

        const topTexture = textureLoader.load("/seel.png");
        topTexture.colorSpace = THREE.SRGBColorSpace;

        // Load FBX
        const loader = new FBXLoader();
        let model: THREE.Group | null = null;
        let baseMesh: THREE.Mesh | null = null;
        let originalPositions: Float32Array | null = null;

        loader.load(
            window.constructCDNUrl("/content/models/pack final.fbx"),
            (fbx) => {
                model = fbx;

                fbx.traverse((obj) => {
                    if (!(obj as THREE.Mesh).isMesh) return;

                    const mesh = obj as THREE.Mesh;
                    const mat = mesh.material;

                    const apply = (m: THREE.Material) => {
                        // Replace base
                        if (m.name === "base") {
                            mesh.material = new THREE.MeshBasicMaterial({
                                name: "base",
                                map: baseTexture
                            });
                            // Store reference for animation
                            baseMesh = mesh;
                            const geometry = mesh.geometry as THREE.BufferGeometry;
                            originalPositions = new Float32Array(geometry.attributes.position.array);
                        }

                        // Replace top surfaces
                        if (m.name === "top1") {
                            mesh.material = new THREE.MeshBasicMaterial({
                                name: "top1",
                                map: topTexture
                            });
                        }
                    };

                    if (Array.isArray(mat)) mat.forEach(apply);
                    else apply(mat);
                });

                fbx.scale.setScalar(0.01);
                scene.add(fbx);
            },
            undefined,
            (err) => console.error("FBX load error:", err)
        );

        // Mouse drag rotation
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging || !model) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            model.rotation.y += deltaX * 0.01;
            model.rotation.x += deltaY * 0.01;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        mount.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("mousemove", onMouseMove);

        // Mouse wheel zoom
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            camera.position.z += e.deltaY * 0.01;
            camera.position.z = Math.max(1, Math.min(20, camera.position.z));
        };
        mount.addEventListener("wheel", onWheel, { passive: false });

        // Keyboard inflate/deflate
        let inflateAmount = 0;
        let smoothedNormals: Float32Array | null = null;
        const keysPressed = { e: false, f: false };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "e") keysPressed.e = true;
            if (e.key.toLowerCase() === "f") keysPressed.f = true;
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "e") keysPressed.e = false;
            if (e.key.toLowerCase() === "f") keysPressed.f = false;
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        // Render loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Inflate/deflate based on keys held - stretch vertices along normals
            if (baseMesh && originalPositions) {
                const geometry = baseMesh.geometry as THREE.BufferGeometry;
                const positions = geometry.attributes.position.array as Float32Array;

                // Compute smoothed normals once - average normals for vertices at same position
                if (!smoothedNormals) {
                    for (let i = 0; i < originalPositions.length; i++) {
                        positions[i] = originalPositions[i];
                    }
                    geometry.attributes.position.needsUpdate = true;
                    geometry.computeVertexNormals();

                    const rawNormals = geometry.attributes.normal.array as Float32Array;
                    smoothedNormals = new Float32Array(rawNormals.length);

                    // Group vertices by position and average their normals
                    const vertexMap = new Map<string, { indices: number[], nx: number, ny: number, nz: number }>();

                    for (let i = 0; i < originalPositions.length; i += 3) {
                        const key = `${originalPositions[i].toFixed(4)},${originalPositions[i + 1].toFixed(4)},${originalPositions[i + 2].toFixed(4)}`;

                        if (!vertexMap.has(key)) {
                            vertexMap.set(key, { indices: [], nx: 0, ny: 0, nz: 0 });
                        }
                        const entry = vertexMap.get(key)!;
                        entry.indices.push(i);
                        entry.nx += rawNormals[i];
                        entry.ny += rawNormals[i + 1];
                        entry.nz += rawNormals[i + 2];
                    }

                    // Normalize and assign averaged normals
                    for (const entry of vertexMap.values()) {
                        const len = Math.sqrt(entry.nx * entry.nx + entry.ny * entry.ny + entry.nz * entry.nz);
                        const nx = len > 0 ? entry.nx / len : 0;
                        const ny = len > 0 ? entry.ny / len : 0;
                        const nz = len > 0 ? entry.nz / len : 0;

                        for (const idx of entry.indices) {
                            smoothedNormals[idx] = nx;
                            smoothedNormals[idx + 1] = ny;
                            smoothedNormals[idx + 2] = nz;
                        }
                    }
                }

                if (keysPressed.e) {
                    inflateAmount += 0.01;
                }
                if (keysPressed.f) {
                    inflateAmount -= 0.01;
                    inflateAmount = Math.max(0, inflateAmount);
                }

                // Stretch vertices outward along their smoothed normals
                for (let i = 0; i < originalPositions.length; i += 3) {
                    const ox = originalPositions[i];
                    const oy = originalPositions[i + 1];
                    const oz = originalPositions[i + 2];

                    const nx = smoothedNormals[i];
                    const ny = smoothedNormals[i + 1];
                    const nz = smoothedNormals[i + 2];

                    positions[i] = ox + nx * inflateAmount;
                    positions[i + 1] = oy + ny * inflateAmount;
                    positions[i + 2] = oz + nz * inflateAmount;
                }

                geometry.attributes.position.needsUpdate = true;
                geometry.computeVertexNormals();
            }

            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            mount.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("mousemove", onMouseMove);
            mount.removeEventListener("wheel", onWheel);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("resize", handleResize);
            renderer.dispose();
            if (renderer.domElement.parentNode === mount) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{ width: "100vw", height: "100vh", display: "block" }}
        />
    );
}
