import UIKit
import SceneKit

class GameViewController: UIViewController {
    
    // UI Outlets
    @IBOutlet weak var sceneView: SCNView!
    @IBOutlet weak var scoreLabel: UILabel!
    @IBOutlet weak var gameInfoLabel: UILabel!
    @IBOutlet weak var startButton: UIButton!
    
    // Game components
    private var gameScene: GameScene!
    private var gameLogic: GameLogic!
    
    // Touch handling
    private var lastPanPosition: CGFloat = 0
    private var panGesture: UIPanGestureRecognizer!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupGame()
        setupUI()
        setupGestures()
    }
    
    override var shouldAutorotate: Bool {
        return true
    }
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .all
    }
    
    override var prefersStatusBarHidden: Bool {
        return true
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Ensure full screen usage including safe area
        sceneView.frame = view.bounds
        view.backgroundColor = UIColor.black
    }
    
    private func setupGame() {
        // Create game scene
        gameScene = GameScene()
        
        // Configure SceneKit view
        sceneView.scene = gameScene
        sceneView.delegate = self
        sceneView.isPlaying = true
        
        // Enable physics
        sceneView.scene?.physicsWorld.contactDelegate = self
        
        // Optimize for performance on iPhone
        sceneView.antialiasingMode = .multisampling2X
        sceneView.preferredFramesPerSecond = 60
        sceneView.backgroundColor = UIColor.black
        
        // Camera setup for optimal iPhone viewing
        setupCamera()
        
        // Create game logic
        gameLogic = GameLogic(scene: gameScene)
        gameLogic.delegate = self
    }
    
    private func setupCamera() {
        let camera = SCNCamera()
        camera.fieldOfView = 60
        camera.zNear = 0.1
        camera.zFar = 100
        
        let cameraNode = SCNNode()
        cameraNode.camera = camera
        
        // Position camera for optimal iPhone viewing (closer than desktop)
        cameraNode.position = SCNVector3(0, 0, 18)
        cameraNode.eulerAngles = SCNVector3(0, 0, 0)
        
        gameScene.rootNode.addChildNode(cameraNode)
    }
    
    private func setupUI() {
        // Style the UI elements for iPhone
        scoreLabel.font = UIFont.boldSystemFont(ofSize: 32)
        scoreLabel.textColor = UIColor(red: 0.0, green: 0.8, blue: 1.0, alpha: 1.0) // Cyan
        scoreLabel.text = "0 - 0"
        scoreLabel.layer.shadowColor = UIColor.black.cgColor
        scoreLabel.layer.shadowOffset = CGSize(width: 1, height: 1)
        scoreLabel.layer.shadowOpacity = 0.5
        scoreLabel.layer.shadowRadius = 2
        
        gameInfoLabel.font = UIFont.systemFont(ofSize: 16)
        gameInfoLabel.textColor = UIColor.white
        gameInfoLabel.text = "Time: 0s | Difficulty: 1x"
        gameInfoLabel.layer.shadowColor = UIColor.black.cgColor
        gameInfoLabel.layer.shadowOffset = CGSize(width: 1, height: 1)
        gameInfoLabel.layer.shadowOpacity = 0.5
        gameInfoLabel.layer.shadowRadius = 2
        
        startButton.setTitle("🐾 START GAME 🐾", for: .normal)
        startButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 20)
        startButton.backgroundColor = UIColor(red: 0.62, green: 0.31, blue: 0.87, alpha: 1.0)
        startButton.layer.cornerRadius = 25
        startButton.layer.shadowColor = UIColor.black.cgColor
        startButton.layer.shadowOffset = CGSize(width: 2, height: 2)
        startButton.layer.shadowOpacity = 0.3
        startButton.layer.shadowRadius = 4
        
        // Add glowing animation to start button
        let pulseAnimation = CABasicAnimation(keyPath: "transform.scale")
        pulseAnimation.fromValue = 1.0
        pulseAnimation.toValue = 1.05
        pulseAnimation.duration = 0.8
        pulseAnimation.repeatCount = .infinity
        pulseAnimation.autoreverses = true
        startButton.layer.add(pulseAnimation, forKey: "pulse")
    }
    
    private func setupGestures() {
        // Add pan gesture for paddle control
        panGesture = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
        sceneView.addGestureRecognizer(panGesture)
        
        // Add tap gesture for starting game when button is hidden
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        tapGesture.numberOfTapsRequired = 2
        sceneView.addGestureRecognizer(tapGesture)
    }
    
    @IBAction func startButtonTapped(_ sender: UIButton) {
        startGame()
    }
    
    @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
        guard gameLogic.isActive() else { return }
        
        let location = gesture.location(in: sceneView)
        
        // Convert screen coordinates to normalized paddle position
        let screenHeight = sceneView.bounds.height
        let normalizedY = Float((screenHeight - location.y) / screenHeight * 2 - 1)
        
        gameLogic.updatePlayerPaddle(normalizedPosition: normalizedY)
    }
    
    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        if !gameLogic.isActive() && startButton.isHidden {
            startGame()
        }
    }
    
    private func startGame() {
        gameLogic.startGame()
        startButton.isHidden = true
        
        // Add some visual feedback
        let fadeAnimation = CABasicAnimation(keyPath: "opacity")
        fadeAnimation.fromValue = 1.0
        fadeAnimation.toValue = 0.0
        fadeAnimation.duration = 0.5
        startButton.layer.add(fadeAnimation, forKey: "fadeOut")
        
        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
    
    private func showGameOverScreen() {
        let score = gameLogic.getScore()
        let winner = score.player > score.computer ? "You Win! 🎉" : "Computer Wins 🤖"
        let message = "Final Score: \(score.player) - \(score.computer)"
        
        let alert = UIAlertController(title: winner, message: message, preferredStyle: .alert)
        
        alert.addAction(UIAlertAction(title: "Play Again", style: .default) { _ in
            self.startGame()
        })
        
        alert.addAction(UIAlertAction(title: "Main Menu", style: .cancel) { _ in
            self.showMainMenu()
        })
        
        present(alert, animated: true)
        
        // Haptic feedback for game end
        DispatchQueue.main.async {
            let notificationFeedback = UINotificationFeedbackGenerator()
            notificationFeedback.notificationOccurred(score.player > score.computer ? .success : .error)
        }
    }
    
    private func showMainMenu() {
        startButton.isHidden = false
        startButton.layer.removeAnimation(forKey: "fadeOut")
        
        // Reset score display
        scoreLabel.text = "0 - 0"
        gameInfoLabel.text = "Time: 0s | Difficulty: 1x"
    }
}

// MARK: - SCNSceneRendererDelegate
extension GameViewController: SCNSceneRendererDelegate {
    func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
        gameLogic.update(time: time)
    }
}

// MARK: - SCNPhysicsContactDelegate
extension GameViewController: SCNPhysicsContactDelegate {
    func physicsWorld(_ world: SCNPhysicsWorld, didBegin contact: SCNPhysicsContact) {
        gameLogic.handlePhysicsContact(contact)
    }
}

// MARK: - GameLogicDelegate
extension GameViewController: GameLogicDelegate {
    func didScore(isPlayer: Bool) {
        DispatchQueue.main.async {
            // Haptic feedback
            let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
            impactFeedback.impactOccurred()
            
            // Visual score effect
            let scoreAnimation = CABasicAnimation(keyPath: "transform.scale")
            scoreAnimation.fromValue = 1.0
            scoreAnimation.toValue = 1.2
            scoreAnimation.duration = 0.2
            scoreAnimation.autoreverses = true
            self.scoreLabel.layer.add(scoreAnimation, forKey: "scoreScale")
        }
    }
    
    func didHitPaddle() {
        DispatchQueue.main.async {
            // Light haptic feedback for paddle hits
            let impactFeedback = UIImpactFeedbackGenerator(style: .light)
            impactFeedback.impactOccurred()
        }
    }
    
    func didHitWall() {
        DispatchQueue.main.async {
            // Very light haptic feedback for wall hits
            let impactFeedback = UIImpactFeedbackGenerator(style: .rigid)
            impactFeedback.impactOccurred()
        }
    }
    
    func gameDidEnd() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.showGameOverScreen()
        }
    }
    
    func updateScore(player: Int, computer: Int) {
        DispatchQueue.main.async {
            self.scoreLabel.text = "\(player) - \(computer)"
        }
    }
    
    func updateGameInfo(time: Int, difficulty: Int) {
        DispatchQueue.main.async {
            self.gameInfoLabel.text = "Time: \(time)s | Difficulty: \(difficulty)x"
        }
    }
}