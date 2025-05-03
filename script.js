import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
    // Three.js setup
    const canvas = document.getElementById('pong');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0.1);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 15;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Field boundaries with color animation
    const fieldGeometry = new THREE.BoxGeometry(30, 20, 1);
    const fieldEdges = new THREE.EdgesGeometry(fieldGeometry);
    const fieldMaterial = new THREE.LineBasicMaterial({ 
        color: 0x9d4edd,
        linewidth: 2,
    });
    const fieldLines = new THREE.LineSegments(fieldEdges, fieldMaterial);
    fieldLines.position.z = -0.5;
    scene.add(fieldLines);
    
    // Add corner glow lights
    const cornerColors = [
        0xff00ff, // Top-left: magenta
        0x00ffff, // Top-right: cyan
        0xffff00, // Bottom-right: yellow
        0xff00aa  // Bottom-left: pink
    ];
    
    const cornerLights = [];
    const cornerPositions = [
        new THREE.Vector3(-14.5, 9.5, 0),  // Top-left
        new THREE.Vector3(14.5, 9.5, 0),   // Top-right
        new THREE.Vector3(14.5, -9.5, 0),  // Bottom-right
        new THREE.Vector3(-14.5, -9.5, 0)  // Bottom-left
    ];
    
    for (let i = 0; i < 4; i++) {
        const cornerLight = new THREE.PointLight(cornerColors[i], 1, 8, 2);
        cornerLight.position.copy(cornerPositions[i]);
        scene.add(cornerLight);
        cornerLights.push(cornerLight);
    }
    
    // Function to update field boundary colors and corner lights
    function updateFieldBoundaries() {
        // Cycle the edge color with a rainbow effect
        const hue = (Date.now() * 0.0002) % 1;
        const color = new THREE.Color().setHSL(hue, 1, 0.6);
        fieldMaterial.color = color;
        
        // Update corner light positions and add pulsing effect
        const pulseIntensity = Math.sin(Date.now() * 0.002) * 0.5 + 1;
        for (let i = 0; i < cornerLights.length; i++) {
            cornerLights[i].intensity = pulseIntensity;
            
            // Shift the corner light hue over time
            const cornerHue = (hue + (i * 0.25)) % 1;
            cornerLights[i].color.setHSL(cornerHue, 1, 0.5);
        }
    }

    // Paddle material with enhanced glow effect
    const createPaddleMaterial = (baseColor) => {
        return new THREE.MeshPhongMaterial({
            color: baseColor,
            shininess: 100,
            emissive: baseColor,
            emissiveIntensity: 0.7
        });
    };

    // Paddle geometries
    const paddleGeometry = new THREE.BoxGeometry(0.5, 4, 1);
    const playerPaddle = new THREE.Mesh(paddleGeometry, createPaddleMaterial(0x00ccff));
    const computerPaddle = new THREE.Mesh(paddleGeometry, createPaddleMaterial(0xff0080));

    playerPaddle.position.x = -14;
    computerPaddle.position.x = 14;
    scene.add(playerPaddle);
    scene.add(computerPaddle);

    // Create paddle glow effects
    const playerGlow = new THREE.PointLight(0x00ccff, 1.5, 6, 2);
    playerGlow.position.set(-14, 0, 0);
    scene.add(playerGlow);

    const computerGlow = new THREE.PointLight(0xff0080, 1.5, 6, 2);
    computerGlow.position.set(14, 0, 0);
    scene.add(computerGlow);

    // Function to update paddle glow effects
    function updatePaddleGlow() {
        // Update player paddle glow position and color
        playerGlow.position.y = playerPaddle.position.y;
        const playerHue = (Date.now() * 0.0005) % 1;
        const playerColor = new THREE.Color().setHSL(playerHue, 1, 0.5);
        playerGlow.color = playerColor;
        playerPaddle.material.emissive = playerColor;
        
        // Update computer paddle glow position and color
        computerGlow.position.y = computerPaddle.position.y;
        const computerHue = ((Date.now() * 0.0005) + 0.5) % 1;
        const computerColor = new THREE.Color().setHSL(computerHue, 1, 0.5);
        computerGlow.color = computerColor;
        computerPaddle.material.emissive = computerColor;

        // Add pulsing effect to glow intensity
        const pulseIntensity = Math.sin(Date.now() * 0.003) * 0.5 + 1.5;
        playerGlow.intensity = pulseIntensity;
        computerGlow.intensity = pulseIntensity;
    }

    // Kitty ball with multiple textures
    const kittySize = 1;
    const kittyGeometry = new THREE.SphereGeometry(kittySize, 32, 32);
    
    // Create multiple kitty face textures using SVG data URLs
    const kittyFaces = [
        createKittyFace('#ffc0cb', '😺'), // Happy kitty
        createKittyFace('#ffb8de', '😻'), // Heart eyes kitty
        createKittyFace('#ffa0d0', '😸'), // Grinning kitty
        createKittyFace('#ff90c8', '😽'), // Kissing kitty
        createKittyFace('#ff80c0', '🙀')  // Surprised kitty
    ];
    
    function createKittyFace(color, emoji) {
        // Create a canvas to draw the kitty face
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Fill the background with the kitty color
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(128, 128, 128, 0, Math.PI * 2);
        ctx.fill();
        
        // Add the emoji face
        ctx.font = '160px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 128, 118);
        
        // Add some whiskers
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        
        // Left whiskers
        ctx.beginPath();
        ctx.moveTo(70, 140);
        ctx.lineTo(20, 120);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(70, 150);
        ctx.lineTo(20, 150);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(70, 160);
        ctx.lineTo(20, 180);
        ctx.stroke();
        
        // Right whiskers
        ctx.beginPath();
        ctx.moveTo(186, 140);
        ctx.lineTo(236, 120);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(186, 150);
        ctx.lineTo(236, 150);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(186, 160);
        ctx.lineTo(236, 180);
        ctx.stroke();
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        return new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 50
        });
    }
    
    // Create kitty ball with initial texture
    const kitty = new THREE.Mesh(kittyGeometry, kittyFaces[0]);
    kitty.userData.currentFace = 0;
    kitty.userData.lastFaceChange = 0;
    scene.add(kitty);
    
    // Function to update kitty face
    function updateKittyFace(time) {
        // Change face every 2-3 seconds or on collision
        if (time - kitty.userData.lastFaceChange > 2000 + Math.random() * 1000) {
            kitty.userData.currentFace = (kitty.userData.currentFace + 1) % kittyFaces.length;
            kitty.material = kittyFaces[kitty.userData.currentFace];
            kitty.userData.lastFaceChange = time;
        }
    }

    // Kitty ball trail effect
    const trailCount = 15;
    const trailGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const trailMaterials = [];
    const trailParticles = [];
    
    // Create trail particles with different colors
    for (let i = 0; i < trailCount; i++) {
        // Create gradient colors from blue to pink
        const hue = (i / trailCount * 0.6) + 0.7; // Range from 0.7 to 1.3 (pink to blue in HSL)
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(hue % 1, 1, 0.5),
            transparent: true,
            opacity: 0.7 * (1 - i / trailCount), // Fade out based on position in trail
            emissive: new THREE.Color().setHSL(hue % 1, 1, 0.3),
            emissiveIntensity: 0.5
        });
        trailMaterials.push(material);
        
        const trailParticle = new THREE.Mesh(trailGeometry, material);
        trailParticle.visible = false; // Start invisible
        trailParticle.scale.set(0.2 + (i * 0.05), 0.2 + (i * 0.05), 0.2); // Gradually increase size
        scene.add(trailParticle);
        trailParticles.push(trailParticle);
    }
    
    // Function to update the kitty trail
    function updateKittyTrail() {
        // Store positions for trail effect (shift each position down the line)
        for (let i = trailCount - 1; i > 0; i--) {
            trailParticles[i].position.copy(trailParticles[i - 1].position);
            trailParticles[i].visible = trailParticles[i - 1].visible;
            
            // Update colors based on current kitty face
            const hue = ((Date.now() * 0.0005) + (i * 0.05)) % 1;
            trailMaterials[i].color.setHSL(hue, 1, 0.5);
            trailMaterials[i].emissive.setHSL(hue, 1, 0.3);
        }
        
        // Set the first trail particle to the kitty's current position
        if (gameState.gameRunning) {
            trailParticles[0].position.copy(kitty.position);
            trailParticles[0].visible = true;
        }
    }

    // Game variables
    const gameState = {
        gameRunning: false,
        playerScore: 0,
        computerScore: 0,
        ballSpeed: 0.2,
        difficultyMultiplier: 1
    };

    // HTML elements
    const startButton = document.getElementById('start-btn');
    const playerScoreDisplay = document.getElementById('player-score');
    const computerScoreDisplay = document.getElementById('computer-score');
    const timerDisplay = document.getElementById('timer-value');
    const speedDisplay = document.getElementById('speed-value');
    const soundBtn = document.getElementById('sound-btn');

    // Audio setup
    let audioContext = null;
    let soundEnabled = true;

    // Initialize audio context on first user interaction for iOS
    function initAudioContext() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);
            } catch (e) {
                console.log("Audio context initialization failed, but that's okay!");
            }
        }
    }

    // Sound toggle
    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            soundBtn.classList.remove('sound-off');
            soundBtn.classList.add('sound-on');
            soundBtn.textContent = 'Sound: ON';
        } else {
            soundBtn.classList.remove('sound-on');
            soundBtn.classList.add('sound-off');
            soundBtn.textContent = 'Sound: OFF';
        }
    });

    // Enhanced keyboard controls
    const keys = {
        w: false,
        s: false,
        ArrowUp: false,
        ArrowDown: false
    };

    let isMouseControlActive = false;
    let mouseY = 0;
    let keyboardActive = false;

    document.addEventListener('keydown', (e) => {
        if (e.key in keys) {
            keys[e.key] = true;
            keyboardActive = true;
            isMouseControlActive = false; // Disable mouse control when using keyboard
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key in keys) {
            keys[e.key] = false;
            // Only set keyboard inactive if no other keys are pressed
            keyboardActive = Object.values(keys).some(value => value);
        }
    });

    // Mouse control handlers using entire window
    window.addEventListener('mousemove', (e) => {
        if (!gameState.gameRunning) return;
        
        // Disable keyboard control when mouse is moved
        if (keyboardActive && (e.movementX !== 0 || e.movementY !== 0)) {
            keyboardActive = false;
        }
        
        // Convert screen Y position to game coordinates
        const screenHeight = window.innerHeight;
        const y = ((e.clientY / screenHeight) * 20 - 10);
        mouseY = Math.max(-8, Math.min(8, y)); // Clamp to game bounds
        isMouseControlActive = true;
    });

    window.addEventListener('mouseleave', () => {
        isMouseControlActive = false;
    });

    // Enhanced touch controls
    let touchY = null;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameState.gameRunning) return;
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        touchY = ((touch.clientY - rect.top) / rect.height) * 20 - 10;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!gameState.gameRunning) return;
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        touchY = ((touch.clientY - rect.top) / rect.height) * 20 - 10;
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        touchY = null;
    });

    // Prevent double tap zoom on mobile
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
    }, { passive: false });

    // Mobile touch controls
    const touchUpBtn = document.querySelector('.touch-up');
    const touchDownBtn = document.querySelector('.touch-down');
    let touchUpActive = false;
    let touchDownActive = false;

    function handleTouchStart(e, direction) {
        e.preventDefault();
        if (direction === 'up') {
            touchUpActive = true;
            touchDownActive = false;
        } else {
            touchDownActive = true;
            touchUpActive = false;
        }
    }

    function handleTouchEnd() {
        touchUpActive = false;
        touchDownActive = false;
    }

    touchUpBtn.addEventListener('touchstart', (e) => handleTouchStart(e, 'up'));
    touchUpBtn.addEventListener('touchend', handleTouchEnd);
    touchDownBtn.addEventListener('touchstart', (e) => handleTouchStart(e, 'down'));
    touchDownBtn.addEventListener('touchend', handleTouchEnd);

    // Sound effects
    function playSound(type) {
        if (!soundEnabled) return;

        try {
            const context = audioContext || new (window.AudioContext || window.webkitAudioContext)();
            if (!audioContext) audioContext = context;

            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            switch(type) {
                case 'paddle':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(880, context.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
                    oscillator.start();
                    oscillator.stop(context.currentTime + 0.1);
                    break;
                case 'wall':
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(220, context.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(110, context.currentTime + 0.05);
                    gainNode.gain.setValueAtTime(0.08, context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
                    oscillator.start();
                    oscillator.stop(context.currentTime + 0.05);
                    break;
                case 'score':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(110, context.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.15);
                    gainNode.gain.setValueAtTime(0.1, context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.15);
                    oscillator.start();
                    oscillator.stop(context.currentTime + 0.15);
                    break;
            }
        } catch (e) {
            console.log("Sound couldn't play, but that's okay!");
        }
    }

    // Game reset function
    function resetGame() {
        gameState.playerScore = 0;
        gameState.computerScore = 0;
        gameState.difficultyMultiplier = 1;
        playerScoreDisplay.textContent = '0';
        computerScoreDisplay.textContent = '0';
        resetBall();
    }

    // Reset ball position
    function resetBall() {
        kitty.position.set(0, 0, 0);
        kitty.userData.velocity = new THREE.Vector3(
            Math.random() > 0.5 ? gameState.ballSpeed : -gameState.ballSpeed,
            (Math.random() - 0.5) * gameState.ballSpeed,
            0
        );
    }

    // Start/restart game
    startButton.addEventListener('click', () => {
        if (!gameState.gameRunning) {
            resetGame();
            gameState.gameRunning = true;
            startButton.textContent = 'Restart Game';
            animate();
        } else {
            resetGame();
        }
    });

    // Update paddle positions with improved control switching
    function updatePaddles() {
        const paddleSpeed = 0.3 * gameState.difficultyMultiplier;
        
        if (keyboardActive) {
            // Keyboard controls with smoother movement
            if ((keys.w || keys.ArrowUp) && playerPaddle.position.y < 8) {
                playerPaddle.position.y += paddleSpeed;
            }
            if ((keys.s || keys.ArrowDown) && playerPaddle.position.y > -8) {
                playerPaddle.position.y -= paddleSpeed;
            }
        } else if (isMouseControlActive) {
            // Mouse movement
            const targetY = -mouseY;
            const currentY = playerPaddle.position.y;
            playerPaddle.position.y += (targetY - currentY) * 0.15 * gameState.difficultyMultiplier;
        } else if (touchY !== null) {
            // Touch movement
            const targetY = touchY;
            const currentY = playerPaddle.position.y;
            playerPaddle.position.y += (targetY - currentY) * 0.15 * gameState.difficultyMultiplier;
        }

        // Keep paddle within bounds
        playerPaddle.position.y = Math.max(-8, Math.min(8, playerPaddle.position.y));

        // Computer paddle AI
        if (gameState.gameRunning) {
            const targetY = kitty.position.y;
            const computerSpeed = 0.15 * gameState.difficultyMultiplier;
            
            if (computerPaddle.position.y < targetY && computerPaddle.position.y < 8) {
                computerPaddle.position.y += computerSpeed;
            }
            if (computerPaddle.position.y > targetY && computerPaddle.position.y > -8) {
                computerPaddle.position.y -= computerSpeed;
            }
        }
    }

    // Update ball position and check collisions
    function updateBall() {
        if (!gameState.gameRunning) return;

        kitty.position.add(kitty.userData.velocity);
        kitty.rotation.x += 0.02;
        kitty.rotation.y += 0.03;

        // Wall collisions
        if (kitty.position.y > 9 || kitty.position.y < -9) {
            kitty.userData.velocity.y = -kitty.userData.velocity.y;
            playSound('wall');
            // Change kitty face on collision
            kitty.userData.currentFace = (kitty.userData.currentFace + 1) % kittyFaces.length;
            kitty.material = kittyFaces[kitty.userData.currentFace];
            kitty.userData.lastFaceChange = Date.now();
        }

        // Paddle collisions
        if (kitty.position.x < -13 && kitty.position.x > -15 &&
            kitty.position.y < playerPaddle.position.y + 2 &&
            kitty.position.y > playerPaddle.position.y - 2) {
            kitty.userData.velocity.x = -kitty.userData.velocity.x * 1.1;
            playSound('paddle');
            // Change kitty face on collision
            kitty.userData.currentFace = (kitty.userData.currentFace + 1) % kittyFaces.length;
            kitty.material = kittyFaces[kitty.userData.currentFace];
            kitty.userData.lastFaceChange = Date.now();
        }

        if (kitty.position.x > 13 && kitty.position.x < 15 &&
            kitty.position.y < computerPaddle.position.y + 2 &&
            kitty.position.y > computerPaddle.position.y - 2) {
            kitty.userData.velocity.x = -kitty.userData.velocity.x * 1.1;
            playSound('paddle');
            // Change kitty face on collision
            kitty.userData.currentFace = (kitty.userData.currentFace + 1) % kittyFaces.length;
            kitty.material = kittyFaces[kitty.userData.currentFace];
            kitty.userData.lastFaceChange = Date.now();
        }

        // Scoring
        if (kitty.position.x < -15) {
            gameState.computerScore++;
            computerScoreDisplay.textContent = gameState.computerScore;
            playSound('score');
            resetBall();
        }
        if (kitty.position.x > 15) {
            gameState.playerScore++;
            playerScoreDisplay.textContent = gameState.playerScore;
            playSound('score');
            resetBall();
        }
    }

    // Particle system for visual effects
    const particleCount = 150; // Increased from 100
    const particles = new THREE.Points(
        new THREE.BufferGeometry(),
        new THREE.PointsMaterial({
            vertexColors: true, // Enable vertex colors
            size: 0.15, // Slightly larger particles
            transparent: true,
            blending: THREE.AdditiveBlending
        })
    );

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        
        // Assign a rainbow color to each particle
        const hue = Math.random();
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        ));
    }

    particles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particles.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    scene.add(particles);

    // Update particles
    function updateParticles() {
        const positions = particles.geometry.attributes.position.array;
        const colors = particles.geometry.attributes.color.array;
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;

            // Reset particles that go out of bounds
            if (Math.abs(positions[i * 3]) > 15) {
                positions[i * 3] = -15 * Math.sign(positions[i * 3]);
            }
            if (Math.abs(positions[i * 3 + 1]) > 10) {
                positions[i * 3 + 1] = -10 * Math.sign(positions[i * 3 + 1]);
            }

            // Gradually shift colors for rainbow effect
            const hue = (Date.now() * 0.0001 + i * 0.01) % 1;
            const color = new THREE.Color().setHSL(hue, 1, 0.5);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;
    }

    // Animation loop
    let lastTime = 0;
    function animate(time) {
        if (!lastTime) lastTime = time;
        const deltaTime = time - lastTime;
        lastTime = time;

        if (gameState.gameRunning) {
            updatePaddles();
            updateBall();
            updateParticles();
            updatePaddleGlow();
            updateKittyFace(time);
            updateKittyTrail(); // Add this line to update the kitty trail
            updateFieldBoundaries(); // Add this line to update the field boundaries

            // Gradually increase difficulty
            gameState.difficultyMultiplier += 0.0001;
            speedDisplay.textContent = gameState.difficultyMultiplier.toFixed(1) + 'x';

            // Update timer
            if (deltaTime) {
                timerDisplay.textContent = Math.floor(time / 1000);
            }
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    // Handle window resize
    function onWindowResize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
    }

    window.addEventListener('resize', onWindowResize);
    
    // Initial render
    onWindowResize();
    renderer.render(scene, camera);
});