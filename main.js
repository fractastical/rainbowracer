// Main.js - Rainbow Racing Game
// Works with predefined courses from course.js and ship from ship.js

// DOM Elements
const timerElement = document.getElementById('timer');
const checkpointsElement = document.getElementById('checkpoints');
const timesListElement = document.getElementById('times-list');
const nameInput = document.getElementById('name-input');
const saveTimeButton = document.getElementById('save-time');
const courseDropdown = document.getElementById('course-dropdown');
const loadCourseButton = document.getElementById('load-course');
const resetButton = document.getElementById('reset-button');

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Game objects
let racerGroup;
let checkpointObjects = [];
let obstacles = [];
let boostPads = [];
let currentCourse = null;

// Physics (initialized from ship config)
const physics = Object.assign({}, shipConfig.physics);

// Game state
const gameState = {
    started: false,
    finished: false,
    raceStartTime: 0,
    raceEndTime: 0,
    currentTime: 0,
    checkpoints: 0,
    totalCheckpoints: 0,
    bestTimes: {},
    collisionCooldown: 0,
    boundaryViolation: false,
    boundaryPenaltyTime: 0
};

// Controls
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    ' ': false
};

// Color schemes
const colorSchemes = {
    'rainbow1': [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8a2be2, 0xff00ff],
    'rainbow2': [0xff00ff, 0x8a2be2, 0x0000ff, 0x00ff00, 0xffff00, 0xff7700, 0xff0000],
    'blue_purple': [0x0000ff, 0x4b0082, 0x8a2be2, 0x9400d3, 0x800080],
    'fire': [0xff0000, 0xff3300, 0xff6600, 0xff9900, 0xffcc00],
    'green_cyan': [0x00ff00, 0x00ff33, 0x00ff66, 0x00ff99, 0x00ffcc],
    'yellow_orange': [0xffff00, 0xffcc00, 0xff9900, 0xff6600, 0xff3300],
    'finish': [0xffffff, 0x000000, 0xffffff, 0x000000]
};

// Initialization
function init() {
    // Create ship display
    shipConfig.createDisplay();
    
    // Populate course dropdown
    for (const courseId in courses) {
        const option = document.createElement('option');
        option.value = courseId;
        option.textContent = courses[courseId].name;
        courseDropdown.appendChild(option);
    }
    
    // Load saved best times or initialize
    const savedTimes = localStorage.getItem('rainbowRacerBestTimes');
    if (savedTimes) {
        gameState.bestTimes = JSON.parse(savedTimes);
    } else {
        // Initialize with empty arrays for each course
        for (const courseId in courses) {
            gameState.bestTimes[courseId] = [];
        }
    }
    
    // Event listeners
    document.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
            // Start race on first movement
            if (!gameState.started && !gameState.finished && 
                (e.key === 'w' || e.key === 'ArrowUp')) {
                startRace();
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false;
        }
    });
    
    loadCourseButton.addEventListener('click', () => {
        loadCourse(courseDropdown.value);
    });
    
    saveTimeButton.addEventListener('click', saveNewTime);
    resetButton.addEventListener('click', resetRace);
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Load first course
    if (Object.keys(courses).length > 0) {
        loadCourse(Object.keys(courses)[0]);
    }
    
    animate();
}

// Format milliseconds to MM:SS.mmm
function formatTime(timeMs) {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const milliseconds = timeMs % 1000;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Update timer display
function updateTimer() {
    if (gameState.started && !gameState.finished) {
        gameState.currentTime = Date.now() - gameState.raceStartTime;
        timerElement.textContent = formatTime(gameState.currentTime);
    }
}

// Start a new race
function startRace() {
    gameState.started = true;
    gameState.finished = false;
    gameState.raceStartTime = Date.now();
    gameState.checkpoints = 0;
    
    // Reset checkpoint states
    checkpointObjects.forEach(checkpoint => {
        checkpoint.passed = false;
        if (checkpoint.mesh) {
            checkpoint.mesh.material.color.set(0x00ffff);
            checkpoint.mesh.material.opacity = 0.7;
        }
    });
    
    checkpointsElement.textContent = `Checkpoints: 0/${gameState.totalCheckpoints}`;
}

// Reset the current race
function resetRace() {
    gameState.started = false;
    gameState.finished = false;
    gameState.currentTime = 0;
    gameState.checkpoints = 0;
    gameState.collisionCooldown = 0;
    gameState.boundaryViolation = false;
    gameState.boundaryPenaltyTime = 0;
    timerElement.textContent = '00:00.000';
    
    // Reset physics
    physics.speed = 0;
    physics.isBoost = false;
    physics.boostTime = 0;
    physics.boostCooldown = 0;
    
    // Reset racer position
    if (racerGroup) {
        racerGroup.position.set(
            currentCourse.startPosition.x,
            currentCourse.startPosition.y,
            currentCourse.startPosition.z
        );
        racerGroup.rotation.set(0, 0, 0);
    }
    
    // Update ship display
    shipConfig.updateDisplay(physics);
    
    // Reset checkpoints
    checkpointObjects.forEach(checkpoint => {
        checkpoint.passed = false;
        if (checkpoint.mesh) {
            checkpoint.mesh.material.color.set(0x00ffff);
            checkpoint.mesh.material.opacity = 0.7;
        }
    });
    
    checkpointsElement.textContent = `Checkpoints: 0/${gameState.totalCheckpoints}`;
    
    // Hide save interface
    nameInput.style.display = 'none';
    saveTimeButton.style.display = 'none';
}

// Save a new best time
function saveNewTime() {
    const playerName = nameInput.value.trim() || 'Player';
    const courseId = courseDropdown.value;
    
    const newTime = {
        player: playerName,
        time: gameState.currentTime,
        date: new Date().toISOString().split('T')[0]
    };
    
    gameState.bestTimes[courseId].push(newTime);
    localStorage.setItem('rainbowRacerBestTimes', JSON.stringify(gameState.bestTimes));
    
    // Update best times display
    updateBestTimesList();
    
    // Hide save interface
    nameInput.style.display = 'none';
    saveTimeButton.style.display = 'none';
}

// Update best times list for current course
function updateBestTimesList() {
    if (!currentCourse) return;
    
    timesListElement.innerHTML = '';
    
    const courseId = courseDropdown.value;
    const courseTimes = gameState.bestTimes[courseId] || [];
    
    const sortedTimes = [...courseTimes].sort((a, b) => a.time - b.time);
    const topTimes = sortedTimes.slice(0, 5); // Show top 5 times
    
    if (topTimes.length === 0) {
        timesListElement.textContent = 'No times recorded yet';
        return;
    }
    
    topTimes.forEach((timeRecord, index) => {
        const timeElement = document.createElement('div');
        timeElement.className = 'best-time';
        timeElement.textContent = `${index + 1}. ${timeRecord.player}: ${formatTime(timeRecord.time)}`;
        timesListElement.appendChild(timeElement);
    });
}

// Load a course by ID
function loadCourse(courseId) {
    // Clear existing course
    clearCourse();
    
    // Set current course
    currentCourse = courses[courseId];
    gameState.totalCheckpoints = currentCourse.checkpoints.length;
    
    // Update UI
    checkpointsElement.textContent = `Checkpoints: 0/${gameState.totalCheckpoints}`;
    
    // Generate course
    generateCourse(currentCourse);
    
    // Create racer
    createRacer();
    
    // Reset game state
    resetRace();
    
    // Update best times list
    updateBestTimesList();
}

// Clear existing course elements
function clearCourse() {
    // Remove all non-essential objects
    const objectsToRemove = [];
    scene.traverse(object => {
        if (object.userData.courseElement || object === racerGroup) {
            objectsToRemove.push(object);
        }
    });
    
    objectsToRemove.forEach(object => {
        scene.remove(object);
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    });
    
    // Clear arrays
    checkpointObjects = [];
    obstacles = [];
    boostPads = [];
}

// Generate course from course data
function generateCourse(courseData) {
    // Set environment
    scene.background = new THREE.Color(courseData.environment?.skyColor || "#000000");
    if (courseData.environment?.fogDensity > 0) {
        scene.fog = new THREE.FogExp2(courseData.environment.skyColor || "#000000", courseData.environment.fogDensity);
    }
    
    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    ambientLight.userData.courseElement = true;
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.userData.courseElement = true;
    scene.add(directionalLight);
    
    // Add point lights for neon effect
    const colors = colorSchemes.rainbow1;
    for (let i = 0; i < 7; i++) {
        const light = new THREE.PointLight(colors[i], 1, 100);
        light.position.set(
            Math.sin(i * 0.5) * 20,
            5,
            -i * 100
        );
        light.userData.courseElement = true;
        scene.add(light);
    }
    
    // Create centerpiece if specified
    if (courseData.environment?.centerpiece) {
        const centerpiece = createCenterpiece(courseData.environment.centerpiece);
        centerpiece.userData.courseElement = true;
        scene.add(centerpiece);
    }
    
    // Create floor track
    createTrack(courseData);
    
    // Create checkpoints
    createCheckpoints(courseData.checkpoints);
    
    // Create obstacles if defined
    createObstacles(courseData);
    
    // Create boost pads if defined
    createBoostPads(courseData);
    
    // Create finish line
    createFinishLine(courseData.finishPosition);
    
    // Create particles
    createParticles();
}

// Create obstacles from course data
function createObstacles(courseData) {
    // Process all segments for obstacles
    courseData.segments.forEach(segment => {
        if (segment.obstacles && segment.obstacles.length > 0) {
            segment.obstacles.forEach(obstacle => {
                const barrierGeometry = new THREE.BoxGeometry(obstacle.width, 5, 2);
                const barrierMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff0000,
                    roughness: 0.1,
                    metalness: 0.8,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.5
                });
                
                const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
                barrier.position.set(
                    obstacle.position.x,
                    obstacle.position.y + 2.5,
                    obstacle.position.z
                );
                barrier.userData.courseElement = true;
                
                // Add to obstacles array for collision detection
                obstacles.push({
                    mesh: barrier,
                    width: obstacle.width,
                    position: new THREE.Vector3(
                        obstacle.position.x,
                        obstacle.position.y,
                        obstacle.position.z
                    )
                });
                
                scene.add(barrier);
            });
        }
    });
}

// Create boost pads from course data
function createBoostPads(courseData) {
    // Process all segments for boost pads
    courseData.segments.forEach(segment => {
        if (segment.boost && segment.boost.length > 0) {
            segment.boost.forEach(boostPad => {
                const boostGeometry = new THREE.PlaneGeometry(15, boostPad.length || 20);
                const boostMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                
                const boost = new THREE.Mesh(boostGeometry, boostMaterial);
                boost.rotation.x = -Math.PI / 2;
                boost.position.set(
                    boostPad.position.x,
                    boostPad.position.y - 0.9, // Slightly above track
                    boostPad.position.z
                );
                boost.userData.courseElement = true;
                
                // Add to boostPads array for gameplay detection
                boostPads.push({
                    mesh: boost,
                    position: new THREE.Vector3(
                        boostPad.position.x,
                        boostPad.position.y,
                        boostPad.position.z
                    ),
                    length: boostPad.length || 20
                });
                
                scene.add(boost);
            });
        }
    });
}

// Create centerpiece (floating hexagon, etc.)
function createCenterpiece(centerpieceData) {
    const geometry = new THREE.BoxGeometry(
        centerpieceData.size || 10,
        centerpieceData.size || 10,
        centerpieceData.size || 10
    );
    
    // Create rainbow gradient material
    const colors = [];
    const positions = geometry.attributes.position;
    const rainbowColors = colorSchemes.rainbow1;
    
    for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        const size = centerpieceData.size || 10;
        const normalizedY = (y / size) + 0.5;
        const segment = Math.floor(normalizedY * rainbowColors.length);
        const color = new THREE.Color(rainbowColors[Math.min(segment, rainbowColors.length - 1)]);
        colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.1,
        metalness: 0.8
    });
    
    const centerpiece = new THREE.Mesh(geometry, material);
    centerpiece.position.set(
        centerpieceData.position.x || 0,
        centerpieceData.position.y || 20,
        centerpieceData.position.z || -400
    );
    
    // Store animation info
    centerpiece.userData.rotationSpeed = centerpieceData.rotationSpeed || 0.01;
    
    return centerpiece;
}

// Create track and decorations
function createTrack(courseData) {
    // Track dimensions
    const trackWidth = 30;
    const trackLength = 1000;
    
    // Create basic floor
    const floorGeometry = new THREE.PlaneGeometry(trackWidth, trackLength, 20, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.1,
        metalness: 0.8
    });
    
    // Add rainbow colors to floor
    const floorColors = [];
    const positions = floorGeometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        const segment = Math.floor(Math.abs(z) / 10) % colorSchemes.rainbow1.length;
        const color = new THREE.Color(colorSchemes.rainbow1[segment]);
        floorColors.push(color.r, color.g, color.b);
    }
    
    floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(floorColors, 3));
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.position.z = -trackLength/2; // Center of course
    floor.userData.courseElement = true;
    scene.add(floor);
    
    // Add boundary walls and warning stripes
    const boundaries = effectsManager.createBoundaryWalls(trackWidth, trackLength);
    scene.add(boundaries);
    
    // Add decorative elements (cones) along the track
    for (let i = 0; i < 40; i++) {
        // Position cones just inside the boundaries
        const leftCone = createCone(-trackWidth/2 + 2, -i * 20);
        leftCone.userData.courseElement = true;
        scene.add(leftCone);
        
        const rightCone = createCone(trackWidth/2 - 2, -i * 20);
        rightCone.userData.courseElement = true;
        scene.add(rightCone);
    }
}

// Create a cone with rainbow colors
function createCone(x, z) {
    const height = 10 + Math.sin(z * 0.01) * 3;
    const coneGeometry = new THREE.ConeGeometry(2, height, 3);
    const colors = [];
    
    // Apply rainbow colors in segments
    for (let i = 0; i < coneGeometry.attributes.position.count; i++) {
        const y = coneGeometry.attributes.position.getY(i);
        const segment = Math.floor(((y / height) + 0.5) * 7) % 7;
        const color = new THREE.Color(colorSchemes.rainbow1[segment]);
        colors.push(color.r, color.g, color.b);
    }
    
    coneGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const coneMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.1,
        metalness: 0.8
    });
    
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(x, 0, z);
    cone.rotation.x = Math.PI;
    
    return cone;
}

// Create finish line
function createFinishLine(position) {
    if (!position) {
        position = { x: 0, y: 0, z: -800 };
    }
    
    // Create finish line with checkered pattern
    const finishGeometry = new THREE.PlaneGeometry(30, 10, 8, 8);
    const finishMaterial = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide
    });
    
    // Create checkered pattern
    const finishColors = [];
    const finishPositions = finishGeometry.attributes.position;
    
    for (let i = 0; i < finishPositions.count; i++) {
        const x = finishPositions.getX(i);
        const y = finishPositions.getY(i);
        
        const xSegment = Math.floor((x + 15) / 3.75);
        const ySegment = Math.floor((y + 5) / 1.25);
        
        const isWhite = (xSegment + ySegment) % 2 === 0;
        const color = new THREE.Color(isWhite ? 0xffffff : 0x000000);
        
        finishColors.push(color.r, color.g, color.b);
    }
    
    finishGeometry.setAttribute('color', new THREE.Float32BufferAttribute(finishColors, 3));
    
    const finishLine = new THREE.Mesh(finishGeometry, finishMaterial);
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.set(position.x, -0.9, position.z);
    finishLine.userData.courseElement = true;
    
    scene.add(finishLine);
}

// Create checkpoint markers
function createCheckpoints(checkpointData) {
    if (!checkpointData || checkpointData.length === 0) return;
    
    checkpointData.forEach((checkpoint, index) => {
        const checkpointGeometry = new THREE.TorusGeometry(5, 0.5, 8, 24);
        const checkpointMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });
        
        const checkpointMarker = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
        checkpointMarker.position.set(
            checkpoint.position.x,
            checkpoint.position.y,
            checkpoint.position.z
        );
        checkpointMarker.rotation.x = Math.PI / 2;
        checkpointMarker.userData.courseElement = true;
        
        // Add to checkpoints array for collision detection
        checkpointObjects.push({
            mesh: checkpointMarker,
            position: new THREE.Vector3(
                checkpoint.position.x,
                checkpoint.position.y,
                checkpoint.position.z
            ),
            radius: checkpoint.radius || 5,
            index: index,
            passed: false
        });
        
        scene.add(checkpointMarker);
    });
}

// Create particles
function createParticles() {
    // Use the star field effect from effects.js
    const stars = effectsManager.createStarField();
    scene.add(stars);
}

// Create racer vehicle
function createRacer() {
    // Use the ship model from ship config
    racerGroup = shipConfig.createModel();
    
    // Position racer at start position
    racerGroup.position.set(
        currentCourse.startPosition?.x || 0,
        currentCourse.startPosition?.y || 1,
        currentCourse.startPosition?.z || 0
    );
    
    // Add camera to racer
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 1, -10);
    racerGroup.add(camera);
    
    scene.add(racerGroup);
}

// Check checkpoint collisions
function checkCheckpoints() {
    if (!gameState.started || gameState.finished) return;
    
    checkpointObjects.forEach(checkpoint => {
        if (!checkpoint.passed) {
            const distance = racerGroup.position.distanceTo(checkpoint.position);
            if (distance < checkpoint.radius) {
                // Mark checkpoint as passed
                checkpoint.passed = true;
                checkpoint.mesh.material.color.set(0x00ff00);
                checkpoint.mesh.material.opacity = 0.3;
                
                // Increment checkpoint counter
                gameState.checkpoints++;
                checkpointsElement.textContent = `Checkpoints: ${gameState.checkpoints}/${gameState.totalCheckpoints}`;
                
                // Check if all checkpoints are passed
                if (gameState.checkpoints === gameState.totalCheckpoints) {
                    // Allow finish line to trigger race completion
                    checkFinishLine();
                }
            }
        }
    });
}

// Check finish line crossing
function checkFinishLine() {
    if (!gameState.started || gameState.finished) return;
    
    // Only allow finish if all checkpoints are passed
    if (gameState.checkpoints === gameState.totalCheckpoints) {
        const finishPosition = currentCourse.finishPosition || { x: 0, z: -800 };
        const distance = Math.sqrt(
            Math.pow(racerGroup.position.x - finishPosition.x, 2) +
            Math.pow(racerGroup.position.z - finishPosition.z, 2)
        );
        
        if (distance < 10) {
            finishRace();
        }
    }
}

// Check for collision with obstacles
function checkObstacleCollisions() {
    if (!gameState.started || gameState.finished || obstacles.length === 0 || gameState.collisionCooldown > 0) return;
    
    obstacles.forEach(obstacle => {
        const distance = Math.sqrt(
            Math.pow(racerGroup.position.x - obstacle.position.x, 2) +
            Math.pow(racerGroup.position.z - obstacle.position.z, 2)
        );
        
        const collisionThreshold = obstacle.width / 2 + 1.5; // Racer width ~= 3
        
        if (distance < collisionThreshold) {
            // Collision with obstacle
            handleCollision(obstacle);
        }
    });
}

// Handle collision with obstacle
function handleCollision(obstacle) {
    // Slow down the racer
    physics.speed *= physics.collisionSlowdown;
    
    // Set collision cooldown to prevent multiple collisions
    gameState.collisionCooldown = physics.collisionRecoveryTime;
    
    // Visual feedback
    if (obstacle.mesh) {
        obstacle.mesh.material.emissiveIntensity = 1.0;
        // Reset after a short time
        setTimeout(() => {
            if (obstacle.mesh) {
                obstacle.mesh.material.emissiveIntensity = 0.5;
            }
        }, 300);
    }
    
    // Apply "bounce" effect
    racerGroup.position.z += physics.speed;
}

// Check for boundary collisions
function checkBoundaryCollisions() {
    if (!gameState.started || gameState.finished || gameState.collisionCooldown > 0) return;
    
    // Check if racer is outside the track boundaries
    if (Math.abs(racerGroup.position.x) > 14) {
        // Collision with boundary
        handleBoundaryCollision();
    }
}

// Handle collision with boundary
function handleBoundaryCollision() {
    // Slow down the racer
    physics.speed *= physics.boundarySlowdown;
    
    // Set collision cooldown
    gameState.collisionCooldown = physics.collisionRecoveryTime / 2;
    
    // Push racer back into bounds (track width/2 = 15)
    if (racerGroup.position.x > 14) {
        racerGroup.position.x = 14;
    } else if (racerGroup.position.x < -14) {
        racerGroup.position.x = -14;
    }
    
    // Apply boundary violation effects
    effectsManager.handleBoundaryViolation(racerGroup, gameState);
}

// Check for boost pad activation
function checkBoostPads() {
    if (!gameState.started || gameState.finished || boostPads.length === 0) return;
    
    boostPads.forEach(boostPad => {
        const distance = Math.sqrt(
            Math.pow(racerGroup.position.x - boostPad.position.x, 2) +
            Math.pow(racerGroup.position.z - boostPad.position.z, 2)
        );
        
        const activationThreshold = 7; // Approximate width of boost pad
        
        if (distance < activationThreshold && !physics.isBoost) {
            // Activate boost
            activateBoost();
            
            // Visual feedback on the boost pad
            if (boostPad.mesh) {
                const originalColor = boostPad.mesh.material.color.getHex();
                boostPad.mesh.material.color.set(0xffffff);
                // Reset after a short time
                setTimeout(() => {
                    if (boostPad.mesh) {
                        boostPad.mesh.material.color.setHex(originalColor);
                    }
                }, 300);
            }
        }
    });
}

// Activate boost
function activateBoost() {
    physics.isBoost = true;
    physics.boostTime = physics.maxBoostTime;
    
    // Apply immediate speed boost
    physics.speed += physics.boostAcceleration * 5;
    if (physics.speed > physics.boostSpeed) {
        physics.speed = physics.boostSpeed;
    }
}

// Finish the race
// Finish the race
function finishRace() {
    gameState.finished = true;
    gameState.raceEndTime = Date.now();
    gameState.currentTime = gameState.raceEndTime - gameState.raceStartTime;
    
    // Update timer display one last time
    timerElement.textContent = formatTime(gameState.currentTime);
    
    // Show save interface
    nameInput.style.display = 'block';
    saveTimeButton.style.display = 'block';
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = Date.now();
    
    // Update timer
    updateTimer();
    
    // Handle keyboard controls
    handleControls();
    
    // Update ship display
    shipConfig.updateDisplay(physics);
    
    // Update ship thrusters
    if (racerGroup) {
        shipConfig.updateThrust(racerGroup, physics);
    }
    
    // Check for collisions
    checkObstacleCollisions();
    checkBoundaryCollisions();
    
    // Update collision cooldown
    if (gameState.collisionCooldown > 0) {
        gameState.collisionCooldown--;
    }
    
    // Update boundary violation state
    effectsManager.updateBoundaryViolation(gameState, physics);
    
    // Check checkpoint collisions
    checkCheckpoints();
    
    // Check finish line
    checkFinishLine();
    
    // Check boost pads
    checkBoostPads();
    
    // Animate environment effects
    effectsManager.animateEnvironment(scene, currentTime);
    
    renderer.render(scene, camera);
}

// Handle keyboard controls
function handleControls() {
    if (!racerGroup || gameState.finished) return;
    
    const moveForward = keys.w || keys.ArrowUp;
    const moveBackward = keys.s || keys.ArrowDown;
    const moveLeft = keys.a || keys.ArrowLeft;
    const moveRight = keys.d || keys.ArrowRight;
    const boost = keys[' '];
    const brake = keys.s || keys.ArrowDown;
    
    // Update speed based on controls
    if (moveForward) {
        // Accelerate forward
        physics.speed += physics.acceleration;
        if (physics.speed > physics.maxSpeed) physics.speed = physics.maxSpeed;
    } else if (brake) {
        // Apply brakes
        physics.speed -= physics.brakingForce;
        if (physics.speed < -physics.maxSpeed / 2) physics.speed = -physics.maxSpeed / 2;
    } else {
        // Natural deceleration
        if (physics.speed > 0) {
            physics.speed -= physics.deceleration;
            if (physics.speed < 0) physics.speed = 0;
        } else if (physics.speed < 0) {
            physics.speed += physics.deceleration;
            if (physics.speed > 0) physics.speed = 0;
        }
    }
    
    // Handle boost
    if (boost && physics.boostCooldown === 0 && !physics.isBoost) {
        activateBoost();
    }
    
    if (physics.isBoost) {
        physics.boostTime--;
        if (physics.boostTime <= 0) {
            physics.isBoost = false;
            physics.boostCooldown = physics.maxBoostCooldown;
        }
    }
    
    if (physics.boostCooldown > 0) {
        physics.boostCooldown--;
    }
    
    // Apply boost speed cap
    const currentMaxSpeed = physics.isBoost ? physics.boostSpeed : physics.maxSpeed;
    if (physics.speed > currentMaxSpeed) physics.speed = currentMaxSpeed;
    
    // Handle turning
    if ((moveLeft || moveRight) && Math.abs(physics.speed) > 0.1) {
        // Apply slight slowdown when turning
        physics.speed *= (1 - physics.turnDrag);
    }
    
    // Move racer
    racerGroup.position.z -= physics.speed;
    
    // Turn racer
    if (moveLeft) {
        racerGroup.position.x -= physics.turnSpeed * physics.speed;
        racerGroup.rotation.z = Math.min(racerGroup.rotation.z + 0.05, 0.3);
    } else if (moveRight) {
        racerGroup.position.x += physics.turnSpeed * physics.speed;
        racerGroup.rotation.z = Math.max(racerGroup.rotation.z - 0.05, -0.3);
    } else {
        // Return to center rotation when not turning
        if (racerGroup.rotation.z > 0) {
            racerGroup.rotation.z -= 0.02;
            if (racerGroup.rotation.z < 0) racerGroup.rotation.z = 0;
        } else if (racerGroup.rotation.z < 0) {
            racerGroup.rotation.z += 0.02;
            if (racerGroup.rotation.z > 0) racerGroup.rotation.z = 0;
        }
    }
}

// Start the game
init();