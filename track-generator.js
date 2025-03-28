// track-generator.js
// Generates 3D track segments according to course definition

class TrackGenerator {
    constructor(scene, colorSchemes) {
        this.scene = scene;
        this.colorSchemes = colorSchemes;
        this.trackElements = [];
    }
    
    // Generate a complete track from course data
    generateTrack(courseData) {
        // Clear any existing track
        this.clearTrack();
        
        // Calculate the complete path
        const trackPath = this.calculateTrackPath(courseData.segments);
        
        // Create the actual track geometry based on the path
        this.createTrackFromPath(trackPath, courseData.segments);
        
        // Create checkpoints
        this.createCheckpoints(courseData.checkpoints);
        
        // Create finish line at the end of track
        this.createFinishLine(courseData.finishPosition || trackPath[trackPath.length - 1].position);
        
        // Return the computed path for other functions to use
        return trackPath;
    }
    
    // Clear any existing track elements
    clearTrack() {
        this.trackElements.forEach(element => {
            this.scene.remove(element);
            if (element.geometry) element.geometry.dispose();
            if (element.material) {
                if (Array.isArray(element.material)) {
                    element.material.forEach(mat => mat.dispose());
                } else {
                    element.material.dispose();
                }
            }
        });
        
        this.trackElements = [];
    }
    
    // Calculate the complete 3D path of the track from segment definitions
    calculateTrackPath(segments) {
        const path = [];
        
        // Start position
        let currentPosition = new THREE.Vector3(0, 0, 0);
        let currentDirection = new THREE.Vector3(0, 0, -1); // Moving forward along negative Z
        
        path.push({
            position: currentPosition.clone(),
            direction: currentDirection.clone(),
            segment: null
        });
        
        segments.forEach((segment, index) => {
            let segmentPath;
            
            switch (segment.type) {
                case 'straight':
                    segmentPath = this.calculateStraightSegment(
                        currentPosition, 
                        currentDirection, 
                        segment.length,
                        segment
                    );
                    break;
                    
                case 'turn':
                    segmentPath = this.calculateTurnSegment(
                        currentPosition, 
                        currentDirection, 
                        segment.radius, 
                        segment.angle, 
                        segment.direction,
                        segment
                    );
                    break;
                    
                case 'finish':
                    segmentPath = this.calculateStraightSegment(
                        currentPosition, 
                        currentDirection, 
                        segment.length,
                        segment
                    );
                    break;
                    
                default:
                    console.warn(`Unknown segment type: ${segment.type}`);
                    segmentPath = {
                        path: [],
                        endPosition: currentPosition,
                        endDirection: currentDirection
                    };
            }
            
            // Add points to the main path
            segmentPath.path.forEach(point => {
                path.push(point);
            });
            
            // Update current position and direction for next segment
            currentPosition = segmentPath.endPosition;
            currentDirection = segmentPath.endDirection;
        });
        
        return path;
    }
    
    // Calculate path points for a straight segment
    calculateStraightSegment(startPosition, direction, length, segment) {
        const path = [];
        const steps = Math.max(Math.floor(length / 10), 2); // One point every 10 units, minimum 2 points
        
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const position = startPosition.clone().add(
                direction.clone().multiplyScalar(length * t)
            );
            
            path.push({
                position: position,
                direction: direction.clone(),
                segment: segment
            });
        }
        
        const endPosition = startPosition.clone().add(
            direction.clone().multiplyScalar(length)
        );
        
        return {
            path: path,
            endPosition: endPosition,
            endDirection: direction.clone()
        };
    }
    
    // Calculate path points for a turn segment
    calculateTurnSegment(startPosition, startDirection, radius, angle, turnDirection, segment) {
        const path = [];
        const steps = Math.max(Math.floor(angle / 5), 2); // One point every 5 degrees, minimum 2 points
        
        // Calculate turn center
        // For a right turn, the center is to the right of the current direction
        // For a left turn, the center is to the left
        const perpendicular = new THREE.Vector3().crossVectors(
            startDirection, 
            new THREE.Vector3(0, 1, 0)
        ).normalize();
        
        if (turnDirection === 'left') {
            perpendicular.multiplyScalar(-1);
        }
        
        const center = startPosition.clone().add(
            perpendicular.clone().multiplyScalar(radius)
        );
        
        // Calculate start angle based on current direction
        const startAngle = Math.atan2(
            startPosition.x - center.x,
            startPosition.z - center.z
        );
        
        // Convert degrees to radians
        const angleRadians = (angle * Math.PI) / 180;
        
        // Determine direction of rotation
        const rotationSign = (turnDirection === 'left') ? 1 : -1;
        
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const currentAngle = startAngle + (rotationSign * angleRadians * t);
            
            // Calculate position on the arc
            const x = center.x + radius * Math.sin(currentAngle);
            const z = center.z + radius * Math.cos(currentAngle);
            const position = new THREE.Vector3(x, startPosition.y, z);
            
            // Calculate tangent direction at this point
            // Tangent to a circle is perpendicular to the radius
            const tangentAngle = currentAngle + (Math.PI / 2 * rotationSign);
            const direction = new THREE.Vector3(
                Math.sin(tangentAngle),
                0,
                Math.cos(tangentAngle)
            ).normalize();
            
            path.push({
                position: position,
                direction: direction,
                segment: segment
            });
        }
        
        // Calculate final direction
        const endAngle = startAngle + (rotationSign * angleRadians);
        const tangentAngle = endAngle + (Math.PI / 2 * rotationSign);
        const endDirection = new THREE.Vector3(
            Math.sin(tangentAngle),
            0,
            Math.cos(tangentAngle)
        ).normalize();
        
        // Calculate end position
        const endPosition = new THREE.Vector3(
            center.x + radius * Math.sin(endAngle),
            startPosition.y,
            center.z + radius * Math.cos(endAngle)
        );
        
        return {
            path: path,
            endPosition: endPosition,
            endDirection: endDirection
        };
    }
    
    // Create the actual 3D track geometry from the calculated path
    createTrackFromPath(path, segments) {
        // Create track segments
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            
            // Find all path points for this segment
            const segmentPoints = path.filter(p => p.segment === segment);
            if (segmentPoints.length === 0) continue;
            
            // Create the appropriate track segment
            switch (segment.type) {
                case 'straight':
                case 'finish':
                    this.createStraightSegment(segmentPoints, segment);
                    break;
                    
                case 'turn':
                    this.createTurnSegment(segmentPoints, segment);
                    break;
                    
                default:
                    console.warn(`Unknown segment type for rendering: ${segment.type}`);
            }
            
            // Add decorations
            this.addTrackDecorations(segmentPoints, segment);
            
            // Add obstacles if defined
            if (segment.obstacles && segment.obstacles.length > 0) {
                this.addObstacles(segmentPoints, segment.obstacles);
            }
            
            // Add boost pads if defined
            if (segment.boost && segment.boost.length > 0) {
                this.addBoostPads(segmentPoints, segment.boost);
            }
        }
        
        // Add boundary walls along the entire path
        this.addBoundaryWalls(path);
    }
    
    // Create straight track segment
    createStraightSegment(pathPoints, segment) {
        const width = segment.width || 30;
        
        if (pathPoints.length < 2) return;
        
        const first = pathPoints[0];
        const last = pathPoints[pathPoints.length - 1];
        
        const length = first.position.distanceTo(last.position);
        
        // Create the road surface
        const geometry = new THREE.PlaneGeometry(width, length, 10, Math.ceil(length / 10));
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.1,
            metalness: 0.8
        });
        
        // Apply colors
        const colors = [];
        const colorScheme = this.colorSchemes[segment.colorScheme] || this.colorSchemes.rainbow1;
        
        for (let i = 0; i < geometry.attributes.position.count; i++) {
            const v = geometry.attributes.position.getY(i) / length + 0.5; // Normalize to 0-1
            const colorIndex = Math.floor(v * colorScheme.length) % colorScheme.length;
            const color = new THREE.Color(colorScheme[colorIndex]);
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Calculate center position and orientation
        const position = new THREE.Vector3().addVectors(
            first.position,
            last.position
        ).multiplyScalar(0.5);
        
        const road = new THREE.Mesh(geometry, material);
        road.position.copy(position);
        
        // Look at the end point to orient the road
        const target = new THREE.Object3D();
        target.position.copy(last.position);
        road.lookAt(target.position);
        
        // Rotate to make it flat (plane is XY by default, we want XZ)
        road.rotation.x = -Math.PI / 2;
        
        road.userData.courseElement = true;
        this.trackElements.push(road);
        this.scene.add(road);
    }
    
    // Create turn track segment
    createTurnSegment(pathPoints, segment) {
        if (pathPoints.length < 2) return;
        
        const width = segment.width || 30;
        
        // Create a curve from the path points
        const points = pathPoints.map(p => p.position);
        const curve = new THREE.CatmullRomCurve3(points);
        
        // Create the track as a tube following the curve
        const geometry = new THREE.TubeGeometry(
            curve,
            Math.max(pathPoints.length * 2, 12), // segments
            width / 2, // tube radius (half the track width)
            12, // radial segments
            false // closed
        );
        
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.1,
            metalness: 0.8
        });
        
        // Apply colors
        const colors = [];
        const colorScheme = this.colorSchemes[segment.colorScheme] || this.colorSchemes.rainbow1;
        
        for (let i = 0; i < geometry.attributes.position.count; i++) {
            // For tube geometry, use the u coordinate to map colors along the track
            const u = (i % (12 + 1)) / 12; // Radial segments + 1
            const colorIndex = Math.floor(u * colorScheme.length) % colorScheme.length;
            const color = new THREE.Color(colorScheme[colorIndex]);
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const track = new THREE.Mesh(geometry, material);
        track.userData.courseElement = true;
        this.trackElements.push(track);
        this.scene.add(track);
    }
    
    // Add boundary walls along the track path
    addBoundaryWalls(path) {
        const wallHeight = effectsManager.environment.boundary.wallHeight;
        const wallOpacity = effectsManager.environment.boundary.wallOpacity;
        
        // Create two walls (left and right side)
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: wallOpacity,
            emissive: 0xffffff,
            emissiveIntensity: 0.3
        });
        
        // For each segment of the path, create wall segments
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            
            if (!curr.segment) continue;
            
            const width = curr.segment.width || 30;
            const halfWidth = width / 2;
            
            // Get direction from previous to current
            const direction = new THREE.Vector3().subVectors(
                curr.position,
                prev.position
            ).normalize();
            
            // Get perpendicular direction (for left/right walls)
            const perpendicular = new THREE.Vector3().crossVectors(
                direction,
                new THREE.Vector3(0, 1, 0)
            ).normalize();
            
            // Calculate length of this wall segment
            const length = prev.position.distanceTo(curr.position);
            
            // Create left wall
            this.createWallSegment(
                prev.position.clone().add(perpendicular.clone().multiplyScalar(-halfWidth)),
                curr.position.clone().add(perpendicular.clone().multiplyScalar(-halfWidth)),
                wallHeight,
                wallMaterial
            );
            
            // Create right wall
            this.createWallSegment(
                prev.position.clone().add(perpendicular.clone().multiplyScalar(halfWidth)),
                curr.position.clone().add(perpendicular.clone().multiplyScalar(halfWidth)),
                wallHeight,
                wallMaterial
            );
            
            // Add warning stripes on the track edges
            this.createWarningStripes(
                prev.position, curr.position, 
                perpendicular, halfWidth, 
                length
            );
        }
    }
    
    // Create a single wall segment between two points
    createWallSegment(start, end, height, material) {
        // Calculate direction and length
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();
        
        // Create wall geometry
        const geometry = new THREE.BoxGeometry(0.5, height, length);
        const wall = new THREE.Mesh(geometry, material);
        
        // Position at the midpoint
        const midpoint = new THREE.Vector3().addVectors(
            start,
            end
        ).multiplyScalar(0.5);
        
        wall.position.set(midpoint.x, midpoint.y + height/2, midpoint.z);
        
        // Orient the wall
        wall.lookAt(end);
        wall.rotateY(Math.PI / 2); // Adjust for box orientation
        
        wall.userData.courseElement = true;
        this.trackElements.push(wall);
        this.scene.add(wall);
    }
    
    // Create warning stripes along the track edges
    createWarningStripes(start, end, perpendicular, halfWidth, length) {
        const stripeWidth = effectsManager.environment.boundary.warningLineWidth;
        const stripeSpacing = effectsManager.environment.boundary.warningLineSpacing;
        const stripeColor = effectsManager.environment.boundary.warningLineColor;
        
        const stripeMaterial = new THREE.MeshBasicMaterial({
            color: stripeColor,
            emissive: stripeColor,
            emissiveIntensity: 0.5
        });
        
        // Direction from start to end
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        
        // Calculate how many stripes will fit
        const stripeCount = Math.floor(length / stripeSpacing);
        
        for (let i = 0; i < stripeCount; i++) {
            // Calculate position along the segment
            const t = i / stripeCount;
            const position = start.clone().add(direction.clone().multiplyScalar(t * length));
            
            // Create left stripe
            const leftPosition = position.clone().add(
                perpendicular.clone().multiplyScalar(-halfWidth + stripeWidth/2)
            );
            this.createStripe(leftPosition, direction, stripeWidth, stripeMaterial);
            
            // Create right stripe
            const rightPosition = position.clone().add(
                perpendicular.clone().multiplyScalar(halfWidth - stripeWidth/2)
            );
            this.createStripe(rightPosition, direction, stripeWidth, stripeMaterial);
        }
    }
    
    // Create a single warning stripe
    createStripe(position, direction, width, material) {
        const stripeLength = effectsManager.environment.boundary.warningLineSpacing / 2;
        
        const geometry = new THREE.BoxGeometry(width, 0.1, stripeLength);
        const stripe = new THREE.Mesh(geometry, material);
        
        stripe.position.set(position.x, position.y - 0.9, position.z);
        
        // Orient the stripe
        stripe.lookAt(position.clone().add(direction));
        
        stripe.userData.courseElement = true;
        this.trackElements.push(stripe);
        this.scene.add(stripe);
    }
    
    // Add decorative elements along the track segment
    addTrackDecorations(pathPoints, segment) {
        if (pathPoints.length < 2) return;
        
        const decorationType = segment.decoration || 'cones';
        const width = segment.width || 30;
        const halfWidth = width / 2;
        
        // Get the colorScheme for this segment
        const colorScheme = this.colorSchemes[segment.colorScheme] || this.colorSchemes.rainbow1;
        
        // Space decorations evenly along the path
        const spacing = 20; // units between decorations
        
        // Calculate total path length
        let totalLength = 0;
        for (let i = 1; i < pathPoints.length; i++) {
            totalLength += pathPoints[i].position.distanceTo(pathPoints[i-1].position);
        }
        
        // Calculate number of decorations
        const decorationCount = Math.max(2, Math.floor(totalLength / spacing));
        
        for (let i = 0; i < decorationCount; i++) {
            const t = i / (decorationCount - 1); // 0 to 1
            
            // Find the point along the path
            const point = this.getPointAlongPath(pathPoints, t);
            
            // Add decorations on both sides of the track
            // Get perpendicular direction to place decorations on sides
            const perpendicular = new THREE.Vector3().crossVectors(
                point.direction,
                new THREE.Vector3(0, 1, 0)
            ).normalize();
            
            // Left side decoration
            const leftPos = point.position.clone().add(
                perpendicular.clone().multiplyScalar(-halfWidth + 2)
            );
            this.createDecoration(leftPos, point.direction, decorationType, colorScheme, i);
            
            // Right side decoration
            const rightPos = point.position.clone().add(
                perpendicular.clone().multiplyScalar(halfWidth - 2)
            );
            this.createDecoration(rightPos, point.direction, decorationType, colorScheme, i);
        }
    }
    
    // Find a point at a specific percentage along the path
    getPointAlongPath(points, t) {
        if (points.length < 2) return points[0];
        if (t <= 0) return points[0];
        if (t >= 1) return points[points.length - 1];
        
        // Calculate total length
        let totalLength = 0;
        const segmentLengths = [];
        
        for (let i = 1; i < points.length; i++) {
            const length = points[i].position.distanceTo(points[i-1].position);
            segmentLengths.push(length);
            totalLength += length;
        }
        
        // Find the target distance along the path
        const targetDistance = totalLength * t;
        
        // Find which segment contains this point
        let currentDist = 0;
        for (let i = 0; i < segmentLengths.length; i++) {
            if (currentDist + segmentLengths[i] >= targetDistance) {
                // Found the segment
                const segmentT = (targetDistance - currentDist) / segmentLengths[i];
                
                // Interpolate position
                const pos = new THREE.Vector3().lerpVectors(
                    points[i].position,
                    points[i+1].position,
                    segmentT
                );
                
                // Interpolate direction
                const dir = new THREE.Vector3().lerpVectors(
                    points[i].direction,
                    points[i+1].direction,
                    segmentT
                ).normalize();
                
                return { position: pos, direction: dir };
            }
            currentDist += segmentLengths[i];
        }
        
        // Fallback
        return points[points.length - 1];
    }
    
    // Create a decoration element (cone, pillar, etc.)
    createDecoration(position, direction, type, colorScheme, index) {
        let decoration;
        
        switch (type) {
            case 'cones':
                decoration = this.createCone(position, colorScheme, 10 + Math.sin(index * 0.2) * 3);
                break;
                
            case 'pillars':
                decoration = this.createPillar(position, colorScheme, 15 + Math.sin(index * 0.3) * 5);
                break;
                
            case 'crystals':
                decoration = this.createCrystal(position, colorScheme, 8 + Math.sin(index * 0.4) * 4);
                break;
                
            case 'neon_lines':
                decoration = this.createNeonLine(position, direction, colorScheme, 8 + Math.cos(index * 0.2) * 3);
                break;
                
            case 'energy_rings':
                decoration = this.createEnergyRing(position, direction, colorScheme, 6 + Math.sin(index * 0.5) * 2);
                break;
                
            default:
                decoration = this.createCone(position, colorScheme, 10);
        }
        
        if (decoration) {
            decoration.userData.courseElement = true;
            this.trackElements.push(decoration);
            this.scene.add(decoration);
        }
    }
    
    // Create a cone decoration
    createCone(position, colorScheme, height) {
        const geometry = new THREE.ConeGeometry(2, height, 3);
        const colors = [];
        
        // Apply rainbow colors in segments
        for (let i = 0; i < geometry.attributes.position.count; i++) {
            const y = geometry.attributes.position.getY(i);
            const segment = Math.floor(((y / height) + 0.5) * colorScheme.length) % colorScheme.length;
            const color = new THREE.Color(colorScheme[segment]);
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.1,
            metalness: 0.8
        });
        
        const cone = new THREE.Mesh(geometry, material);
        cone.position.copy(position);
        cone.rotation.x = Math.PI; // Point upward
        
        return cone;
    }
    
    // Create a pillar decoration
    createPillar(position, colorScheme, height) {
        const geometry = new THREE.BoxGeometry(3, height, 3);
        const colors = [];
        
        // Apply colors in segments
        for (let i = 0; i < geometry.attributes.position.count; i++) {
            const y = geometry.attributes.position.getY(i);
            const segment = Math.floor(((y / height) + 0.5) * colorScheme.length) % colorScheme.length;
            const color = new THREE.Color(colorScheme[segment]);
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.2,
            metalness: 0.7
        });
        
        const pillar = new THREE.Mesh(geometry, material);
        pillar.position.set(position.x, position.y + height/2, position.z);
        
        return pillar;
    }
    
    // Create a crystal decoration
    createCrystal(position, colorScheme, height) {
        // Create a more complex crystal-like shape
        const geometry = new THREE.OctahedronGeometry(height / 3, 0);
        
        // Apply uniform color from the color scheme
        const colorIndex = Math.floor(Math.random() * colorScheme.length);
        const material = new THREE.MeshStandardMaterial({
            color: colorScheme[colorIndex],
            roughness: 0.1,
            metalness: 1.0,
            transparent: true,
            opacity: 0.8,
            emissive: colorScheme[colorIndex],
            emissiveIntensity: 0.3
        });
        
        const crystal = new THREE.Mesh(geometry, material);
        crystal.position.set(position.x, position.y + height/2, position.z);
        crystal.scale.y = 3; // Make it taller
        crystal.rotation.y = Math.random() * Math.PI; // Random rotation
        
        return crystal;
    }
    
    // Create a neon line decoration
    createNeonLine(position, direction, colorScheme, height) {
        const geometry = new THREE.CylinderGeometry(0.2, 0.2, height, 6, 1);
        
        // Random color from the scheme
        const colorIndex = Math.floor(Math.random() * colorScheme.length);
        const material = new THREE.MeshBasicMaterial({
            color: colorScheme[colorIndex],
            emissive: colorScheme[colorIndex],
            emissiveIntensity: 1.0
        });
        
        const line = new THREE.Mesh(geometry, material);
        line.position.set(position.x, position.y + height/2, position.z);
        
        return line;
    }
    
    // Create an energy ring decoration
    createEnergyRing(position, direction, colorScheme, radius) {
        const geometry = new THREE.TorusGeometry(radius, 0.5, 8, 24);
        
        // Random color from the scheme
        const colorIndex = Math.floor(Math.random() * colorScheme.length);
        const material = new THREE.MeshBasicMaterial({
            color: colorScheme[colorIndex],
            transparent: true,
            opacity: 0.7,
            emissive: colorScheme[colorIndex],
            emissiveIntensity: 0.5
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        
        // Orient perpendicular to track
        const upVector = new THREE.Vector3(0, 1, 0);
        const sideVector = new THREE.Vector3().crossVectors(direction, upVector).normalize();
        
        // Rotate ring to face the track
        ring.lookAt(position.clone().add(sideVector));
        
        return ring;
    }
    
    // Add obstacles to the track
    addObstacles(pathPoints, obstacles) {
        obstacles.forEach(obstacle => {
            const barrierGeometry = new THREE.BoxGeometry(obstacle.width, 5, 2);
            const barrierMaterial = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                roughness: 0.1,
                metalness: 0.8,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            });
            
            const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            
            // Position the obstacle based on its defined position
            barrier.position.set(
                obstacle.position.x,
                obstacle.position.y + 2.5,
                obstacle.position.z
            );
            
            barrier.userData.courseElement = true;
            this.trackElements.push(barrier);
            this.scene.add(barrier);
            
            // Register obstacle for collision detection
            if (typeof this.registerObstacle === 'function') {
                this.registerObstacle({
                    mesh: barrier,
                    width: obstacle.width,
                    position: new THREE.Vector3(
                        obstacle.position.x,
                        obstacle.position.y,
                        obstacle.position.z
                    )
                });
            }
        });
    }
    
    // Add boost pads to the track
    addBoostPads(pathPoints, boostPads) {
        boostPads.forEach(boostPad => {
            const boostGeometry = new THREE.PlaneGeometry(15, boostPad.length || 20);
            const boostMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            const boost = new THREE.Mesh(boostGeometry, boostMaterial);
boost.rotation.x = -Math.PI / 2; // Flat on the ground
            
            // Position the boost pad based on its defined position
            boost.position.set(
                boostPad.position.x,
                boostPad.position.y - 0.9, // Slightly above track
                boostPad.position.z
            );
            
            boost.userData.courseElement = true;
            this.trackElements.push(boost);
            this.scene.add(boost);
            
            // Register boost pad for gameplay
            if (typeof this.registerBoostPad === 'function') {
                this.registerBoostPad({
                    mesh: boost,
                    position: new THREE.Vector3(
                        boostPad.position.x,
                        boostPad.position.y,
                        boostPad.position.z
                    ),
                    length: boostPad.length || 20
                });
            }
        });
    }
    
    // Create checkpoint markers
    createCheckpoints(checkpoints) {
        if (!checkpoints || checkpoints.length === 0) return;
        
        checkpoints.forEach((checkpoint, index) => {
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
            
            this.trackElements.push(checkpointMarker);
            this.scene.add(checkpointMarker);
            
            // Register checkpoint for gameplay
            if (typeof this.registerCheckpoint === 'function') {
                this.registerCheckpoint({
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
            }
        });
    }
    
    // Create finish line
    createFinishLine(position) {
        if (!position) return;
        
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
        
        this.trackElements.push(finishLine);
        this.scene.add(finishLine);
        
        // Register finish line for gameplay
        if (typeof this.registerFinishLine === 'function') {
            this.registerFinishLine(position);
        }
    }
    
    // Register callback for obstacle creation
    onObstacleCreated(callback) {
        this.registerObstacle = callback;
    }
    
    // Register callback for boost pad creation
    onBoostPadCreated(callback) {
        this.registerBoostPad = callback;
    }
    
    // Register callback for checkpoint creation
    onCheckpointCreated(callback) {
        this.registerCheckpoint = callback;
    }
    
    // Register callback for finish line creation
    onFinishLineCreated(callback) {
        this.registerFinishLine = callback;
    }
}

// Export the TrackGenerator
if (typeof window !== 'undefined') {
    window.TrackGenerator = TrackGenerator;
}