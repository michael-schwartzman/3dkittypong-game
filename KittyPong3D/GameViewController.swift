import UIKit
import SceneKit

class GameViewController: UIViewController {
    
    @IBOutlet weak var sceneView: SCNView!
    @IBOutlet weak var scoreLabel: UILabel!
    @IBOutlet weak var gameInfoLabel: UILabel!
    @IBOutlet weak var startButton: UIButton!
    
    var gameScene: GameScene!
    var gameLogic: GameLogic!
    var soundManager: SoundManager!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupUI()
        setupGame()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Landscape orientation is handled by Info.plist settings
        // No need to programmatically set orientation
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
    
    private func setupUI() {
        view.backgroundColor = .black
        
        // Configure scene view if connected
        if let sceneView = sceneView {
            sceneView.backgroundColor = .black
            sceneView.allowsCameraControl = false
            sceneView.showsStatistics = false
            sceneView.antialiasingMode = .none
            sceneView.preferredFramesPerSecond = 30 // Reduce to 30fps for performance
            sceneView.rendersContinuously = false // Only render when needed
            sceneView.jitteringEnabled = false
            sceneView.isTemporalAntialiasingEnabled = false
        }
        
        // Setup labels if connected
        if let scoreLabel = scoreLabel {
            scoreLabel.textColor = .systemGreen
            scoreLabel.font = .boldSystemFont(ofSize: 32)
            scoreLabel.text = "0 - 0"
        }
        
        if let gameInfoLabel = gameInfoLabel {
            gameInfoLabel.textColor = .white
            gameInfoLabel.font = .systemFont(ofSize: 16)
            gameInfoLabel.text = "Time: 0s | Diffulkitty: 1x"
        }
        
        // Setup start button if connected
        if let startButton = startButton {
            startButton.setTitle("🐾 START GAME 🐾", for: .normal)
            startButton.titleLabel?.font = .boldSystemFont(ofSize: 20)
            startButton.backgroundColor = UIColor(red: 0.62, green: 0.31, blue: 0.87, alpha: 1.0)
            startButton.layer.cornerRadius = 25
            startButton.addTarget(self, action: #selector(startButtonTapped), for: .touchUpInside)
        }
        
        // Don't set up constraints programmatically since they're in storyboard
    }
    
    
    private func setupGame() {
        soundManager = SoundManager()
        
        // Create scene in background to avoid blocking main thread
        DispatchQueue.global(qos: .userInitiated).async {
            let scene = GameScene()
            let logic = GameLogic(scene: scene)
            
            DispatchQueue.main.async {
                self.gameScene = scene
                self.gameLogic = logic
                
                if let sceneView = self.sceneView {
                    sceneView.scene = scene
                    sceneView.delegate = self
                    
                    // Set up touch handling
                    let panGesture = UIPanGestureRecognizer(target: self, action: #selector(self.handlePanGesture(_:)))
                    sceneView.addGestureRecognizer(panGesture)
                }
                
                logic.delegate = self
                
                // Pre-warm the renderer
                sceneView?.prepare([scene]) { success in
                    // Scene preparation completed
                }
            }
        }
    }
    
    @objc private func startButtonTapped() {
        startButton?.isHidden = true
        gameLogic.startGame()
        soundManager.playStartSound()
    }
    
    @objc private func handlePanGesture(_ gesture: UIPanGestureRecognizer) {
        guard let sceneView = sceneView else { return }
        let location = gesture.location(in: sceneView)
        let normalizedY = Float((location.y / sceneView.frame.height) * 2 - 1) // Convert to -1 to 1 range
        gameLogic.updatePlayerPaddle(normalizedPosition: -normalizedY) // Invert Y for natural movement
    }
    
    private func updateUI() {
        DispatchQueue.main.async {
            let score = self.gameLogic.getScore()
            self.scoreLabel?.text = "\(score.player) - \(score.computer)"
            
            let gameInfo = self.gameLogic.getGameInfo()
            self.gameInfoLabel?.text = "Time: \(gameInfo.time)s | Diffulkitty: \(gameInfo.difficulty)x"
        }
    }
}

// MARK: - SCNSceneRendererDelegate
extension GameViewController: SCNSceneRendererDelegate {
    func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
        gameLogic.update(time: time)
        updateUI()
    }
}

// MARK: - GameLogicDelegate
extension GameViewController: GameLogicDelegate {
    func didScore(isPlayer: Bool) {
        soundManager.playScoreSound(isPlayer: isPlayer)
        
        // Add haptic feedback
        let impact = UIImpactFeedbackGenerator(style: isPlayer ? .heavy : .medium)
        impact.impactOccurred()
    }
    
    func didHitPaddle() {
        soundManager.playHitSound()
        
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()
    }
    
    func didHitWall() {
        soundManager.playWallHitSound()
        
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()
    }
    
    func gameDidEnd() {
        DispatchQueue.main.async {
            self.startButton?.isHidden = false
            self.startButton?.setTitle("🐾 PLAY AGAIN 🐾", for: .normal)
        }
    }
}