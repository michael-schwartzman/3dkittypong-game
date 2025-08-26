import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { GLView } from 'expo-gl';
import ExpoTHREE from 'expo-three';
import * as THREE from 'three';
import * as Haptics from 'expo-haptics';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [score, setScore] = useState({ player: 0, computer: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    
    // Initialize Three.js with GL context
    const renderer = new ExpoTHREE.Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0.1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 15;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Game field
    const fieldGeometry = new THREE.BoxGeometry(30, 20, 1);
    const fieldEdges = new THREE.EdgesGeometry(fieldGeometry);
    const fieldMaterial = new THREE.LineBasicMaterial({ 
      color: 0x9d4edd,
      linewidth: 2,
    });
    const fieldLines = new THREE.LineSegments(fieldEdges, fieldMaterial);
    fieldLines.position.z = -0.5;
    scene.add(fieldLines);

    // Corner lights with animated colors
    const cornerColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff00aa];
    const cornerLights = [];
    const cornerPositions = [
      new THREE.Vector3(-14.5, 9.5, 0),
      new THREE.Vector3(14.5, 9.5, 0),
      new THREE.Vector3(14.5, -9.5, 0),
      new THREE.Vector3(-14.5, -9.5, 0)
    ];

    cornerPositions.forEach((position, index) => {
      const light = new THREE.PointLight(cornerColors[index], 2, 10);
      light.position.copy(position);
      scene.add(light);
      cornerLights.push(light);
      
      const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: cornerColors[index],
        transparent: true,
        opacity: 0.7
      });
      const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
      glowSphere.position.copy(position);
      scene.add(glowSphere);
    });

    // Player paddle (left side)
    const paddleGeometry = new THREE.BoxGeometry(0.5, 4, 0.5);
    const paddleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ff88,
      shininess: 100
    });
    const playerPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    playerPaddle.position.x = -14;
    scene.add(playerPaddle);

    // Computer paddle (right side)  
    const computerPaddleMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff4444,
      shininess: 100
    });
    const computerPaddle = new THREE.Mesh(paddleGeometry, computerPaddleMaterial);
    computerPaddle.position.x = 14;
    scene.add(computerPaddle);

    // Ball
    const ballGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const ballMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    scene.add(ball);

    // Ball trail effect
    const trailGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const trailMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });
    const ballTrail = [];
    for (let i = 0; i < 10; i++) {
      const trail = new THREE.Mesh(trailGeometry, trailMaterial.clone());
      trail.material.opacity = 0.3 - (i * 0.03);
      scene.add(trail);
      ballTrail.push(trail);
    }

    // Game state
    let ballVelocity = { x: 0.15, y: 0.1 };
    let playerPaddleY = 0;
    let computerPaddleY = 0;
    let gameActive = false;
    let lastTime = 0;
    let elapsedTime = 0;

    // Touch handling for paddle movement
    let touchY = null;
    
    const handleTouch = (event) => {
      if (event.nativeEvent) {
        touchY = (event.nativeEvent.pageY / height) * 20 - 10; // Convert to game coordinates
        touchY = Math.max(-8, Math.min(8, touchY)); // Clamp to field bounds
      }
    };

    // Game loop
    const animate = (time) => {
      requestAnimationFrame(animate);
      
      const deltaTime = time - lastTime;
      lastTime = time;

      if (gameActive) {
        elapsedTime += deltaTime;
        setGameTime(Math.floor(elapsedTime / 1000));

        // Update ball position
        ball.position.x += ballVelocity.x;
        ball.position.y += ballVelocity.y;

        // Update ball trail
        ballTrail.forEach((trail, index) => {
          if (index === 0) {
            trail.position.copy(ball.position);
            trail.position.z -= 0.1;
          } else {
            trail.position.copy(ballTrail[index - 1].position);
            trail.position.z -= 0.1;
          }
        });

        // Ball collision with top/bottom walls
        if (ball.position.y > 9.5 || ball.position.y < -9.5) {
          ballVelocity.y *= -1;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Player paddle movement (touch control)
        if (touchY !== null) {
          playerPaddleY = touchY;
          playerPaddle.position.y = playerPaddleY;
        }

        // Computer AI
        const targetY = ball.position.y;
        const computerSpeed = 0.08 * difficulty;
        if (computerPaddleY < targetY) {
          computerPaddleY = Math.min(computerPaddleY + computerSpeed, targetY);
        } else {
          computerPaddleY = Math.max(computerPaddleY - computerSpeed, targetY);
        }
        computerPaddle.position.y = Math.max(-8, Math.min(8, computerPaddleY));

        // Ball collision with paddles
        if (ball.position.x <= -13.5 && 
            ball.position.y >= playerPaddleY - 2 && 
            ball.position.y <= playerPaddleY + 2) {
          ballVelocity.x = Math.abs(ballVelocity.x);
          ballVelocity.y += (ball.position.y - playerPaddleY) * 0.1;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        if (ball.position.x >= 13.5 && 
            ball.position.y >= computerPaddleY - 2 && 
            ball.position.y <= computerPaddleY + 2) {
          ballVelocity.x = -Math.abs(ballVelocity.x);
          ballVelocity.y += (ball.position.y - computerPaddleY) * 0.1;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Scoring
        if (ball.position.x > 15) {
          setScore(prev => ({ ...prev, player: prev.player + 1 }));
          resetBall();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (ball.position.x < -15) {
          setScore(prev => ({ ...prev, computer: prev.computer + 1 }));
          resetBall();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        // Increase difficulty over time
        if (Math.floor(elapsedTime / 10000) + 1 > difficulty) {
          setDifficulty(Math.floor(elapsedTime / 10000) + 1);
          ballVelocity.x *= 1.1;
          ballVelocity.y *= 1.1;
        }
      }

      // Animate corner lights
      cornerLights.forEach((light, index) => {
        const phase = time * 0.002 + index * Math.PI / 2;
        light.intensity = 1.5 + Math.sin(phase) * 0.5;
      });

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    const resetBall = () => {
      ball.position.set(0, 0, 0);
      ballVelocity = { 
        x: (Math.random() > 0.5 ? 1 : -1) * (0.15 * difficulty), 
        y: (Math.random() - 0.5) * 0.2 
      };
    };

    const startGame = () => {
      gameActive = true;
      setGameStarted(true);
      elapsedTime = 0;
      resetBall();
    };

    // Store functions for external access
    gl.startGame = startGame;
    gl.handleTouch = handleTouch;

    animate(0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐱 3D KITTY PONG 🐱</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{score.player}</Text>
          <Text style={styles.scoreSeparator}>-</Text>
          <Text style={styles.score}>{score.computer}</Text>
        </View>
        <Text style={styles.gameInfo}>
          Time: {gameTime}s | Diffulkitty: {difficulty}x
        </Text>
      </View>
      
      <GLView
        style={styles.gameCanvas}
        onContextCreate={onContextCreate}
        onTouchMove={(event) => {
          if (event.nativeEvent.gl && event.nativeEvent.gl.handleTouch) {
            event.nativeEvent.gl.handleTouch(event);
          }
        }}
      />
      
      {!gameStarted && (
        <View style={styles.startOverlay}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => {
              // Access the GL context's start function
              setGameStarted(true);
            }}
          >
            <Text style={styles.startButtonText}>🐾 START GAME 🐾</Text>
          </TouchableOpacity>
          <Text style={styles.instructions}>
            Touch and drag to move your paddle
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff00ff',
    textAlign: 'center',
    marginBottom: 10,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    minWidth: 50,
    textAlign: 'center',
  },
  scoreSeparator: {
    fontSize: 24,
    color: '#fff',
    marginHorizontal: 20,
  },
  gameInfo: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  gameCanvas: {
    flex: 1,
  },
  startOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#9d4edd',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 25,
    marginBottom: 20,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  instructions: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});