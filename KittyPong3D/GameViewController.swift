import UIKit
import WebKit

class GameViewController: UIViewController {
    
    private var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadGame()
    }
    
    override var shouldAutorotate: Bool {
        return true
    }
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .all
    }
    
    override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: size, with: coordinator)
        
        coordinator.animate(alongsideTransition: { _ in
            // Update WebView frame during rotation to match screen
            let screenBounds = UIScreen.main.bounds
            self.webView.frame = screenBounds
        }, completion: { _ in
            // Force a viewport refresh after rotation
            self.webView.evaluateJavaScript("""
                window.dispatchEvent(new Event('resize'));
                if (window.handleResize) window.handleResize();
            """)
        })
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // Ensure WebView always matches screen bounds
        webView.frame = UIScreen.main.bounds
    }
    
    override var prefersStatusBarHidden: Bool {
        return true
    }
    
    private func setupWebView() {
        // Configure WebView for optimal game performance
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.allowsPictureInPictureMediaPlayback = false
        configuration.suppressesIncrementalRendering = false
        
        // Enable JavaScript and modern web features
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = preferences
        
        // Performance optimizations
        if #available(iOS 14.0, *) {
            configuration.limitsNavigationsToAppBoundDomains = false
        }
        
        // Add user scripts for immediate viewport setup
        let viewportScript = WKUserScript(source: """
            var meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            document.getElementsByTagName('head')[0].appendChild(meta);
        """, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        configuration.userContentController.addUserScript(viewportScript)
        
        // Create and configure WebView with full screen bounds
        let screenBounds = UIScreen.main.bounds
        webView = WKWebView(frame: screenBounds, configuration: configuration)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.scrollsToTop = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.contentMode = .scaleToFill
        webView.backgroundColor = .black
        webView.isOpaque = false
        webView.allowsBackForwardNavigationGestures = false
        
        // Force the WebView to use device pixel density
        if #available(iOS 14.0, *) {
            webView.pageZoom = 1.0
        }
        
        // Add to view hierarchy
        view.addSubview(webView)
    }
    
    private func loadGame() {
        // Load the live website
        if let url = URL(string: "https://kittie.schwartzman.org/") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
}

// MARK: - WKNavigationDelegate
extension GameViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Get screen dimensions for aggressive scaling
        let screenWidth = UIScreen.main.bounds.width
        let screenHeight = UIScreen.main.bounds.height
        
        webView.evaluateJavaScript("""
            // Simple viewport setup for better mobile experience
            let viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                document.head.appendChild(viewport);
            }
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            
            // Only prevent pinch zoom, allow other gestures for game interaction
            document.addEventListener('gesturestart', function (e) {
                e.preventDefault();
            });
            
            // Initialize audio context on first touch for iOS
            document.addEventListener('touchstart', function() {
                if (typeof initAudioContext === 'function') {
                    initAudioContext();
                }
            }, { once: true });
        """)
        
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showErrorMessage("Failed to load game: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showErrorMessage("Network error: \(error.localizedDescription)")
    }
    
    private func showErrorMessage(_ message: String) {
        let alert = UIAlertController(title: "Connection Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Retry", style: .default) { _ in
            self.loadGame()
        })
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        present(alert, animated: true)
    }
}