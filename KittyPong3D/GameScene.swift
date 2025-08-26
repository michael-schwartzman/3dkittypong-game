import SceneKit
import UIKit

class GameScene: SCNScene {
    
    // Game objects
    var playerPaddle: SCNNode!
    var computerPaddle: SCNNode!
    var ball: SCNNode!
    var ballTrail: [SCNNode] = []
    var field: SCNNode!
    var cornerLights: [SCNNode] = []
    var particles: SCNNode!
    var particleVelocities: [SCNVector3] = []
    
    // Lighting
    var ambientLight: SCNNode!
    var directionalLight: SCNNode!
    
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
        setupCamera()
        setupCornerEffects()
        setupParticleSystem()
    }
    
    private func setupLighting() {
        // Ambient light
        ambientLight = SCNNode()
        ambientLight.light = SCNLight()
        ambientLight.light!.type = .ambient
        ambientLight.light!.color = UIColor.white
        ambientLight.light!.intensity = 500
        rootNode.addChildNode(ambientLight)
        
        // Directional light
        directionalLight = SCNNode()
        directionalLight.light = SCNLight()
        directionalLight.light!.type = .directional
        directionalLight.light!.color = UIColor.white
        directionalLight.light!.intensity = 1000
        directionalLight.position = SCNVector3(5, 5, 5)
        directionalLight.look(at: SCNVector3(0, 0, 0))
        rootNode.addChildNode(directionalLight)
    }
    
    private func setupField() {
        // Create field boundaries - invisible box with glowing edges (like web version)
        let fieldGeometry = SCNBox(width: 30, height: 20, length: 1, chamferRadius: 0)
        let fieldMaterial = SCNMaterial()
        fieldMaterial.diffuse.contents = UIColor.clear
        fieldGeometry.materials = [fieldMaterial]
        
        field = SCNNode(geometry: fieldGeometry)
        field.position = SCNVector3(0, 0, -0.5)
        rootNode.addChildNode(field)
        
        // Add glowing edge lines that match the web version
        createGlowingEdges()
    }
    
    private func createGlowingEdges() {
        // Create animated rainbow edges like web version
        let lineWidth: Float = 0.1
        
        // Store edge materials for animation
        let edgePositions: [(start: SCNVector3, end: SCNVector3)] = [
            (SCNVector3(-15, 10, 0), SCNVector3(15, 10, 0)),
            (SCNVector3(-15, -10, 0), SCNVector3(15, -10, 0)),
            (SCNVector3(-15, -10, 0), SCNVector3(-15, 10, 0)),
            (SCNVector3(15, -10, 0), SCNVector3(15, 10, 0))
        ]
        
        for edge in edgePositions {
            let line = createAnimatedLine(from: edge.start, to: edge.end, width: lineWidth)
            rootNode.addChildNode(line)
        }
    }
    
    private func createAnimatedLine(from start: SCNVector3, to end: SCNVector3, width: Float) -> SCNNode {
        let distance = distance3D(start, end)
        let cylinder = SCNCylinder(radius: CGFloat(width), height: CGFloat(distance))
        
        let material = SCNMaterial()
        material.emission.contents = UIColor(red: 0.62, green: 0.31, blue: 0.87, alpha: 1.0)
        material.diffuse.contents = UIColor(red: 0.62, green: 0.31, blue: 0.87, alpha: 1.0)
        cylinder.materials = [material]
        
        let lineNode = SCNNode(geometry: cylinder)
        lineNode.name = "fieldEdge"
        
        lineNode.position = SCNVector3(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2,
            (start.z + end.z) / 2
        )
        
        let direction = SCNVector3(end.x - start.x, end.y - start.y, end.z - start.z)
        lineNode.look(at: SCNVector3(lineNode.position.x + direction.x,
                                   lineNode.position.y + direction.y,
                                   lineNode.position.z + direction.z))
        lineNode.eulerAngles.x += Float.pi / 2
        
        return lineNode
    }
    
    private func distance3D(_ a: SCNVector3, _ b: SCNVector3) -> Float {
        let dx = a.x - b.x
        let dy = a.y - b.y
        let dz = a.z - b.z
        return sqrt(dx*dx + dy*dy + dz*dz)
    }
    
    private func setupPaddles() {
        // Player paddle (left, cyan like web version)
        let paddleGeometry = SCNBox(width: 0.5, height: 4, length: 1, chamferRadius: 0)
        
        let playerMaterial = SCNMaterial()
        playerMaterial.diffuse.contents = UIColor(red: 0, green: 0.8, blue: 1, alpha: 1) // Cyan #00ccff
        playerMaterial.emission.contents = UIColor(red: 0, green: 0.8, blue: 1, alpha: 0.7) // Emissive glow
        playerMaterial.specular.contents = UIColor.white
        playerMaterial.shininess = 100
        paddleGeometry.materials = [playerMaterial]
        
        playerPaddle = SCNNode(geometry: paddleGeometry)
        playerPaddle.position = SCNVector3(-14, 0, 0)
        playerPaddle.name = "playerPaddle"
        rootNode.addChildNode(playerPaddle)
        
        // Computer paddle (right, magenta like web version)
        let computerMaterial = SCNMaterial()
        computerMaterial.diffuse.contents = UIColor(red: 1, green: 0, blue: 0.5, alpha: 1) // Magenta #ff0080
        computerMaterial.emission.contents = UIColor(red: 1, green: 0, blue: 0.5, alpha: 0.7) // Emissive glow
        computerMaterial.specular.contents = UIColor.white
        computerMaterial.shininess = 100
        
        let computerGeometry = SCNBox(width: 0.5, height: 4, length: 1, chamferRadius: 0)
        computerGeometry.materials = [computerMaterial]
        
        computerPaddle = SCNNode(geometry: computerGeometry)
        computerPaddle.position = SCNVector3(14, 0, 0)
        computerPaddle.name = "computerPaddle"
        rootNode.addChildNode(computerPaddle)
        
        // Add paddle glow lights with color animation
        let playerGlow = SCNLight()
        playerGlow.type = .omni
        playerGlow.color = UIColor(red: 0, green: 0.8, blue: 1, alpha: 1)
        playerGlow.intensity = 1500
        playerGlow.attenuationEndDistance = 6
        
        let playerGlowNode = SCNNode()
        playerGlowNode.light = playerGlow
        playerGlowNode.position = SCNVector3(-14, 0, 0)
        playerGlowNode.name = "playerGlow"
        rootNode.addChildNode(playerGlowNode)
        
        let computerGlow = SCNLight()
        computerGlow.type = .omni
        computerGlow.color = UIColor(red: 1, green: 0, blue: 0.5, alpha: 1)
        computerGlow.intensity = 1500
        computerGlow.attenuationEndDistance = 6
        
        let computerGlowNode = SCNNode()
        computerGlowNode.light = computerGlow
        computerGlowNode.position = SCNVector3(14, 0, 0)
        computerGlowNode.name = "computerGlow"
        rootNode.addChildNode(computerGlowNode)
    }
    
    private func setupBall() {
        // Kitty ball with animated face like web version
        let ballGeometry = SCNSphere(radius: 1.0) // Larger like web version
        let ballMaterial = createKittyFaceMaterial()
        ballGeometry.materials = [ballMaterial]
        
        ball = SCNNode(geometry: ballGeometry)
        ball.position = SCNVector3(0, 0, 0)
        ball.name = "ball"
        rootNode.addChildNode(ball)
        
        // Optimized ball trail for performance
        for i in 0..<8 {
            let trailGeometry = SCNSphere(radius: 0.3)
            let trailMaterial = SCNMaterial()
            
            // Rainbow trail colors
            let hue = (Float(i) / 15.0 * 0.6) + 0.7
            let trailColor = UIColor(hue: CGFloat(hue.truncatingRemainder(dividingBy: 1.0)), saturation: 1.0, brightness: 0.5, alpha: 1.0)
            trailMaterial.diffuse.contents = trailColor
            trailMaterial.emission.contents = trailColor
            trailMaterial.transparency = CGFloat(0.7 * (1.0 - Float(i) / 15.0))
            trailGeometry.materials = [trailMaterial]
            
            let trailNode = SCNNode(geometry: trailGeometry)
            trailNode.position = SCNVector3(0, 0, -Float(i) * 0.1)
            trailNode.scale = SCNVector3(0.2 + Float(i) * 0.05, 0.2 + Float(i) * 0.05, 0.2)
            ballTrail.append(trailNode)
            rootNode.addChildNode(trailNode)
        }
    }
    
    private func createKittyFaceMaterial() -> SCNMaterial {
        let material = SCNMaterial()
        
        // Create a kitty face texture
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 256, height: 256))
        let kittyImage = renderer.image { context in
            let rect = CGRect(x: 0, y: 0, width: 256, height: 256)
            let cgContext = context.cgContext
            
            // Pink kitty base
            cgContext.setFillColor(UIColor(red: 1.0, green: 0.75, blue: 0.8, alpha: 1.0).cgColor)
            cgContext.fillEllipse(in: rect)
            
            // Kitty face - using simple shapes since we can't use emojis directly
            cgContext.setFillColor(UIColor.black.cgColor)
            
            // Eyes
            cgContext.fillEllipse(in: CGRect(x: 80, y: 100, width: 20, height: 30))
            cgContext.fillEllipse(in: CGRect(x: 156, y: 100, width: 20, height: 30))
            
            // Nose
            let nosePath = CGMutablePath()
            nosePath.move(to: CGPoint(x: 128, y: 140))
            nosePath.addLine(to: CGPoint(x: 120, y: 155))
            nosePath.addLine(to: CGPoint(x: 136, y: 155))
            nosePath.closeSubpath()
            cgContext.addPath(nosePath)
            cgContext.fillPath()
            
            // Mouth
            cgContext.setStrokeColor(UIColor.black.cgColor)
            cgContext.setLineWidth(3)
            let mouthPath = CGMutablePath()
            mouthPath.move(to: CGPoint(x: 128, y: 155))
            mouthPath.addCurve(to: CGPoint(x: 108, y: 175), control1: CGPoint(x: 118, y: 165), control2: CGPoint(x: 108, y: 175))
            mouthPath.move(to: CGPoint(x: 128, y: 155))
            mouthPath.addCurve(to: CGPoint(x: 148, y: 175), control1: CGPoint(x: 138, y: 165), control2: CGPoint(x: 148, y: 175))
            cgContext.addPath(mouthPath)
            cgContext.strokePath()
            
            // Simple whiskers
            cgContext.setStrokeColor(UIColor.black.withAlphaComponent(0.6).cgColor)
            cgContext.setLineWidth(2)
            // Left whiskers
            cgContext.move(to: CGPoint(x: 70, y: 140))
            cgContext.addLine(to: CGPoint(x: 20, y: 120))
            cgContext.move(to: CGPoint(x: 70, y: 150))
            cgContext.addLine(to: CGPoint(x: 20, y: 150))
            cgContext.move(to: CGPoint(x: 70, y: 160))
            cgContext.addLine(to: CGPoint(x: 20, y: 180))
            // Right whiskers
            cgContext.move(to: CGPoint(x: 186, y: 140))
            cgContext.addLine(to: CGPoint(x: 236, y: 120))
            cgContext.move(to: CGPoint(x: 186, y: 150))
            cgContext.addLine(to: CGPoint(x: 236, y: 150))
            cgContext.move(to: CGPoint(x: 186, y: 160))
            cgContext.addLine(to: CGPoint(x: 236, y: 180))
            cgContext.strokePath()
        }
        
        material.diffuse.contents = kittyImage
        material.emission.contents = UIColor(white: 0.3, alpha: 1.0)
        material.shininess = 50
        
        return material
    }
    
    private func setupCamera() {
        let cameraNode = SCNNode()
        cameraNode.camera = SCNCamera()
        cameraNode.camera?.fieldOfView = 75
        cameraNode.position = SCNVector3(0, 0, 15)
        cameraNode.camera?.zNear = 0.1
        cameraNode.camera?.zFar = 1000
        rootNode.addChildNode(cameraNode)
    }
    
    private func setupCornerEffects() {
        let cornerPositions = [
            SCNVector3(-14.5, 9.5, 0),   // Top-left
            SCNVector3(14.5, 9.5, 0),    // Top-right
            SCNVector3(14.5, -9.5, 0),   // Bottom-right
            SCNVector3(-14.5, -9.5, 0)   // Bottom-left
        ]
        
        let cornerColors = [
            UIColor.magenta,
            UIColor.cyan,
            UIColor.yellow,
            UIColor(red: 1.0, green: 0.0, blue: 0.7, alpha: 1.0) // Pink
        ]
        
        for (index, position) in cornerPositions.enumerated() {
            // Point light
            let lightNode = SCNNode()
            lightNode.light = SCNLight()
            lightNode.light!.type = .omni
            lightNode.light!.color = cornerColors[index]
            lightNode.light!.intensity = 2000
            lightNode.light!.attenuationEndDistance = 10
            lightNode.position = position
            rootNode.addChildNode(lightNode)
            cornerLights.append(lightNode)
            
            // Glow sphere
            let glowGeometry = SCNSphere(radius: 0.3)
            let glowMaterial = SCNMaterial()
            glowMaterial.emission.contents = cornerColors[index]
            glowMaterial.transparency = 0.7
            glowGeometry.materials = [glowMaterial]
            
            let glowNode = SCNNode(geometry: glowGeometry)
            glowNode.position = position
            rootNode.addChildNode(glowNode)
        }
    }
    
    // MARK: - Animation Methods
    func animateCornerLights(time: TimeInterval) {
        // Rainbow effect like the web version
        let hue = (time * 0.0002).truncatingRemainder(dividingBy: 1.0)
        let pulseIntensity = 1500 + sin(time * 0.002) * 500
        
        for (index, lightNode) in cornerLights.enumerated() {
            lightNode.light?.intensity = pulseIntensity
            
            let cornerHue = (hue + Double(index) * 0.25).truncatingRemainder(dividingBy: 1.0)
            let color = UIColor(hue: CGFloat(cornerHue), saturation: 1.0, brightness: 0.8, alpha: 1.0)
            lightNode.light?.color = color
        }
        
        // Animate field boundary colors with rainbow effect
        animateFieldBoundaries(time: time)
        
        // Animate kitty ball
        animateKittyBall(time: time)
        
        // Update particle system
        updateParticles(time: time)
    }
    
    private func animateFieldBoundaries(time: TimeInterval) {
        let hue = (time * 0.0002).truncatingRemainder(dividingBy: 1.0)
        let rainbowColor = UIColor(hue: CGFloat(hue), saturation: 1.0, brightness: 0.6, alpha: 1.0)
        
        // Update all field edge materials
        rootNode.enumerateChildNodes { node, _ in
            if node.name == "fieldEdge",
               let geometry = node.geometry,
               let material = geometry.materials.first {
                material.emission.contents = rainbowColor
                material.diffuse.contents = rainbowColor
            }
        }
        
        // Animate paddle glows like web version
        animatePaddleGlows(time: time)
    }
    
    private var paddleGlowCounter = 0
    
    private func animatePaddleGlows(time: TimeInterval) {
        // Update paddle glows less frequently for performance
        paddleGlowCounter += 1
        guard paddleGlowCounter % 4 == 0 else { return }
        
        let playerHue = (time * 0.0005).truncatingRemainder(dividingBy: 1.0)
        let computerHue = (playerHue + 0.5).truncatingRemainder(dividingBy: 1.0)
        let pulseIntensity = 1.5 + sin(time * 0.003) * 0.5
        
        // Find and update glow nodes
        rootNode.enumerateChildNodes { node, _ in
            if node.name == "playerGlow" {
                let playerColor = UIColor(hue: CGFloat(playerHue), saturation: 1.0, brightness: 0.5, alpha: 1.0)
                node.light?.color = playerColor
                node.light?.intensity = pulseIntensity * 1500
                
                // Update paddle material less frequently
                if paddleGlowCounter % 8 == 0,
                   let paddleNode = self.playerPaddle,
                   let geometry = paddleNode.geometry,
                   let material = geometry.materials.first {
                    material.emission.contents = playerColor
                }
            } else if node.name == "computerGlow" {
                let computerColor = UIColor(hue: CGFloat(computerHue), saturation: 1.0, brightness: 0.5, alpha: 1.0)
                node.light?.color = computerColor
                node.light?.intensity = pulseIntensity * 1500
                
                // Update paddle material less frequently
                if paddleGlowCounter % 8 == 0,
                   let paddleNode = self.computerPaddle,
                   let geometry = paddleNode.geometry,
                   let material = geometry.materials.first {
                    material.emission.contents = computerColor
                }
            }
        }
    }
    
    func updateBallTrail() {
        for (index, trailNode) in ballTrail.enumerated() {
            if index == 0 {
                trailNode.position = ball.position
                trailNode.position.z -= 0.1
            } else {
                trailNode.position = ballTrail[index - 1].position
                trailNode.position.z -= 0.1
            }
        }
    }
    
    private var ballAnimationCounter = 0
    
    func animateKittyBall(time: TimeInterval) {
        // Rotate the kitty ball
        ball.eulerAngles.x = Float(time * 0.02)
        ball.eulerAngles.y = Float(time * 0.03)
        
        // Update trail colors less frequently for performance
        ballAnimationCounter += 1
        guard ballAnimationCounter % 5 == 0 else { return }
        
        for (index, trailNode) in ballTrail.enumerated() {
            if let geometry = trailNode.geometry,
               let material = geometry.materials.first {
                let hue = ((time * 0.0005) + Double(index) * 0.05).truncatingRemainder(dividingBy: 1.0)
                let rainbowColor = UIColor(hue: CGFloat(hue), saturation: 1.0, brightness: 0.5, alpha: 1.0)
                material.diffuse.contents = rainbowColor
                material.emission.contents = rainbowColor
            }
        }
    }
    
    private func setupParticleSystem() {
        // Create reduced particle system for better performance
        let particleCount = 30
        let particleGeometry = SCNSphere(radius: 0.1)
        
        for i in 0..<particleCount {
            let particleMaterial = SCNMaterial()
            let hue = Float.random(in: 0...1)
            let particleColor = UIColor(hue: CGFloat(hue), saturation: 1.0, brightness: 0.5, alpha: 1.0)
            particleMaterial.diffuse.contents = particleColor
            particleMaterial.emission.contents = particleColor
            particleMaterial.blendMode = .add
            
            let particleNode = SCNNode(geometry: particleGeometry)
            particleNode.geometry?.materials = [particleMaterial]
            
            // Random positions
            particleNode.position = SCNVector3(
                Float.random(in: -15...15),
                Float.random(in: -10...10),
                Float.random(in: -5...5)
            )
            
            // Random velocity
            let velocity = SCNVector3(
                Float.random(in: -0.1...0.1),
                Float.random(in: -0.1...0.1),
                Float.random(in: -0.1...0.1)
            )
            particleVelocities.append(velocity)
            
            particleNode.name = "particle_\(i)"
            rootNode.addChildNode(particleNode)
        }
    }
    
    private var particleUpdateCounter = 0
    
    func updateParticles(time: TimeInterval) {
        // Update particles less frequently to reduce CPU load
        particleUpdateCounter += 1
        guard particleUpdateCounter % 3 == 0 else { return }
        
        rootNode.enumerateChildNodes { node, _ in
            if node.name?.hasPrefix("particle_") == true,
               let indexString = node.name?.replacingOccurrences(of: "particle_", with: ""),
               let index = Int(indexString),
               index < self.particleVelocities.count {
                
                // Update position
                node.position.x += self.particleVelocities[index].x * 3 // Compensate for reduced frequency
                node.position.y += self.particleVelocities[index].y * 3
                node.position.z += self.particleVelocities[index].z * 3
                
                // Reset particles that go out of bounds
                if abs(node.position.x) > 15 {
                    node.position.x = -15 * (node.position.x > 0 ? 1 : -1)
                }
                if abs(node.position.y) > 10 {
                    node.position.y = -10 * (node.position.y > 0 ? 1 : -1)
                }
                if abs(node.position.z) > 5 {
                    self.particleVelocities[index].z *= -1
                }
                
                // Update colors less frequently
                if particleUpdateCounter % 6 == 0,
                   let geometry = node.geometry,
                   let material = geometry.materials.first {
                    let hue = ((time * 0.0001) + Double(index) * 0.01).truncatingRemainder(dividingBy: 1.0)
                    let rainbowColor = UIColor(hue: CGFloat(hue), saturation: 1.0, brightness: 0.5, alpha: 1.0)
                    material.diffuse.contents = rainbowColor
                    material.emission.contents = rainbowColor
                }
            }
        }
    }
    
    // MARK: - Utility Methods
    func resetBallPosition() {
        ball.position = SCNVector3(0, 0, 0)
    }
    
    func setBallPosition(_ position: SCNVector3) {
        ball.position = position
    }
    
    func setPlayerPaddleY(_ y: Float) {
        playerPaddle.position.y = y
        // Update glow light position too
        rootNode.enumerateChildNodes { node, _ in
            if node.name == "playerGlow" {
                node.position.y = y
            }
        }
    }
    
    func setComputerPaddleY(_ y: Float) {
        computerPaddle.position.y = y
        // Update glow light position too
        rootNode.enumerateChildNodes { node, _ in
            if node.name == "computerGlow" {
                node.position.y = y
            }
        }
    }
}