// courses.js - Course definitions for Rainbow Racing

// Collection of available courses
const courses = {
    // Rainbow Speedway - A colorful straight track with a few turns
    rainbow_speedway: {
        name: "Rainbow Speedway",
        description: "A high-speed track with vibrant colors",
        difficulty: 2, // 1-5 scale
        startPosition: { x: 0, y: 1, z: 0 },
        finishPosition: { x: 0, y: 0, z: -800 },
        segments: [
            {
                type: "straight",
                length: 200,
                width: 30,
                position: { x: 0, y: 0, z: -100 },
                decoration: "cones",
                colorScheme: "rainbow1"
            },
            {
                type: "turn",
                direction: "right",
                angle: 90,
                radius: 50,
                width: 30,
                position: { x: 50, y: 0, z: -250 },
                decoration: "pillars",
                colorScheme: "blue_purple"
            },
            {
                type: "straight",
                length: 150,
                width: 30,
                position: { x: 100, y: 0, z: -300 },
                obstacles: [
                    { type: "barrier", position: { x: 90, y: 0, z: -350 }, width: 10 },
                    { type: "barrier", position: { x: 110, y: 0, z: -400 }, width: 10 }
                ],
                decoration: "neon_lines",
                colorScheme: "rainbow2"
            },
            {
                type: "turn",
                direction: "left",
                angle: 90,
                radius: 40,
                width: 25,
                position: { x: 50, y: 0, z: -450 },
                decoration: "crystals",
                colorScheme: "green_cyan"
            },
            {
                type: "straight",
                length: 100,
                width: 40,
                position: { x: 0, y: 0, z: -550 },
                boost: [
                    { position: { x: 0, y: 0, z: -550 }, length: 20 }
                ],
                decoration: "energy_rings",
                colorScheme: "yellow_orange"
            },
            {
                type: "turn",
                direction: "right",
                angle: 45,
                radius: 40,
                width: 30,
                position: { x: 20, y: 0, z: -650 },
                decoration: "pillars",
                colorScheme: "fire"
            },
            {
                type: "straight",
                length: 100,
                width: 30,
                position: { x: 0, y: 0, z: -750 },
                decoration: "checkered",
                colorScheme: "finish"
            }
        ],
        checkpoints: [
            { position: { x: 0, y: 1, z: -100 }, radius: 5 },
            { position: { x: 50, y: 1, z: -250 }, radius: 5 },
            { position: { x: 100, y: 1, z: -350 }, radius: 5 },
            { position: { x: 50, y: 1, z: -450 }, radius: 5 },
            { position: { x: 0, y: 1, z: -600 }, radius: 5 }
        ],
        environment: {
            skyColor: "#000000",
            fogDensity: 0.02,
            centerpiece: {
                type: "hexagon",
                position: { x: 0, y: 20, z: -400 },
                size: 10,
                rotationSpeed: 0.01
            },
            particles: {
                count: 2000,
                size: 0.5,
                color: "rainbow"
            }
        },
        lighting: {
            ambient: { color: "#333333", intensity: 0.5 },
            directional: {
                color: "#ffffff",
                intensity: 1,
                position: { x: 5, y: 10, z: 7.5 }
            },
            points: [
                { color: "#ff0000", intensity: 1, position: { x: 20, y: 10, z: -50 }, distance: 100 },
                { color: "#00ff00", intensity: 1, position: { x: -20, y: 10, z: -100 }, distance: 100 },
                { color: "#0000ff", intensity: 1, position: { x: 0, y: 10, z: -150 }, distance: 100 },
                { color: "#ffff00", intensity: 1, position: { x: 30, y: 10, z: -200 }, distance: 100 },
                { color: "#ff00ff", intensity: 1, position: { x: -30, y: 10, z: -250 }, distance: 100 }
            ]
        }
    },
    
    // Neon Circuit - A more technical track with tight turns
    neon_circuit: {
        name: "Neon Circuit",
        description: "A technical circuit with tight turns and loops",
        difficulty: 4,
        startPosition: { x: 0, y: 1, z: 0 },
        finishPosition: { x: 0, y: 0, z: -700 },
        segments: [
            {
                type: "straight",
                length: 150,
                width: 25,
                position: { x: 0, y: 0, z: -75 },
                decoration: "neon_lines",
                colorScheme: "blue_purple"
            },
            {
                type: "turn",
                direction: "left",
                angle: 90,
                radius: 40,
                width: 25,
                position: { x: -40, y: 0, z: -150 },
                decoration: "crystals",
                colorScheme: "green_cyan"
            },
            {
                type: "straight",
                length: 100,
                width: 25,
                position: { x: -80, y: 0, z: -190 },
                obstacles: [
                    { type: "barrier", position: { x: -75, y: 0, z: -220 }, width: 8 },
                    { type: "barrier", position: { x: -85, y: 0, z: -260 }, width: 8 }
                ],
                decoration: "pillars",
                colorScheme: "fire"
            },
            {
                type: "turn",
                direction: "right",
                angle: 180,
                radius: 35,
                width: 25,
                position: { x: -45, y: 0, z: -300 },
                decoration: "energy_rings",
                colorScheme: "yellow_orange"
            },
            {
                type: "straight",
                length: 80,
                width: 25,
                position: { x: 0, y: 0, z: -335 },
                boost: [
                    { position: { x: 0, y: 0, z: -335 }, length: 20 }
                ],
                decoration: "neon_lines",
                colorScheme: "blue_purple"
            },
            {
                type: "turn",
                direction: "right",
                angle: 90,
                radius: 40,
                width: 25,
                position: { x: 40, y: 0, z: -375 },
                decoration: "crystals",
                colorScheme: "rainbow1"
            },
            {
                type: "straight",
                length: 100,
                width: 25,
                position: { x: 80, y: 0, z: -415 },
                obstacles: [
                    { type: "barrier", position: { x: 75, y: 0, z: -445 }, width: 8 },
                    { type: "barrier", position: { x: 85, y: 0, z: -475 }, width: 8 }
                ],
                decoration: "pillars",
                colorScheme: "rainbow2"
            },
            {
                type: "turn",
                direction: "left",
                angle: 90,
                radius: 40,
                width: 25,
                position: { x: 40, y: 0, z: -515 },
                decoration: "crystals",
                colorScheme: "green_cyan"
            },
            {
                type: "straight",
                length: 150,
                width: 25,
                position: { x: 0, y: 0, z: -585 },
                boost: [
                    { position: { x: 0, y: 0, z: -625 }, length: 20 }
                ],
                decoration: "energy_rings",
                colorScheme: "yellow_orange"
            },
            {
                type: "turn",
                direction: "right",
                angle: 45,
                radius: 40,
                width: 30,
                position: { x: 20, y: 0, z: -660 },
                decoration: "pillars",
                colorScheme: "fire"
            },
            {
                type: "straight",
                length: 50,
                width: 30,
                position: { x: 0, y: 0, z: -685 },
                decoration: "checkered",
                colorScheme: "finish"
            }
        ],
        checkpoints: [
            { position: { x: 0, y: 1, z: -75 }, radius: 5 },
            { position: { x: -40, y: 1, z: -150 }, radius: 5 },
            { position: { x: -80, y: 1, z: -230 }, radius: 5 },
            { position: { x: -40, y: 1, z: -300 }, radius: 5 },
            { position: { x: 0, y: 1, z: -335 }, radius: 5 },
            { position: { x: 40, y: 1, z: -375 }, radius: 5 },
            { position: { x: 80, y: 1, z: -450 }, radius: 5 },
            { position: { x: 40, y: 1, z: -515 }, radius: 5 },
            { position: { x: 0, y: 1, z: -625 }, radius: 5 }
        ],
        environment: {
            skyColor: "#0a001a",
            fogDensity: 0.025,
            centerpiece: {
                type: "torus",
                position: { x: 0, y: 30, z: -400 },
                size: 15,
                rotationSpeed: 0.02
            },
            particles: {
                count: 3000,
                size: 0.4,
                color: "blue_purple"
            }
        },
        lighting: {
            ambient: { color: "#221133", intensity: 0.3 },
            directional: {
                color: "#8866ff",
                intensity: 0.8,
                position: { x: 5, y: 10, z: 7.5 }
            },
            points: [
                { color: "#ff00ff", intensity: 1.2, position: { x: 20, y: 10, z: -50 }, distance: 80 },
                { color: "#00ffff", intensity: 1.2, position: { x: -20, y: 10, z: -150 }, distance: 80 },
                { color: "#6600ff", intensity: 1.2, position: { x: 0, y: 10, z: -250 }, distance: 80 },
                { color: "#ff00ff", intensity: 1.2, position: { x: 30, y: 10, z: -350 }, distance: 80 },
                { color: "#00ffff", intensity: 1.2, position: { x: -30, y: 10, z: -450 }, distance: 80 },
                { color: "#6600ff", intensity: 1.2, position: { x: 0, y: 10, z: -550 }, distance: 80 }
            ]
        }
    }
};