import SceneKit
import UIKit

class GameScene: SCNScene {
    
    // Game objects
    var playerPaddle: SCNNode!
    var computerPaddle: SCNNode!
    var ball: SCNNode!
    var field: SCNNode!
    
    // Visual effects
    var ballTrail: [SCNNode] = []
    var cornerLights: [SCNNode] = []
    var particleSystem: SCNParticleSystem!
    
    // Game dimensions (optimized for iPhone)
    let fieldWidth: Float = 16
    let fieldHeight: Float = 10
    let paddleHeight: Float = 2.5
    let ballRadius: Float = 0.3
    
    override init() {
        super.init()
        setupScene()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupScene()
    }
    
    private func setupScene() {
        setupLighting()
        setupField()
        setupPaddles()
        setupBall()
        setupVisualEffects()
    }
    
    private func setupLighting() {
        // Ambient lighting for overall visibility
        let ambientLight = SCNLight()
        ambientLight.type = .ambient
        ambientLight.color = UIColor.white
        ambientLight.intensity = 300
        
        let ambientNode = SCNNode()
        ambientNode.light = ambientLight
        rootNode.addChildNode(ambientNode)
        
        // Main directional light
        let directionalLight = SCNLight()
        directionalLight.type = .directional
        directionalLight.color = UIColor.white
        directionalLight.intensity = 800
        directionalLight.castsShadow = true
        directionalLight.shadowRadius = 5
        directionalLight.shadowColor = UIColor(white: 0, alpha: 0.3)
        
        let lightNode = SCNNode()
        lightNode.light = directionalLight
        lightNode.position = SCNVector3(0, 10, 10)
        lightNode.eulerAngles = SCNVector3(-Float.pi/4, 0, 0)
        rootNode.addChildNode(lightNode)
    }
    
    private func setupField() {
        // Create invisible playing field boundaries
        let fieldGeometry = SCNBox(width: CGFloat(fieldWidth), height: CGFloat(fieldHeight), length: 0.1, chamferRadius: 0)
        let fieldMaterial = SCNMaterial()
        fieldMaterial.diffuse.contents = UIColor.clear
        fieldGeometry.materials = [fieldMaterial]
        
        field = SCNNode(geometry: fieldGeometry)
        field.position = SCNVector3(0, 0, -1)
        rootNode.addChildNode(field)
        
        // Create glowing field boundaries
        createFieldBoundaries()
        
        // Add center line
        createCenterLine()
    }
    
    private func createFieldBoundaries() {
        let lineRadius: Float = 0.05
        let glowColor = UIColor(red: 0.0, green: 0.8, blue: 1.0, alpha: 1.0) // Cyan
        
        // Top boundary
        createGlowingLine(
            from: SCNVector3(-fieldWidth/2, fieldHeight/2, 0),
            to: SCNVector3(fieldWidth/2, fieldHeight/2, 0),
            radius: lineRadius,
            color: glowColor
        )
        
        // Bottom boundary
        createGlowingLine(
            from: SCNVector3(-fieldWidth/2, -fieldHeight/2, 0),
            to: SCNVector3(fieldWidth/2, -fieldHeight/2, 0),
            radius: lineRadius,
            color: glowColor
        )
    }
    
    private func createCenterLine() {
        let lineRadius: Float = 0.03
        let centerColor = UIColor(red: 1.0, green: 0.0, blue: 0.5, alpha: 0.7) // Semi-transparent magenta
        
        createGlowingLine(
            from: SCNVector3(0, -fieldHeight/2, 0),
            to: SCNVector3(0, fieldHeight/2, 0),
            radius: lineRadius,
            color: centerColor
        )
    }
    
    private func createGlowingLine(from start: SCNVector3, to end: SCNVector3, radius: Float, color: UIColor) {
        let distance = sqrt(pow(end.x - start.x, 2) + pow(end.y - start.y, 2) + pow(end.z - start.z, 2))
        
        let cylinder = SCNCylinder(radius: CGFloat(radius), height: CGFloat(distance))
        let material = SCNMaterial()
        material.diffuse.contents = color
        material.emission.contents = color
        material.lightingModel = .constant
        cylinder.materials = [material]
        
        let lineNode = SCNNode(geometry: cylinder)
        lineNode.position = SCNVector3(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2,
            (start.z + end.z) / 2
        )
        
        // Orient the cylinder
        if abs(end.y - start.y) > abs(end.x - start.x) {
            // Vertical line - no rotation needed
        } else {
            // Horizontal line
            lineNode.eulerAngles.z = Float.pi / 2
        }
        
        rootNode.addChildNode(lineNode)
        
        // Add glow effect
        let glowLight = SCNLight()
        glowLight.type = .omni
        glowLight.color = color
        glowLight.intensity = 200
        glowLight.attenuationEndDistance = 3
        
        let glowNode = SCNNode()
        glowNode.light = glowLight
        glowNode.position = lineNode.position
        rootNode.addChildNode(glowNode)
    }
    
    private func setupPaddles() {
        // Player paddle (left side - cyan)
        let paddleGeometry = SCNBox(width: 0.3, height: CGFloat(paddleHeight), length: 0.5, chamferRadius: 0.1)
        
        let playerMaterial = SCNMaterial()
        playerMaterial.diffuse.contents = UIColor(red: 0.0, green: 0.8, blue: 1.0, alpha: 1.0) // Cyan
        playerMaterial.emission.contents = UIColor(red: 0.0, green: 0.4, blue: 0.5, alpha: 1.0)
        playerMaterial.specular.contents = UIColor.white
        playerMaterial.shininess = 100
        paddleGeometry.materials = [playerMaterial]
        
        playerPaddle = SCNNode(geometry: paddleGeometry)
        playerPaddle.position = SCNVector3(-fieldWidth/2 + 1, 0, 0)
        playerPaddle.name = "playerPaddle"
        rootNode.addChildNode(playerPaddle)
        
        // Computer paddle (right side - magenta)
        let computerGeometry = SCNBox(width: 0.3, height: CGFloat(paddleHeight), length: 0.5, chamferRadius: 0.1)
        
        let computerMaterial = SCNMaterial()
        computerMaterial.diffuse.contents = UIColor(red: 1.0, green: 0.0, blue: 0.5, alpha: 1.0) // Magenta
        computerMaterial.emission.contents = UIColor(red: 0.5, green: 0.0, blue: 0.25, alpha: 1.0)
        computerMaterial.specular.contents = UIColor.white
        computerMaterial.shininess = 100
        computerGeometry.materials = [computerMaterial]
        
        computerPaddle = SCNNode(geometry: computerGeometry)
        computerPaddle.position = SCNVector3(fieldWidth/2 - 1, 0, 0)
        computerPaddle.name = "computerPaddle"
        rootNode.addChildNode(computerPaddle)
        
        // Add paddle glow lights
        addPaddleGlow(to: playerPaddle, color: UIColor(red: 0.0, green: 0.8, blue: 1.0, alpha: 1.0))
        addPaddleGlow(to: computerPaddle, color: UIColor(red: 1.0, green: 0.0, blue: 0.5, alpha: 1.0))
    }
    
    private func addPaddleGlow(to paddle: SCNNode, color: UIColor) {
        let glowLight = SCNLight()
        glowLight.type = .omni
        glowLight.color = color
        glowLight.intensity = 500
        glowLight.attenuationEndDistance = 4
        
        let glowNode = SCNNode()
        glowNode.light = glowLight
        paddle.addChildNode(glowNode)
        
        // Animate the glow intensity
        let pulseAnimation = CABasicAnimation(keyPath: "light.intensity")
        pulseAnimation.fromValue = 300
        pulseAnimation.toValue = 700
        pulseAnimation.duration = 1.0
        pulseAnimation.repeatCount = .infinity
        pulseAnimation.autoreverses = true
        glowNode.addAnimation(pulseAnimation, forKey: "pulse")
    }
    
    private func setupBall() {
        // Create ball with kitty face texture
        let ballGeometry = SCNSphere(radius: CGFloat(ballRadius))
        let ballMaterial = createKittyMaterial()
        ballGeometry.materials = [ballMaterial]
        
        ball = SCNNode(geometry: ballGeometry)
        ball.position = SCNVector3(0, 0, 0)
        ball.name = "ball"
        rootNode.addChildNode(ball)
        
        // Add ball glow
        let ballLight = SCNLight()
        ballLight.type = .omni
        ballLight.color = UIColor(red: 1.0, green: 0.8, blue: 0.0, alpha: 1.0) // Golden yellow
        ballLight.intensity = 300
        ballLight.attenuationEndDistance = 2
        
        let ballGlowNode = SCNNode()
        ballGlowNode.light = ballLight
        ball.addChildNode(ballGlowNode)
    }
    
    private func createKittyMaterial() -> SCNMaterial {
        let material = SCNMaterial()
        
        // Create a simple colored ball for now - can be enhanced with actual kitty texture later
        material.diffuse.contents = UIColor(red: 1.0, green: 0.8, blue: 0.0, alpha: 1.0) // Golden yellow
        material.emission.contents = UIColor(red: 0.5, green: 0.4, blue: 0.0, alpha: 1.0)
        material.specular.contents = UIColor.white
        material.shininess = 50
        
        return material
    }
    
    private func setupVisualEffects() {
        // Create particle system for ball trail
        particleSystem = SCNParticleSystem()
        particleSystem.particleColor = UIColor(red: 1.0, green: 0.8, blue: 0.0, alpha: 0.8)
        particleSystem.particleColorVariation = SCNVector4(0.2, 0.2, 0.0, 0.0)
        particleSystem.particleSize = 0.1
        particleSystem.particleSizeVariation = 0.05
        particleSystem.birthRate = 50
        particleSystem.particleLifeSpan = 0.5
        particleSystem.particleVelocity = 0
        particleSystem.particleVelocityVariation = 0.1
        particleSystem.emissionDuration = 0
        particleSystem.loops = true
        particleSystem.blendMode = .additive
        
        ball.addParticleSystem(particleSystem)
    }
    
    // MARK: - Public Methods for Game Logic
    
    func setPlayerPaddleY(_ y: Float) {
        let clampedY = max(-fieldHeight/2 + paddleHeight/2, min(fieldHeight/2 - paddleHeight/2, y))
        playerPaddle.position.y = clampedY
    }
    
    func setComputerPaddleY(_ y: Float) {
        let clampedY = max(-fieldHeight/2 + paddleHeight/2, min(fieldHeight/2 - paddleHeight/2, y))
        computerPaddle.position.y = clampedY
    }
    
    func resetBallPosition() {
        ball.position = SCNVector3(0, 0, 0)
        ball.physicsBody?.velocity = SCNVector3Zero
        ball.physicsBody?.angularVelocity = SCNVector4Zero
    }
    
    func animateScore(isPlayerScore: Bool) {
        let paddle = isPlayerScore ? playerPaddle : computerPaddle
        _ = paddle?.scale ?? SCNVector3(1, 1, 1)
        
        // Scale up animation
        let scaleUp = SCNAction.scale(to: 1.3, duration: 0.1)
        let scaleDown = SCNAction.scale(to: 1.0, duration: 0.1)
        let sequence = SCNAction.sequence([scaleUp, scaleDown])
        
        paddle?.runAction(sequence)
        
        // Flash the field boundaries
        flashFieldBoundaries()
    }
    
    private func flashFieldBoundaries() {
        // Find all boundary nodes and flash them
        rootNode.childNodes.forEach { node in
            if node.geometry is SCNCylinder {
                let flashAnimation = CABasicAnimation(keyPath: "opacity")
                flashAnimation.fromValue = 1.0
                flashAnimation.toValue = 0.3
                flashAnimation.duration = 0.2
                flashAnimation.autoreverses = true
                flashAnimation.repeatCount = 3
                node.addAnimation(flashAnimation, forKey: "flash")
            }
        }
    }
    
    func updateBallTrail() {
        // Simple trail effect - could be enhanced further
        particleSystem.birthRate = ball.physicsBody?.velocity.length() ?? 0 > 0.1 ? 100 : 10
    }
}

// Extension for vector calculations
extension SCNVector3 {
    func length() -> Float {
        return sqrt(x*x + y*y + z*z)
    }
}