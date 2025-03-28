// ship.js - Racer Ship Configuration
// This file contains all ship parameters and display settings

// Ship physics configuration
const shipPhysics = {
    // Speed parameters
    speed: 0,
    maxSpeed: 2,
    acceleration: 0.02,
    deceleration: 0.01,
    brakingForce: 0.04,    // How quickly the ship slows down when braking
    
    boundarySlowdown: 0.3,  // How much speed is retained when hitting boundary
    boundaryPenaltyTime: 45,  // Frames where speed is limited after boundary hit
    boundarySpeedLimit: 0.5,  // Max speed after boundary violation as fraction of normal

    // Turning parameters
    turnSpeed: 0.05,
    turnDrag: 0.02,        // How much turning slows the ship
    
    // Boost parameters
    boostSpeed: 3,
    boostAcceleration: 0.04,
    isBoost: false,
    boostTime: 0,
    maxBoostTime: 60,
    boostCooldown: 0,
    maxBoostCooldown: 180,
    
    // Collision parameters
    collisionSlowdown: 0.7,  // How much speed is retained after collision (0-1)
    collisionRecoveryTime: 30,  // Frames to recover from collision
    
    // Boundary parameters
    boundarySlowdown: 0.8,  // How much speed is retained when hitting boundary
    
    // Speed display conversion (for UI)
    speedDisplayMultiplier: 100  // Convert internal speed to km/h
};

// Ship visual configuration
const shipVisuals = {
    // Ship body
    bodyColor: 0xcccccc,
    bodyMetalness: 0.7,
    bodyRoughness: 0.3,
    
    // Ship wings
    wingsColor: 0x999999,
    wingsMetalness: 0.7,
    wingsRoughness: 0.3,
    
    // Engines
    engineColor: 0x555555,
    engineMetalness: 0.8,
    engineRoughness: 0.5,
    
    // Engine fire
    normalThrustColor: 0xff3300,
    boostThrustColor: 0x00ffff,
    
    // Ships models and dimensions
    bodyLength: 4,
    bodyWidth: 1.5,
    wingSpan: 4,
    wingThickness: 0.2,
    engineRadius: 0.4,
    thrustLength: 1.5
};

// Ship UI configuration
const shipUI = {
    // Speed display
    showSpeedometer: true,
    speedLabel: "Speed",
    speedUnit: "km/h",
    
    // Speed display colors
    normalSpeedColor: "#ffffff",
    mediumSpeedColor: "#33cc33",
    highSpeedColor: "#ff9900",
    boostSpeedColor: "#00ffff",
    
    // Speed thresholds for color changes
    mediumSpeedThreshold: 100,
    highSpeedThreshold: 150,
    
    // Display configuration
    speedFontSize: "20px",
    speedFontWeight: "bold"
};

// Function to create ship display elements
function createShipDisplay() {
    if (shipUI.showSpeedometer) {
        const speedDisplay = document.createElement('div');
        speedDisplay.id = 'speed-display';
        speedDisplay.style.fontSize = shipUI.speedFontSize;
        speedDisplay.style.fontWeight = shipUI.speedFontWeight;
        speedDisplay.style.marginBottom = '10px';
        speedDisplay.textContent = `${shipUI.speedLabel}: 0 ${shipUI.speedUnit}`;
        
        // Insert before instructions
        document.querySelector('#ui').insertBefore(
            speedDisplay, 
            document.querySelector('#instructions')
        );
    }
}

// Function to update ship display
function updateShipDisplay(physics) {
    const speedDisplay = document.getElementById('speed-display');
    if (!speedDisplay) return;
    
    // Calculate display speed
    const speedValue = Math.round(physics.speed * shipPhysics.speedDisplayMultiplier);
    
    // Set color based on speed
    let color = shipUI.normalSpeedColor;
    
    if (physics.isBoost) {
        color = shipUI.boostSpeedColor;
    } else if (speedValue > shipUI.highSpeedThreshold) {
        color = shipUI.highSpeedColor;
    } else if (speedValue > shipUI.mediumSpeedThreshold) {
        color = shipUI.mediumSpeedColor;
    }
    
    speedDisplay.style.color = color;
    speedDisplay.textContent = `${shipUI.speedLabel}: ${speedValue} ${shipUI.speedUnit}`;
}

// Function to create ship 3D model
function createShipModel() {
    const shipGroup = new THREE.Group();
    
    // Main triangular body
    const bodyGeometry = new THREE.ConeGeometry(
        shipVisuals.bodyWidth, 
        shipVisuals.bodyLength, 
        3
    );
    bodyGeometry.rotateX(Math.PI / 2); // Point forward
    
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: shipVisuals.bodyColor,
        roughness: shipVisuals.bodyRoughness,
        metalness: shipVisuals.bodyMetalness,
        // Add environment map for reflection if available
        envMap: getCubeMap()
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, -1); // Center and move slightly forward
    shipGroup.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(
        shipVisuals.wingSpan, 
        shipVisuals.wingThickness, 
        1
    );
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: shipVisuals.wingsColor,
        roughness: shipVisuals.wingsRoughness,
        metalness: shipVisuals.wingsMetalness
    });
    
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, -0.5, 0);
    shipGroup.add(wings);
    
    // Engine thrusters
    const engine1Geometry = new THREE.CylinderGeometry(
        shipVisuals.engineRadius, 
        shipVisuals.engineRadius + 0.1, 
        1.5, 
        8
    );
    const engineMaterial = new THREE.MeshStandardMaterial({
        color: shipVisuals.engineColor,
        roughness: shipVisuals.engineRoughness,
        metalness: shipVisuals.engineMetalness
    });
    
    const engine1 = new THREE.Mesh(engine1Geometry, engineMaterial);
    engine1.position.set(-shipVisuals.wingSpan/2 + 0.5, -0.5, 0);
    engine1.rotation.z = Math.PI / 2;
    shipGroup.add(engine1);
    
    const engine2 = engine1.clone();
    engine2.position.set(shipVisuals.wingSpan/2 - 0.5, -0.5, 0);
    shipGroup.add(engine2);
    
    // Engine fire
    const engineFireMaterial = new THREE.MeshBasicMaterial({
        color: shipVisuals.normalThrustColor
    });
    
    const engineFire1 = new THREE.Mesh(
        new THREE.ConeGeometry(shipVisuals.engineRadius, shipVisuals.thrustLength, 8), 
        engineFireMaterial
    );
    engineFire1.position.set(-shipVisuals.wingSpan/2 + 0.5 - 1, -0.5, 0);
    engineFire1.rotation.z = -Math.PI / 2;
    shipGroup.add(engineFire1);
    
    const engineFire2 = engineFire1.clone();
    engineFire2.position.set(shipVisuals.wingSpan/2 - 0.5 + 1, -0.5, 0);
    shipGroup.add(engineFire2);
    
    // Store references to engine fires for animation
    shipGroup.userData.engineFire1 = engineFire1;
    shipGroup.userData.engineFire2 = engineFire2;
    
    return shipGroup;
}

// Function to update ship thrust effects
function updateShipThrust(shipGroup, physics) {
    if (!shipGroup) return;
    
    const engineFire1 = shipGroup.userData.engineFire1;
    const engineFire2 = shipGroup.userData.engineFire2;
    
    if (!engineFire1 || !engineFire2) return;
    
    // Update engine fire color based on boost
    if (physics.isBoost) {
        engineFire1.material.color.set(shipVisuals.boostThrustColor);
        engineFire2.material.color.set(shipVisuals.boostThrustColor);
    } else {
        engineFire1.material.color.set(shipVisuals.normalThrustColor);
        engineFire2.material.color.set(shipVisuals.normalThrustColor);
    }
    
    // Update engine fire size based on speed
    const fireScale = 0.5 + physics.speed / physics.maxSpeed;
    engineFire1.scale.set(fireScale, 1 + fireScale, fireScale);
    engineFire2.scale.set(fireScale, 1 + fireScale, fireScale);
}

// Helper function to get environment cube map if available
function getCubeMap() {
    try {
        return new THREE.CubeTextureLoader().load([
            'https://threejs.org/examples/textures/cube/skybox/px.jpg',
            'https://threejs.org/examples/textures/cube/skybox/nx.jpg',
            'https://threejs.org/examples/textures/cube/skybox/py.jpg',
            'https://threejs.org/examples/textures/cube/skybox/ny.jpg',
            'https://threejs.org/examples/textures/cube/skybox/pz.jpg',
            'https://threejs.org/examples/textures/cube/skybox/nz.jpg'
        ]);
    } catch (e) {
        console.warn('Could not load environment map', e);
        return null;
    }
}

// Export configuration
const shipConfig = {
    physics: shipPhysics,
    visuals: shipVisuals,
    ui: shipUI,
    createDisplay: createShipDisplay,
    updateDisplay: updateShipDisplay,
    createModel: createShipModel,
    updateThrust: updateShipThrust
};