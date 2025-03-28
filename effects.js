// effects.js - Visual effects and cosmetic elements for the racing game

// Particle system configuration
const particleEffects = {
    // Background star field
    stars: {
        count: 2000,
        size: 0.5,
        spread: {
            x: 100,
            y: 100,
            z: 1000
        },
        colors: "rainbow",
        blending: THREE.AdditiveBlending,
        speedFactor: 0.0005
    },
    
    // Engine thrust
    engineThrust: {
        normalColor: 0xff3300,
        boostColor: 0x00ffff,
        pulseSpeed: 0.1,
        pulseIntensity: 0.2
    },
    
    // Collision effect
    collision: {
        flashColor: 0xff0000,
        flashDuration: 300,
        particles: {
            count: 15,
            size: 0.3,
            speed: 0.5,
            duration: 500,
            color: 0xff5500
        }
    },
    
    // Checkpoint effect
    checkpoint: {
        passedColor: 0x00ff00,
        pendingColor: 0x00ffff,
        pulseSpeed: 0.02,
        opacity: {
            active: 0.7,
            passed: 0.3
        }
    },
    
    // Boost pad effect
    boostPad: {
        color: 0x00ffff,
        glowColor: 0xffffff,
        pulseSpeed: 0.05,
        opacity: 0.7,
        width: 15
    },
    
    // Finish line effect
    finishLine: {
        particleCount: 50,
        particleSize: 0.7,
        particleColors: [0xffffff, 0xffff00, 0x00ffff],
        confettiDuration: 2000
    }
};

// Environment effects
const environmentEffects = {
    // Course boundary effects
    boundary: {
        wallHeight: 5,
        wallOpacity: 0.2,
        warningLineWidth: 0.5,
        warningLineColor: 0xff0000,
        warningLineSpacing: 4
    },
    
    // Centerpiece animation
    centerpiece: {
        rotationSpeed: 0.01,
        bobSpeed: 0.001,
        bobAmount: 0.03,
        colorShiftSpeed: 0.005
    },
    
    // Floor effects
    floor: {
        colorShiftSpeed: 0.001,
        glowIntensity: 0.3
    },
    
    // Lighting effects
    lighting: {
        pulseSpeed: 0.002,
        pulseIntensity: 0.2,
        colorChangeSpeed: 0.01
    },
    
    // Fog effects
    fog: {
        densityChange: 0.0001,
        minDensity: 0.01,
        maxDensity: 0.03
    }
};

// Sound effect placeholders (for future implementation)
const soundEffects = {
    engine: {
        normalPitch: 1.0,
        boostPitch: 1.5,
        volumeRange: [0.2, 0.8]
    },
    collision: {
        volume: 0.7,
        pitch: 1.0
    },
    checkpoint: {
        volume: 0.5,
        pitch: 1.2
    },
    boost: {
        volume: 0.8,
        pitch: 1.3
    },
    boundary: {
        volume: 0.6,
        pitch: 0.8
    },
    finish: {
        volume: 1.0,
        pitch: 1.0
    }
};

// Creates star field particles
function createStarField() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = particleEffects.stars.count;
    
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);
    
    // Rainbow colors array for stars
    const starColors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8a2be2, 0xff00ff];
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        // Position
        posArray[i] = (Math.random() - 0.5) * particleEffects.stars.spread.x;
        posArray[i + 1] = (Math.random() - 0.5) * particleEffects.stars.spread.y;
        posArray[i + 2] = (Math.random() - 0.5) * particleEffects.stars.spread.z;
        
        // Color
        const colorIndex = Math.floor(Math.random() * starColors.length);
        const color = new THREE.Color(starColors[colorIndex]);
        colorArray[i] = color.r;
        colorArray[i + 1] = color.g;
        colorArray[i + 2] = color.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        size: particleEffects.stars.size,
        vertexColors: true,
        transparent: true,
        blending: particleEffects.stars.blending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    particlesMesh.userData.courseElement = true;
    particlesMesh.userData.effectType = 'starField';
    
    return particlesMesh;
}

// Creates boundary walls for the course
function createBoundaryWalls(trackWidth = 30, trackLength = 1000) {
    const wallGroup = new THREE.Group();
    wallGroup.userData.courseElement = true;
    
    // Calculate dimensions
    const halfWidth = trackWidth / 2;
    const wallHeight = environmentEffects.boundary.wallHeight;
    
    // Create left and right walls
    const wallGeometry = new THREE.BoxGeometry(0.5, wallHeight, trackLength);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: environmentEffects.boundary.wallOpacity,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
    });
    
    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-halfWidth - 0.25, wallHeight / 2 - 1, -trackLength / 2);
    wallGroup.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(halfWidth + 0.25, wallHeight / 2 - 1, -trackLength / 2);
    wallGroup.add(rightWall);
    
    // Create warning stripes on the track edges
    const stripeCount = Math.floor(trackLength / environmentEffects.boundary.warningLineSpacing);
    const stripeGeometry = new THREE.BoxGeometry(
        environmentEffects.boundary.warningLineWidth, 
        0.1, 
        environmentEffects.boundary.warningLineSpacing / 2
    );
    const stripeMaterial = new THREE.MeshBasicMaterial({
        color: environmentEffects.boundary.warningLineColor,
        emissive: environmentEffects.boundary.warningLineColor,
        emissiveIntensity: 0.5
    });
    
    // Create stripes along track edges
    for (let i = 0; i < stripeCount; i++) {
        // Left side stripes
        const leftStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        leftStripe.position.set(
            -halfWidth + environmentEffects.boundary.warningLineWidth/2, 
            -0.9, 
            -i * environmentEffects.boundary.warningLineSpacing
        );
        wallGroup.add(leftStripe);
        
        // Right side stripes
        const rightStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        rightStripe.position.set(
            halfWidth - environmentEffects.boundary.warningLineWidth/2, 
            -0.9, 
            -i * environmentEffects.boundary.warningLineSpacing
        );
        wallGroup.add(rightStripe);
    }
    
    return wallGroup;
}

// Create a visual effect for collision
function createCollisionEffect(position) {
    // Flash effect for the object that was hit
    if (position.mesh) {
        const originalColor = position.mesh.material.color.getHex();
        const originalEmissive = position.mesh.material.emissiveIntensity || 0;
        
        position.mesh.material.color.set(particleEffects.collision.flashColor);
        if (position.mesh.material.emissiveIntensity !== undefined) {
            position.mesh.material.emissiveIntensity = 1.0;
        }
        
        // Reset after flash duration
        setTimeout(() => {
            if (position.mesh) {
                position.mesh.material.color.setHex(originalColor);
                if (position.mesh.material.emissiveIntensity !== undefined) {
                    position.mesh.material.emissiveIntensity = originalEmissive;
                }
            }
        }, particleEffects.collision.flashDuration);
    }
    
    // For future: add particle burst effect at collision point
}

// Create boost activation effect
function createBoostEffect(ship) {
    // For future: add particle trail behind the ship during boost
}

// Animate environment effects
function animateEnvironment(scene, time) {
    scene.traverse(object => {
        if (object.userData.effectType === 'starField') {
            // Animate star field rotation
            object.rotation.y += particleEffects.stars.speedFactor;
        } else if (object.userData.rotationSpeed) {
            // Animate centerpiece
            object.rotation.y += environmentEffects.centerpiece.rotationSpeed;
            object.position.y += Math.sin(time * environmentEffects.centerpiece.bobSpeed) * 
                                 environmentEffects.centerpiece.bobAmount;
        }
    });
}

// Handle boundary violation effects
function handleBoundaryViolation(ship, gameState) {
    // Visual indication of boundary violation
    if (ship) {
        // Flash the ship red briefly
        const bodyMaterial = ship.children.find(child => 
            child.userData && child.userData.type === 'body'
        )?.material;
        
        if (bodyMaterial) {
            const originalColor = bodyMaterial.color.getHex();
            bodyMaterial.color.set(particleEffects.collision.flashColor);
            
            setTimeout(() => {
                bodyMaterial.color.setHex(originalColor);
            }, particleEffects.collision.flashDuration);
        }
    }
    
    // Set boundary penalty
    gameState.boundaryViolation = true;
    gameState.boundaryPenaltyTime = ship.physics.boundaryPenaltyTime;
    
    // For future: add sound effect
}

// Update boundary violation state
function updateBoundaryViolation(gameState, physics) {
    if (gameState.boundaryViolation) {
        if (gameState.boundaryPenaltyTime > 0) {
            gameState.boundaryPenaltyTime--;
            
            // Limit max speed during penalty
            const maxAllowedSpeed = physics.maxSpeed * physics.boundarySpeedLimit;
            if (physics.speed > maxAllowedSpeed) {
                physics.speed = maxAllowedSpeed;
            }
        } else {
            // Penalty time expired
            gameState.boundaryViolation = false;
        }
    }
}

// Export effects module
const effectsManager = {
    particle: particleEffects,
    environment: environmentEffects,
    sound: soundEffects,
    createStarField,
    createBoundaryWalls,
    createCollisionEffect,
    createBoostEffect,
    animateEnvironment,
    handleBoundaryViolation,
    updateBoundaryViolation
};