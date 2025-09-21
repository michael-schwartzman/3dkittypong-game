import Foundation
import SceneKit

protocol GameLogicDelegate: AnyObject {
    func didScore(isPlayer: Bool)
    func didHitPaddle()
    func didHitWall()
    func gameDidEnd()
}

class GameLogic {
    
    weak var delegate: GameLogicDelegate?
    private let gameScene: GameScene
    
    // Game state
    private var isGameActive = false
    private var ballVelocity = SCNVector3(0.15, 0.1, 0)
    private var playerScore = 0
    private var computerScore = 0
    private var gameStartTime: TimeInterval = 0
    private var lastUpdateTime: TimeInterval = 0
    private var difficulty = 1
    
    // Paddle positions
    private var playerPaddleY: Float = 0
    private var computerPaddleY: Float = 0
    
    // Game constants
    private let fieldWidth: Float = 30
    private let fieldHeight: Float = 20
    private let paddleHeight: Float = 4
    private let ballRadius: Float = 0.3
    private let paddleSpeed: Float = 0.08
    private let maxPaddleY: Float = 8
    private let minPaddleY: Float = -8
    private let scoreToWin = 11
    
    init(scene: GameScene) {
        self.gameScene = scene
    }
    
    // MARK: - Public Methods
    
    func startGame() {
        isGameActive = true
        playerScore = 0
        computerScore = 0
        difficulty = 1
        gameStartTime = 0
        resetBall()
        resetPaddles()
    }
    
    func update(time: TimeInterval) {
        if !isGameActive { return }
        
        if gameStartTime == 0 {
            gameStartTime = time
            lastUpdateTime = time
        }
        
        let deltaTime = time - lastUpdateTime
        lastUpdateTime = time
        
        updateBall(deltaTime: deltaTime)
        updateComputerAI(deltaTime: deltaTime)
        updateDifficulty(gameTime: time - gameStartTime)
        
        gameScene.animateCornerLights(time: time)
        gameScene.updateBallTrail()
    }
    
    func updatePlayerPaddle(normalizedPosition: Float) {
        // Convert normalized position (-1 to 1) to game coordinates
        playerPaddleY = normalizedPosition * maxPaddleY
        playerPaddleY = max(minPaddleY, min(maxPaddleY, playerPaddleY))
        gameScene.setPlayerPaddleY(playerPaddleY)
    }
    
    func getScore() -> (player: Int, computer: Int) {
        return (playerScore, computerScore)
    }
    
    func getGameInfo() -> (time: Int, difficulty: Int) {
        let gameTime = Int(lastUpdateTime - gameStartTime)
        return (gameTime, difficulty)
    }
    
    // MARK: - Private Methods
    
    private func updateBall(deltaTime: TimeInterval) {
        guard let ball = gameScene.ball else { return }
        
        // Update ball position with proper deltaTime scaling
        let dt = Float(deltaTime * 60.0) // Scale for 60 FPS equivalent
        ball.position.x += ballVelocity.x * dt
        ball.position.y += ballVelocity.y * dt
        ball.position.z += ballVelocity.z * dt
        
        // Ball collision with top and bottom walls
        if ball.position.y > (fieldHeight/2 - ballRadius) || ball.position.y < -(fieldHeight/2 - ballRadius) {
            ballVelocity.y *= -1
            delegate?.didHitWall()
        }
        
        // Ball collision with paddles
        checkPaddleCollisions()
        
        // Check for scoring
        checkScoring()
    }
    
    private func checkPaddleCollisions() {
        guard let ball = gameScene.ball else { return }
        
        // Player paddle collision (left side)
        if ball.position.x <= -13.5 && ball.position.x >= -14.5 {
            if ball.position.y >= playerPaddleY - paddleHeight/2 &&
               ball.position.y <= playerPaddleY + paddleHeight/2 {
                ballVelocity.x = abs(ballVelocity.x) * Float(difficulty) * 1.1
                ballVelocity.y += (ball.position.y - playerPaddleY) * 0.1
                delegate?.didHitPaddle()
            }
        }
        
        // Computer paddle collision (right side)
        if ball.position.x >= 13.5 && ball.position.x <= 14.5 {
            if ball.position.y >= computerPaddleY - paddleHeight/2 &&
               ball.position.y <= computerPaddleY + paddleHeight/2 {
                ballVelocity.x = -abs(ballVelocity.x) * Float(difficulty) * 1.1
                ballVelocity.y += (ball.position.y - computerPaddleY) * 0.1
                delegate?.didHitPaddle()
            }
        }
    }
    
    private func checkScoring() {
        guard let ball = gameScene.ball else { return }
        
        // Player scores (ball goes past computer paddle)
        if ball.position.x > fieldWidth/2 {
            playerScore += 1
            delegate?.didScore(isPlayer: true)
            resetBall()
            
            if playerScore >= scoreToWin {
                endGame()
            }
        }
        
        // Computer scores (ball goes past player paddle)
        if ball.position.x < -fieldWidth/2 {
            computerScore += 1
            delegate?.didScore(isPlayer: false)
            resetBall()
            
            if computerScore >= scoreToWin {
                endGame()
            }
        }
    }
    
    private func updateComputerAI(deltaTime: TimeInterval) {
        guard let ball = gameScene.ball else { return }
        
        let targetY = ball.position.y
        let dt = Float(deltaTime * 60.0) // Scale for 60 FPS equivalent
        let aiSpeed = paddleSpeed * Float(difficulty) * dt
        
        if computerPaddleY < targetY {
            computerPaddleY = min(computerPaddleY + aiSpeed, targetY)
        } else {
            computerPaddleY = max(computerPaddleY - aiSpeed, targetY)
        }
        
        computerPaddleY = max(minPaddleY, min(maxPaddleY, computerPaddleY))
        gameScene.setComputerPaddleY(computerPaddleY)
    }
    
    private func updateDifficulty(gameTime: TimeInterval) {
        let newDifficulty = Int(gameTime / 10) + 1
        if newDifficulty > difficulty {
            difficulty = newDifficulty
            // Increase ball speed slightly
            ballVelocity.x *= 1.05
            ballVelocity.y *= 1.05
        }
    }
    
    private func resetBall() {
        gameScene.resetBallPosition()
        
        // Random initial direction
        let direction: Float = Bool.random() ? 1 : -1
        let baseSpeed: Float = 0.15 * Float(difficulty)
        
        ballVelocity = SCNVector3(
            direction * baseSpeed,
            Float.random(in: -0.1...0.1),
            0
        )
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
}