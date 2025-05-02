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

    // Field boundaries
    const fieldGeometry = new THREE.BoxGeometry(30, 20, 1);
    const fieldEdges = new THREE.EdgesGeometry(fieldGeometry);
    const fieldLines = new THREE.LineSegments(
        fieldEdges,
        new THREE.LineBasicMaterial({ color: 0x9d4edd })
    );
    fieldLines.position.z = -0.5;
    scene.add(fieldLines);

    // Paddle material with glow effect
    const createPaddleMaterial = (color) => {
        return new THREE.MeshPhongMaterial({
            color: color,
            shininess: 100,
            emissive: color,
            emissiveIntensity: 0.5
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

    // Kitty ball (sphere with texture)
    const kittySize = 1;
    const kittyGeometry = new THREE.SphereGeometry(kittySize, 32, 32);
    const kittyMaterial = new THREE.MeshPhongMaterial({
        color: 0xffc0cb,
        shininess: 50
    });
    const kitty = new THREE.Mesh(kittyGeometry, kittyMaterial);
    scene.add(kitty);

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
        }

        // Paddle collisions
        if (kitty.position.x < -13 && kitty.position.x > -15 &&
            kitty.position.y < playerPaddle.position.y + 2 &&
            kitty.position.y > playerPaddle.position.y - 2) {
            kitty.userData.velocity.x = -kitty.userData.velocity.x * 1.1;
            playSound('paddle');
        }

        if (kitty.position.x > 13 && kitty.position.x < 15 &&
            kitty.position.y < computerPaddle.position.y + 2 &&
            kitty.position.y > computerPaddle.position.y - 2) {
            kitty.userData.velocity.x = -kitty.userData.velocity.x * 1.1;
            playSound('paddle');
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
    const particleCount = 100;
    const particles = new THREE.Points(
        new THREE.BufferGeometry(),
        new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            blending: THREE.AdditiveBlending
        })
    );

    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        velocities.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        ));
    }

    particles.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    scene.add(particles);

    // Update particles
    function updateParticles() {
        const positions = particles.geometry.attributes.position.array;
        
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
        }

        particles.geometry.attributes.position.needsUpdate = true;
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