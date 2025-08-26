import Foundation
import SceneKit

protocol GameLogicDelegate: AnyObject {
    func didScore(isPlayer: Bool)
    func didHitPaddle()
    func didHitWall()
    func gameDidEnd()
    func updateScore(player: Int, computer: Int)
    func updateGameInfo(time: Int, difficulty: Int)
}

class GameLogic {
    
    weak var delegate: GameLogicDelegate?
    private let gameScene: GameScene
    
    // Game state
    private var isGameActive = false
    private var ballVelocity = SCNVector3(5.0, 3.6, 0)
    private var playerScore = 0
    private var computerScore = 0
    private var gameStartTime: TimeInterval = 0
    private var lastUpdateTime: TimeInterval = 0
    private var difficulty = 1
    
    // Paddle positions
    private var playerPaddleY: Float = 0
    private var computerPaddleY: Float = 0
    
    // Game constants (optimized for iPhone)
    private let paddleSpeed: Float = 3.0
    private let maxPaddleY: Float = 4.0
    private let minPaddleY: Float = -4.0
    private let scoreToWin = 7 // Shorter games for mobile
    private let ballSpeedIncrease: Float = 1.15
    
    // AI difficulty scaling
    private var aiReactionTime: Float = 0.1
    private var aiAccuracy: Float = 0.8
    
    init(scene: GameScene) {
        self.gameScene = scene
        setupPhysics()
    }
    
    private func setupPhysics() {
        // Add physics to the ball
        let ballShape = SCNSphere(radius: CGFloat(gameScene.ballRadius))
        gameScene.ball.physicsBody = SCNPhysicsBody(type: .dynamic, shape: SCNPhysicsShape(geometry: ballShape))
        gameScene.ball.physicsBody?.restitution = 1.0 // Perfect bouncing
        gameScene.ball.physicsBody?.friction = 0.0
        gameScene.ball.physicsBody?.damping = 0.0
        gameScene.ball.physicsBody?.angularDamping = 0.0
        gameScene.ball.physicsBody?.mass = 1.0
        gameScene.ball.physicsBody?.categoryBitMask = 1
        gameScene.ball.physicsBody?.contactTestBitMask = 2 | 4 | 8 | 16 | 32 // Paddles, walls and goals
        gameScene.ball.physicsBody?.collisionBitMask = 2 | 4 | 8 // Only collide with paddles and walls
        
        // Add physics to paddles (kinematic - controlled by code)
        setupPaddlePhysics(gameScene.playerPaddle, category: 2)
        setupPaddlePhysics(gameScene.computerPaddle, category: 4)
        
        // Add invisible physics walls
        createPhysicsWalls()
    }
    
    private func setupPaddlePhysics(_ paddle: SCNNode, category: Int) {
        let paddleShape = SCNBox(width: 0.5, height: CGFloat(gameScene.paddleHeight), length: 0.3, chamferRadius: 0)
        paddle.physicsBody = SCNPhysicsBody(type: .kinematic, shape: SCNPhysicsShape(geometry: paddleShape))
        paddle.physicsBody?.restitution = 1.0 // Perfect bouncing
        paddle.physicsBody?.friction = 0.0
        paddle.physicsBody?.categoryBitMask = category
        paddle.physicsBody?.contactTestBitMask = 1 // Ball only
        paddle.physicsBody?.collisionBitMask = 1 // Allow collision with ball
    }
    
    private func createPhysicsWalls() {
        // Top wall
        let topWall = SCNNode()
        topWall.position = SCNVector3(0, gameScene.fieldHeight/2 + 0.1, 0)
        let topShape = SCNBox(width: CGFloat(gameScene.fieldWidth + 2), height: 0.2, length: 1, chamferRadius: 0)
        topWall.physicsBody = SCNPhysicsBody(type: .static, shape: SCNPhysicsShape(geometry: topShape))
        topWall.physicsBody?.restitution = 0.7
        topWall.physicsBody?.friction = 0.1
        topWall.physicsBody?.categoryBitMask = 8
        topWall.physicsBody?.contactTestBitMask = 1
        gameScene.rootNode.addChildNode(topWall)
        
        // Bottom wall
        let bottomWall = SCNNode()
        bottomWall.position = SCNVector3(0, -gameScene.fieldHeight/2 - 0.1, 0)
        let bottomShape = SCNBox(width: CGFloat(gameScene.fieldWidth + 2), height: 0.2, length: 1, chamferRadius: 0)
        bottomWall.physicsBody = SCNPhysicsBody(type: .static, shape: SCNPhysicsShape(geometry: bottomShape))
        bottomWall.physicsBody?.restitution = 0.7
        bottomWall.physicsBody?.friction = 0.1
        bottomWall.physicsBody?.categoryBitMask = 8
        bottomWall.physicsBody?.contactTestBitMask = 1
        gameScene.rootNode.addChildNode(bottomWall)
        
        // Goal areas (invisible triggers)
        createGoalArea(x: -gameScene.fieldWidth/2 - 1, isPlayerGoal: false)
        createGoalArea(x: gameScene.fieldWidth/2 + 1, isPlayerGoal: true)
    }
    
    private func createGoalArea(x: Float, isPlayerGoal: Bool) {
        let goalArea = SCNNode()
        goalArea.position = SCNVector3(x, 0, 0)
        let goalShape = SCNBox(width: 0.2, height: CGFloat(gameScene.fieldHeight), length: 1, chamferRadius: 0)
        goalArea.physicsBody = SCNPhysicsBody(type: .static, shape: SCNPhysicsShape(geometry: goalShape))
        goalArea.physicsBody?.categoryBitMask = isPlayerGoal ? 16 : 32
        goalArea.physicsBody?.contactTestBitMask = 1
        goalArea.name = isPlayerGoal ? "playerGoal" : "computerGoal"
        gameScene.rootNode.addChildNode(goalArea)
    }
    
    // MARK: - Public Methods
    
    func startGame() {
        isGameActive = true
        playerScore = 0
        computerScore = 0
        difficulty = 1
        gameStartTime = 0
        aiReactionTime = 0.1
        aiAccuracy = 0.8
        resetBall()
        resetPaddles()
        delegate?.updateScore(player: playerScore, computer: computerScore)
    }
    
    func update(time: TimeInterval) {
        guard isGameActive else { return }
        
        if gameStartTime == 0 {
            gameStartTime = time
            lastUpdateTime = time
        }
        
        let deltaTime = time - lastUpdateTime
        lastUpdateTime = time
        
        updateBall(deltaTime: deltaTime)
        updateComputerAI(deltaTime: deltaTime)
        updateDifficulty(gameTime: time - gameStartTime)
        
        gameScene.updateBallTrail()
        
        // Update delegate with game info
        let gameTime = Int(time - gameStartTime)
        delegate?.updateGameInfo(time: gameTime, difficulty: difficulty)
    }
    
    func updatePlayerPaddle(normalizedPosition: Float) {
        // Convert normalized position (-1 to 1) to game coordinates
        playerPaddleY = normalizedPosition * maxPaddleY
        playerPaddleY = max(minPaddleY, min(maxPaddleY, playerPaddleY))
        gameScene.setPlayerPaddleY(playerPaddleY)
    }
    
    func handlePhysicsContact(_ contact: SCNPhysicsContact) {
        let nodeA = contact.nodeA
        let nodeB = contact.nodeB
        
        // Determine which node is the ball
        let ballNode = nodeA.name == "ball" ? nodeA : nodeB
        let otherNode = nodeA.name == "ball" ? nodeB : nodeA
        
        guard ballNode.name == "ball" else { return }
        
        // Handle different collision types
        if otherNode.name == "playerPaddle" || otherNode.name == "computerPaddle" {
            handlePaddleHit(ballNode: ballNode, paddleNode: otherNode)
            delegate?.didHitPaddle()
        }
        else if otherNode.physicsBody?.categoryBitMask == 8 { // Wall
            delegate?.didHitWall()
            addWallHitEffect(at: contact.contactPoint)
        }
        else if otherNode.name == "playerGoal" {
            handleGoal(isPlayerScore: true)
        }
        else if otherNode.name == "computerGoal" {
            handleGoal(isPlayerScore: false)
        }
    }
    
    private func handlePaddleHit(ballNode: SCNNode, paddleNode: SCNNode) {
        guard let ballPhysics = ballNode.physicsBody else { return }
        
        // Get current velocity and calculate speed
        let velocity = ballPhysics.velocity
        let currentSpeed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
        let baseSpeed: Float = max(currentSpeed * ballSpeedIncrease, 5.0) // Doubled minimum speed
        
        // Calculate new direction based on paddle position and ball position
        let ballY = ballNode.position.y
        let paddleY = paddleNode.position.y
        let relativeIntersectY = ballY - paddleY
        let normalizedIntersectY = max(-1.0, min(1.0, relativeIntersectY / (gameScene.paddleHeight / 2)))
        
        // Determine direction based on which paddle - ball should bounce away from paddle
        let direction: Float = paddleNode.name == "playerPaddle" ? 1.0 : -1.0
        
        // Calculate bounce angle based on where ball hits paddle (max 75 degrees for variety)
        let maxAngle: Float = Float.pi * 5.0 / 12.0 // 75 degrees
        let bounceAngle = normalizedIntersectY * maxAngle
        
        // Calculate new velocity with much higher speed - aggressive gameplay
        let newSpeed = min(baseSpeed, 9.0) // Doubled max speed cap
        let newVelocityX = direction * newSpeed * cos(bounceAngle)
        let newVelocityY = newSpeed * sin(bounceAngle)
        
        // Apply the new velocity
        ballPhysics.velocity = SCNVector3(newVelocityX, newVelocityY, 0)
        
        // Add paddle hit effect
        addPaddleHitEffect(at: ballNode.position, paddleNode: paddleNode)
    }
    
    private func handleGoal(isPlayerScore: Bool) {
        if isPlayerScore {
            playerScore += 1
        } else {
            computerScore += 1
        }
        
        delegate?.didScore(isPlayer: isPlayerScore)
        delegate?.updateScore(player: playerScore, computer: computerScore)
        gameScene.animateScore(isPlayerScore: isPlayerScore)
        
        // Check for game end
        if playerScore >= scoreToWin || computerScore >= scoreToWin {
            endGame()
        } else {
            // Reset for next point
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.resetBall()
            }
        }
    }
    
    private func updateBall(deltaTime: TimeInterval) {
        // Ball physics are handled by SceneKit, but we can add custom effects here
        guard let ballPhysics = gameScene.ball.physicsBody else { return }
        
        // Ensure minimum speed to prevent ball getting stuck
        let velocity = ballPhysics.velocity
        let speed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
        
        if speed < 4.0 {
            // Give the ball a massive push if it's moving too slowly - ultra aggressive
            let direction = velocity.x > 0 ? 1.0 : -1.0
            ballPhysics.velocity = SCNVector3(Float(direction) * 5.0, velocity.y * 1.5, 0)
        }
    }
    
    private func updateComputerAI(deltaTime: TimeInterval) {
        guard let ball = gameScene.ball else { return }
        
        let ballPosition = ball.position
        let ballVelocity = ball.physicsBody?.velocity ?? SCNVector3Zero
        
        // Predict where the ball will be when it reaches the paddle
        let timeToReachPaddle = (gameScene.fieldWidth/2 - 1 - ballPosition.x) / max(ballVelocity.x, 0.01)
        let predictedY = ballPosition.y + ballVelocity.y * timeToReachPaddle
        
        // Add some randomness based on difficulty
        let errorMargin = (1.0 - aiAccuracy) * gameScene.paddleHeight
        let targetY = predictedY + Float.random(in: -errorMargin...errorMargin)
        
        // Move towards target with reaction delay
        let currentY = computerPaddleY
        let diff = targetY - currentY
        
        if abs(diff) > aiReactionTime {
            let moveSpeed = paddleSpeed * Float(deltaTime) * 60.0 * Float(difficulty)
            if diff > 0 {
                computerPaddleY = min(computerPaddleY + moveSpeed, maxPaddleY)
            } else {
                computerPaddleY = max(computerPaddleY - moveSpeed, minPaddleY)
            }
            gameScene.setComputerPaddleY(computerPaddleY)
        }
    }
    
    private func updateDifficulty(gameTime: TimeInterval) {
        let newDifficulty = Int(gameTime / 15) + 1 // Increase every 15 seconds
        if newDifficulty > difficulty {
            difficulty = newDifficulty
            // Make AI faster and more accurate
            aiReactionTime = max(0.05, aiReactionTime * 0.9)
            aiAccuracy = min(0.95, aiAccuracy + 0.05)
        }
    }
    
    private func resetBall() {
        gameScene.resetBallPosition()
        
        // Wait a moment before applying velocity to ensure physics is stable
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            // Random initial direction toward player or computer
            let direction: Float = Bool.random() ? 1 : -1 // 1 = toward player, -1 = toward computer
            let baseSpeed: Float = 5.6 // Doubled extremely fast initial speed
            let angle = Float.random(in: -0.4...0.4) // Slight vertical angle
            
            // Start ball moving fast horizontally with slight vertical component
            let initialVelocity = SCNVector3(
                direction * baseSpeed,
                angle * baseSpeed * 0.3, // Some vertical component
                0
            )
            
            self.gameScene.ball.physicsBody?.velocity = initialVelocity
        }
    }
    
    private func resetPaddles() {
        playerPaddleY = 0
        computerPaddleY = 0
        gameScene.setPlayerPaddleY(playerPaddleY)
        gameScene.setComputerPaddleY(computerPaddleY)
    }
    
    private func endGame() {
        isGameActive = false
        delegate?.gameDidEnd()
    }
    
    // MARK: - Visual Effects
    
    private func addPaddleHitEffect(at position: SCNVector3, paddleNode: SCNNode) {
        // Create a burst of particles at hit location
        let hitEffect = SCNParticleSystem()
        hitEffect.particleColor = paddleNode.name == "playerPaddle" ? 
            UIColor(red: 0.0, green: 0.8, blue: 1.0, alpha: 1.0) : 
            UIColor(red: 1.0, green: 0.0, blue: 0.5, alpha: 1.0)
        hitEffect.particleSize = 0.05
        hitEffect.birthRate = 50
        hitEffect.particleLifeSpan = 0.3
        hitEffect.particleVelocity = 2.0
        hitEffect.particleVelocityVariation = 1.0
        hitEffect.emissionDuration = 0.1
        hitEffect.blendMode = .additive
        
        let effectNode = SCNNode()
        effectNode.position = position
        effectNode.addParticleSystem(hitEffect)
        gameScene.rootNode.addChildNode(effectNode)
        
        // Remove effect node after animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            effectNode.removeFromParentNode()
        }
    }
    
    private func addWallHitEffect(at position: SCNVector3) {
        // Create wall hit sparkles
        let wallEffect = SCNParticleSystem()
        wallEffect.particleColor = UIColor.white
        wallEffect.particleSize = 0.03
        wallEffect.birthRate = 30
        wallEffect.particleLifeSpan = 0.2
        wallEffect.particleVelocity = 1.0
        wallEffect.particleVelocityVariation = 0.5
        wallEffect.emissionDuration = 0.05
        wallEffect.blendMode = .additive
        
        let effectNode = SCNNode()
        effectNode.position = position
        effectNode.addParticleSystem(wallEffect)
        gameScene.rootNode.addChildNode(effectNode)
        
        // Remove effect node after animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            effectNode.removeFromParentNode()
        }
    }
    
    // MARK: - Getters
    
    func getScore() -> (player: Int, computer: Int) {
        return (playerScore, computerScore)
    }
    
    func getGameInfo() -> (time: Int, difficulty: Int) {
        let gameTime = Int(lastUpdateTime - gameStartTime)
        return (gameTime, difficulty)
    }
    
    func isActive() -> Bool {
        return isGameActive
    }
}