document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('pong');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('start-btn');
    const playerScoreDisplay = document.getElementById('player-score');
    const computerScoreDisplay = document.getElementById('computer-score');
    const timerDisplay = document.getElementById('timer-value');
    const speedDisplay = document.getElementById('speed-value');
    const watchingKitty = document.querySelector('.watching-kitty');
    const gameContainer = document.querySelector('.game-container');
    
    // Preload kitty images
    const kittyImages = [
        document.getElementById('kitty1'),
        document.getElementById('kitty2'),
        document.getElementById('kitty3')
    ];
    
    let currentKittyIndex = 0;
    
    // Kitty meow sounds
    const meowSounds = [
        'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAeAAAmFgAQEBAQGRkZGRkiIiIiIiwsLCwsNTU1NTU+Pj4+PkdHR0dHUVFRUVFaWlpaWmRkZGRkbW1tbW12dnZ2dn9/f39/iYmJiYmSkpKSkpycnJyco6Ojo6OsrKysrLS0tLS0vb29vb3Gxs',
        'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAeAAAmFgAQEBAQGRkZGRkiIiIiIiwsLCwsNTU1NTU+Pj4+PkdHR0dHUVFRUVFaWlpaWmRkZGRkbW1tbW12dnZ2dn9/f39/iYmJiYmSkpKSkpycnJyco6Ojo6OsrKysrLS0tLS0vb29vb3Gxs',
        'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAeAAAmFgAQEBAQGRkZGRkiIiIiIiwsLCwsNTU1NTU+Pj4+PkdHR0dHUVFRUVFaWlpaWmRkZGRkbW1tbW12dnZ2dn9/f39/iYmJiYmSkpKSkpycnJyco6Ojo6OsrKysrLS0tLS0vb29vb3Gxs'
    ];
    
    // Game variables
    let gameRunning = false;
    let playerScore = 0;
    let computerScore = 0;
    let ballSpeed = 5;
    let lastTime = 0;
    let kittyRotation = 0;
    let kittyScale = 1;
    let kittyDirection = 0.01;
    
    // Timer and speed variables
    let gameTimer = 0;
    let speedMultiplier = 1;
    let lastSpeedIncrease = 0;
    let colorIntensity = 1;
    let colorBrightness = 0;
    let timerInterval;
    
    // Particle effects array
    let particles = [];
    let stars = [];
    let rainbowTrail = [];
    
    // Colors for visual effects
    const colors = ['#ff0080', '#ff00ff', '#9d4edd', '#00ccff', '#00ffcc', '#ffff00', '#ff8800', '#ff0000'];
    
    // Generate stars for background
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 2 + 0.5
        });
    }
    
    // Paddle properties
    const paddleWidth = 15;
    const paddleHeight = 80;
    const paddleSpeed = 8;
    
    // Kitty ball properties
    const kittySize = 40;
    
    // Player paddle
    const playerPaddle = {
        x: 10,
        y: canvas.height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        dy: 0,
        speed: paddleSpeed,
        color: '#00ccff',
        sparkles: []
    };
    
    // Computer paddle
    const computerPaddle = {
        x: canvas.width - 25,
        y: canvas.height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        speed: paddleSpeed * 0.8, // Slightly slower to make the game fair
        color: '#ff0080',
        sparkles: []
    };
    
    // Kitty ball
    const kitty = {
        x: canvas.width / 2 - kittySize / 2,
        y: canvas.height / 2 - kittySize / 2,
        width: kittySize,
        height: kittySize,
        dx: ballSpeed,
        dy: ballSpeed,
        speed: ballSpeed,
        rotation: 0,
        scale: 1
    };
    
    // Key press state
    const keys = {
        w: false,
        s: false,
        ArrowUp: false,
        ArrowDown: false
    };
    
    // Event listeners for paddle movement
    document.addEventListener('keydown', (e) => {
        if (e.key in keys) {
            keys[e.key] = true;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key in keys) {
            keys[e.key] = false;
        }
    });
    
    // Start game button
    startButton.addEventListener('click', () => {
        if (!gameRunning) {
            resetGame();
            gameRunning = true;
            startButton.textContent = 'Restart Game';
            requestAnimationFrame(gameLoop);
            
            // Start timer
            startGameTimer();
            
            // Add kitty color class
            gameContainer.classList.add('ultra-colorful');
            
            // Add flashy effect when starting
            createKittyParticles(canvas.width / 2, canvas.height / 2, 50);
            playMeow();
        } else {
            resetGame();
        }
    });
    
    // Start the game timer
    function startGameTimer() {
        // Clear any existing interval
        if (timerInterval) clearInterval(timerInterval);
        
        // Reset timer and speed values
        gameTimer = 0;
        speedMultiplier = 1;
        lastSpeedIncrease = 0;
        colorIntensity = 1;
        colorBrightness = 0;
        
        // Update displays
        timerDisplay.textContent = gameTimer;
        speedDisplay.textContent = speedMultiplier.toFixed(1) + 'x';
        
        // Set new timer interval - update every second
        timerInterval = setInterval(() => {
            if (gameRunning) {
                // Increment timer
                gameTimer++;
                timerDisplay.textContent = gameTimer;
                
                // Increase speed every second
                increaseGameSpeed();
                
                // Increase color intensity
                updateColorIntensity();
            }
        }, 1000);
    }
    
    // Increase game speed
    function increaseGameSpeed() {
        const oldSpeed = speedMultiplier;
        
        // Increase speed multiplier - faster at the beginning, then more gradual
        if (gameTimer <= 30) {
            speedMultiplier = 1 + (gameTimer * 0.03); // +3% per second for first 30 seconds
        } else if (gameTimer <= 60) {
            speedMultiplier = 1.9 + ((gameTimer - 30) * 0.02); // +2% per second for next 30 seconds
        } else {
            speedMultiplier = 2.5 + ((gameTimer - 60) * 0.01); // +1% per second after that
        }
        
        // Cap the maximum speed multiplier
        speedMultiplier = Math.min(speedMultiplier, 5); // Maximum 5x speed
        
        // Update the speed display
        speedDisplay.textContent = speedMultiplier.toFixed(1) + 'x';
        
        // Apply the speed-up pulse effect
        if (Math.floor(oldSpeed * 10) !== Math.floor(speedMultiplier * 10)) {
            document.getElementById('game-speed').classList.add('speed-up');
            setTimeout(() => {
                document.getElementById('game-speed').classList.remove('speed-up');
            }, 500);
        }
        
        // Add high-energy shake effect at high speeds
        if (speedMultiplier >= 3) {
            canvas.classList.add('high-energy');
        } else {
            canvas.classList.remove('high-energy');
        }
    }
    
    // Update color intensity based on game time
    function updateColorIntensity() {
        // Increase color intensity and brightness as time goes on
        colorIntensity = 1 + (gameTimer * 0.02); // +2% intensity per second
        colorBrightness = Math.min(gameTimer * 0.01, 1); // Max 100% extra brightness
        
        // Add wild color effects at higher speeds
        if (speedMultiplier >= 2) {
            // Add a pulsing effect to the color intensity
            colorIntensity *= 1 + Math.sin(gameTimer * 0.5) * 0.1; // +/- 10% pulsing
        }
        
        // Cap the maximum color intensity
        colorIntensity = Math.min(colorIntensity, 5); // Maximum 5x intensity
        
        // Update CSS variables
        document.documentElement.style.setProperty('--color-intensity', colorIntensity);
        document.documentElement.style.setProperty('--color-brightness', colorBrightness);
    }
    
    // Reset game state
    function resetGame() {
        kitty.x = canvas.width / 2 - kittySize / 2;
        kitty.y = canvas.height / 2 - kittySize / 2;
        kitty.dx = Math.random() > 0.5 ? kitty.speed : -kitty.speed;
        kitty.dy = Math.random() > 0.5 ? kitty.speed : -kitty.speed;
        playerPaddle.y = canvas.height / 2 - paddleHeight / 2;
        computerPaddle.y = canvas.height / 2 - paddleHeight / 2;
        particles = [];
        rainbowTrail = [];
        kittyRotation = 0;
        playerScore = 0;
        computerScore = 0;
        playerScoreDisplay.textContent = '0';
        computerScoreDisplay.textContent = '0';
        
        // Reset timer and speed values
        if (timerInterval) clearInterval(timerInterval);
        startGameTimer();
        
        // Change kitty
        currentKittyIndex = Math.floor(Math.random() * kittyImages.length);
    }
    
    // Play random meow sound
    function playMeow() {
        try {
            const audio = new Audio();
            audio.volume = 0.3;
            audio.src = meowSounds[Math.floor(Math.random() * meowSounds.length)];
            audio.play();
        } catch (e) {
            console.log("Meow couldn't play, but that's okay!");
        }
    }
    
    // Create kitty-shaped particles
    function createKittyParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 3 + 1;
            const size = Math.random() * 10 + 5;
            const life = Math.random() * 40 + 40;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: size,
                color: color,
                life: life,
                maxLife: life,
                alpha: 1,
                type: Math.random() > 0.7 ? 'paw' : 'heart', // 70% paws, 30% hearts
                rotation: Math.random() * Math.PI * 2
            });
        }
    }
    
    // Create paddle sparkles
    function createPaddleSparkles(paddle, count) {
        for (let i = 0; i < count; i++) {
            paddle.sparkles.push({
                x: paddle.x + (paddle === playerPaddle ? paddle.width : 0),
                y: paddle.y + Math.random() * paddle.height,
                size: Math.random() * 3 + 1,
                color: paddle === playerPaddle ? '#00ffff' : '#ff00ff',
                life: 20,
                maxLife: 20,
            });
        }
    }
    
    // Update and draw particles
    function updateParticles() {
        const updatedParticles = [];
        
        particles.forEach(particle => {
            particle.x += particle.vx * speedMultiplier;
            particle.y += particle.vy * speedMultiplier;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            particle.rotation += 0.05 * speedMultiplier;
            
            if (particle.life > 0) {
                updatedParticles.push(particle);
            }
        });
        
        particles = updatedParticles;
    }
    
    // Update star particles
    function updateStars() {
        stars.forEach(star => {
            star.y += star.speed * speedMultiplier;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });
    }
    
    // Update paddle sparkles
    function updatePaddleSparkles() {
        [playerPaddle, computerPaddle].forEach(paddle => {
            const updatedSparkles = [];
            paddle.sparkles.forEach(sparkle => {
                sparkle.life -= speedMultiplier;
                if (sparkle.life > 0) {
                    updatedSparkles.push(sparkle);
                }
            });
            paddle.sparkles = updatedSparkles;
        });
    }
    
    // Update watching kitty's eyes
    function updateWatchingKitty() {
        // Remove all direction classes
        watchingKitty.classList.remove('follow-left', 'follow-right', 'follow-up', 'follow-down');
        
        // Get kitty ball position relative to canvas
        const kittyCenter = {
            x: kitty.x + kitty.width / 2,
            y: kitty.y + kitty.height / 2
        };
        
        // Determine eye direction based on ball position
        if (kittyCenter.x < canvas.width / 3) {
            watchingKitty.classList.add('follow-left');
        } else if (kittyCenter.x > canvas.width * 2/3) {
            watchingKitty.classList.add('follow-right');
        }
        
        if (kittyCenter.y < canvas.height / 3) {
            watchingKitty.classList.add('follow-up');
        } else if (kittyCenter.y > canvas.height * 2/3) {
            watchingKitty.classList.add('follow-down');
        }
        
        // Make watching kitty express excitement at high speeds
        if (speedMultiplier >= 3) {
            watchingKitty.querySelector('.kitty-mouth').style.borderRadius = '40% 40% 0 0';
            watchingKitty.querySelector('.kitty-mouth').style.borderTop = '3px solid #000';
            watchingKitty.querySelector('.kitty-mouth').style.borderBottom = 'none';
            watchingKitty.querySelector('.kitty-mouth').style.height = '15px';
        } else {
            watchingKitty.querySelector('.kitty-mouth').style.borderRadius = '0 0 40% 40%';
            watchingKitty.querySelector('.kitty-mouth').style.borderBottom = '3px solid #000';
            watchingKitty.querySelector('.kitty-mouth').style.borderTop = 'none';
            watchingKitty.querySelector('.kitty-mouth').style.height = '10px';
        }
    }
    
    // Draw particles
    function drawParticles() {
        particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            if (particle.type === 'paw') {
                // Draw paw shape
                drawPaw(0, 0, particle.size);
            } else {
                // Draw heart shape
                drawHeart(0, 0, particle.size);
            }
            
            ctx.restore();
        });
        ctx.globalAlpha = 1;
    }
    
    // Draw paw shape
    function drawPaw(x, y, size) {
        const s = size / 10;
        ctx.fillStyle = '#ff99cc';
        // Main pad
        ctx.beginPath();
        ctx.ellipse(x, y, s*5, s*4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Toe beans
        ctx.fillStyle = '#ff66aa';
        // Top left
        ctx.beginPath();
        ctx.ellipse(x - s*2, y - s*3, s*2, s*1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Top right
        ctx.beginPath();
        ctx.ellipse(x + s*2, y - s*3, s*2, s*1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bottom left
        ctx.beginPath();
        ctx.ellipse(x - s*3, y, s*1.5, s*2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bottom right
        ctx.beginPath();
        ctx.ellipse(x + s*3, y, s*1.5, s*2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw heart shape
    function drawHeart(x, y, size) {
        const s = size / 2;
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.moveTo(x, y + s);
        ctx.bezierCurveTo(x, y, x - s, y - s/2, x - s, y - s);
        ctx.bezierCurveTo(x - s, y - s*1.5, x - s/2, y - s*1.5, x, y - s);
        ctx.bezierCurveTo(x + s/2, y - s*1.5, x + s, y - s*1.5, x + s, y - s);
        ctx.bezierCurveTo(x + s, y - s/2, x, y, x, y + s);
        ctx.fill();
    }
    
    // Draw stars
    function drawStars() {
        stars.forEach(star => {
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    // Draw paddle sparkles
    function drawPaddleSparkles() {
        [playerPaddle, computerPaddle].forEach(paddle => {
            paddle.sparkles.forEach(sparkle => {
                const alpha = sparkle.life / sparkle.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = sparkle.color;
                ctx.beginPath();
                ctx.arc(sparkle.x, sparkle.y, sparkle.size * (1 + (1 - alpha)), 0, Math.PI * 2);
                ctx.fill();
            });
        });
        ctx.globalAlpha = 1;
    }
    
    // Draw rainbow trail
    function updateRainbowTrail() {
        // Add new trail point
        rainbowTrail.push({
            x: kitty.x + kitty.width / 2,
            y: kitty.y + kitty.height / 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 5 + 10,
            life: 20,
            maxLife: 20
        });
        
        // Remove old points
        if (rainbowTrail.length > 20) {
            rainbowTrail.shift();
        }
        
        // Update existing points
        rainbowTrail.forEach(point => {
            point.life -= speedMultiplier;
            point.size *= 0.95;
        });
        
        // Filter out dead points
        rainbowTrail = rainbowTrail.filter(point => point.life > 0);
    }
    
    function drawRainbowTrail() {
        for (let i = 0; i < rainbowTrail.length; i++) {
            const point = rainbowTrail[i];
            const alpha = point.life / point.maxLife * 0.5;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = point.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // Draw functions
    function drawPaddle(paddle) {
        // Create gradient
        const gradient = ctx.createLinearGradient(
            paddle.x, paddle.y, 
            paddle.x + paddle.width, paddle.y + paddle.height
        );
        
        if (paddle === playerPaddle) {
            gradient.addColorStop(0, '#00ccff');
            gradient.addColorStop(1, '#00ffcc');
        } else {
            gradient.addColorStop(0, '#ff0080');
            gradient.addColorStop(1, '#ff00ff');
        }
        
        // Draw rainbow border
        ctx.fillStyle = 'white';
        ctx.fillRect(paddle.x - 2, paddle.y - 2, paddle.width + 4, paddle.height + 4);
        
        // Draw main paddle
        ctx.fillStyle = gradient;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Draw kitty ears on paddle
        const midY = paddle.y + paddle.height / 2;
        ctx.fillStyle = paddle === playerPaddle ? '#00ccff' : '#ff0080';
        
        // Left ear
        ctx.beginPath();
        ctx.moveTo(paddle.x + paddle.width/2, paddle.y - 10);
        ctx.lineTo(paddle.x + paddle.width/2 - 10, paddle.y);
        ctx.lineTo(paddle.x + paddle.width/2 + 10, paddle.y);
        ctx.fill();
        
        // Right ear
        ctx.beginPath();
        ctx.moveTo(paddle.x + paddle.width/2, paddle.y + paddle.height + 10);
        ctx.lineTo(paddle.x + paddle.width/2 - 10, paddle.y + paddle.height);
        ctx.lineTo(paddle.x + paddle.width/2 + 10, paddle.y + paddle.height);
        ctx.fill();
        
        // Draw kitty eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(paddle.x + paddle.width/2, midY - 15, 5, 0, Math.PI * 2);
        ctx.arc(paddle.x + paddle.width/2, midY + 15, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(paddle.x + paddle.width/2 + 1, midY - 15, 2, 0, Math.PI * 2);
        ctx.arc(paddle.x + paddle.width/2 + 1, midY + 15, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawKitty() {
        ctx.save();
        
        // Center of rotation
        const centerX = kitty.x + kitty.width / 2;
        const centerY = kitty.y + kitty.height / 2;
        
        // Translate to center, rotate, scale, then translate back
        ctx.translate(centerX, centerY);
        ctx.rotate(kittyRotation);
        ctx.scale(kittyScale, kittyScale);
        ctx.translate(-kitty.width / 2, -kitty.height / 2);
        
        // Draw kitty image
        ctx.drawImage(kittyImages[currentKittyIndex], 0, 0, kitty.width, kitty.height);
        
        ctx.restore();
    }
    
    // Update player paddle position
    function updatePlayerPaddle() {
        // Reset dy
        playerPaddle.dy = 0;
        
        // Check which keys are pressed
        if ((keys.w || keys.ArrowUp) && playerPaddle.y > 0) {
            playerPaddle.dy = -playerPaddle.speed * speedMultiplier;
        }
        if ((keys.s || keys.ArrowDown) && playerPaddle.y < canvas.height - playerPaddle.height) {
            playerPaddle.dy = playerPaddle.speed * speedMultiplier;
        }
        
        // Update position
        playerPaddle.y += playerPaddle.dy;
        
        // Keep paddle within canvas bounds
        if (playerPaddle.y < 0) {
            playerPaddle.y = 0;
        }
        if (playerPaddle.y > canvas.height - playerPaddle.height) {
            playerPaddle.y = canvas.height - playerPaddle.height;
        }
        
        // Create sparkles if moving
        if (Math.abs(playerPaddle.dy) > 0 && gameRunning && Math.random() > 0.7) {
            createPaddleSparkles(playerPaddle, 1);
        }
    }
    
    // Update computer paddle position (AI)
    function updateComputerPaddle() {
        const paddleCenter = computerPaddle.y + computerPaddle.height / 2;
        const kittyCenter = kitty.y + kitty.height / 2;
        const previousY = computerPaddle.y;
        
        // Only move when kitty is moving towards computer
        if (kitty.dx > 0) {
            // Add some "AI" difficulty - sometimes delay reaction
            if (Math.random() > 0.3) {
                const difficulty = Math.min(0.9, 0.6 + (gameTimer / 100)); // AI gets slightly better over time
                
                if (paddleCenter < kittyCenter - 10) {
                    computerPaddle.y += computerPaddle.speed * speedMultiplier * difficulty;
                } else if (paddleCenter > kittyCenter + 10) {
                    computerPaddle.y -= computerPaddle.speed * speedMultiplier * difficulty;
                }
            }
        }
        
        // Keep paddle within canvas bounds
        if (computerPaddle.y < 0) {
            computerPaddle.y = 0;
        }
        if (computerPaddle.y > canvas.height - computerPaddle.height) {
            computerPaddle.y = canvas.height - computerPaddle.height;
        }
        
        // Create sparkles if moving
        if (computerPaddle.y !== previousY && gameRunning && Math.random() > 0.7) {
            createPaddleSparkles(computerPaddle, 1);
        }
    }
    
    // Update kitty position and check collisions
    function updateKitty() {
        // Move kitty with speed multiplier
        kitty.x += kitty.dx * speedMultiplier;
        kitty.y += kitty.dy * speedMultiplier;
        
        // Update kitty animation
        kittyRotation += (kitty.dx > 0 ? 0.03 : -0.03) * speedMultiplier;
        kittyScale += kittyDirection;
        if (kittyScale > 1.1 || kittyScale < 0.9) {
            kittyDirection = -kittyDirection;
        }
        
        // Update rainbow trail
        updateRainbowTrail();
        
        // Update watching kitty's eyes to follow the ball
        updateWatchingKitty();
        
        // Collision with top and bottom walls
        if (kitty.y <= 0 || kitty.y + kitty.height >= canvas.height) {
            kitty.dy = -kitty.dy;
            createKittyParticles(kitty.x + kitty.width / 2, kitty.y + kitty.height / 2, 10);
            playSound('wall');
        }
        
        // Collision with player paddle
        if (
            kitty.dx < 0 &&
            kitty.x <= playerPaddle.x + playerPaddle.width &&
            kitty.x + kitty.width >= playerPaddle.x &&
            kitty.y <= playerPaddle.y + playerPaddle.height &&
            kitty.y + kitty.height >= playerPaddle.y
        ) {
            // Calculate angle based on where kitty hits paddle
            const hitPosition = (kitty.y + kitty.height/2) - (playerPaddle.y + playerPaddle.height/2);
            const normalized = hitPosition / (paddleHeight / 2);
            const angle = normalized * Math.PI / 4; // Max angle is 45 degrees
            
            kitty.dx = Math.cos(angle) * kitty.speed;
            kitty.dy = Math.sin(angle) * kitty.speed;
            
            // Ensure kitty is moving right
            if (kitty.dx < 0) {
                kitty.dx = -kitty.dx;
            }
            
            // Increase kitty speed slightly
            kitty.speed += 0.2;
            
            // Visual effects on hit
            createKittyParticles(kitty.x, kitty.y, 20);
            
            // Change kitty on hit sometimes
            if (Math.random() > 0.7) {
                currentKittyIndex = (currentKittyIndex + 1) % kittyImages.length;
            }
            
            playSound('paddle');
            playMeow();
        }
        
        // Collision with computer paddle
        if (
            kitty.dx > 0 &&
            kitty.x + kitty.width >= computerPaddle.x &&
            kitty.x <= computerPaddle.x + computerPaddle.width &&
            kitty.y <= computerPaddle.y + computerPaddle.height &&
            kitty.y + kitty.height >= computerPaddle.y
        ) {
            // Calculate angle based on where kitty hits paddle
            const hitPosition = (kitty.y + kitty.height/2) - (computerPaddle.y + computerPaddle.height/2);
            const normalized = hitPosition / (paddleHeight / 2);
            const angle = normalized * Math.PI / 4; // Max angle is 45 degrees
            
            kitty.dx = -Math.cos(angle) * kitty.speed;
            kitty.dy = Math.sin(angle) * kitty.speed;
            
            // Increase kitty speed slightly
            kitty.speed += 0.2;
            
            // Visual effects on hit
            createKittyParticles(kitty.x + kitty.width, kitty.y, 20);
            
            // Change kitty on hit sometimes
            if (Math.random() > 0.7) {
                currentKittyIndex = (currentKittyIndex + 1) % kittyImages.length;
            }
            
            playSound('paddle');
            playMeow();
        }
        
        // Check if a point was scored
        if (kitty.x < 0) {
            // Computer scores
            computerScore++;
            computerScoreDisplay.textContent = computerScore;
            
            // Score animation
            computerScoreDisplay.classList.add('score-update');
            setTimeout(() => {
                computerScoreDisplay.classList.remove('score-update');
            }, 500);
            
            // Create explosive particles
            createKittyParticles(kitty.x, kitty.y, 50);
            
            resetKitty();
            playSound('score');
            playMeow();
        } else if (kitty.x > canvas.width) {
            // Player scores
            playerScore++;
            playerScoreDisplay.textContent = playerScore;
            
            // Score animation
            playerScoreDisplay.classList.add('score-update');
            setTimeout(() => {
                playerScoreDisplay.classList.remove('score-update');
            }, 500);
            
            // Create explosive particles
            createKittyParticles(kitty.x, kitty.y, 50);
            
            resetKitty();
            playSound('score');
            playMeow();
        }
    }
    
    // Reset kitty after scoring
    function resetKitty() {
        kitty.x = canvas.width / 2 - kitty.width / 2;
        kitty.y = canvas.height / 2 - kitty.height / 2;
        kitty.speed = ballSpeed; // Reset speed
        kitty.dx = Math.random() > 0.5 ? kitty.speed : -kitty.speed;
        kitty.dy = Math.random() > 0.5 ? kitty.speed / 2 : -kitty.speed / 2; // Lower vertical speed for better gameplay
        kittyRotation = 0;
        rainbowTrail = [];
        
        // Change kitty
        currentKittyIndex = Math.floor(Math.random() * kittyImages.length);
    }
    
    // Sound effects
    function playSound(type) {
        // Use Web Audio API for sound effects
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different sounds for different events
        switch(type) {
            case 'paddle':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'wall':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
            case 'score':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(110, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
        }
    }
    
    // Clear canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw dashed line in middle
    function drawMiddleLine() {
        ctx.beginPath();
        ctx.setLineDash([5, 15]);
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.strokeStyle = '#9d4edd';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Main game loop
    function gameLoop(timestamp) {
        // Calculate delta time for smooth animations
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        if (gameRunning) {
            // Clear canvas
            clearCanvas();
            
            // Draw stars
            drawStars();
            
            // Update stars
            updateStars();
            
            // Draw rainbow trail
            drawRainbowTrail();
            
            // Draw center line
            drawMiddleLine();
            
            // Update particles
            updateParticles();
            updatePaddleSparkles();
            
            // Update game objects
            updatePlayerPaddle();
            updateComputerPaddle();
            updateKitty();
            
            // Draw game objects
            drawParticles();
            drawPaddleSparkles();
            drawPaddle(playerPaddle);
            drawPaddle(computerPaddle);
            drawKitty();
            
            // Continue game loop
            requestAnimationFrame(gameLoop);
        } else {
            // Clean up if game is stopped
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }
    }
    
    // Initial draw
    clearCanvas();
    drawStars();
    drawMiddleLine();
    drawPaddle(playerPaddle);
    drawPaddle(computerPaddle);
    drawKitty();
});