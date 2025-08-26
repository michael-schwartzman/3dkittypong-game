# 3D Kitty Pong - iOS App

A mobile version of the 3D Kitty Pong game built with React Native and Expo.

## Features

- **3D Graphics**: Uses Three.js with Expo GL for hardware-accelerated 3D rendering
- **Touch Controls**: Intuitive touch-to-move paddle controls optimized for mobile
- **Haptic Feedback**: Tactile feedback for ball collisions and scoring
- **Landscape Mode**: Optimized for landscape orientation gaming
- **Progressive Difficulty**: Game speed increases over time
- **Visual Effects**: Animated corner lights and ball trail effects

## Installation & Setup

1. Install dependencies:
   ```bash
   cd ios-app
   npm install
   ```

2. Install Expo CLI globally (if not already installed):
   ```bash
   npm install -g expo-cli
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on iOS:
   - Install Expo Go app on your iOS device
   - Scan the QR code with your camera
   - Or use iOS Simulator: `npm run ios`

## Building for Production

1. **iOS Build**:
   ```bash
   npm run build:ios
   ```

2. **Android Build**:
   ```bash
   npm run build:android
   ```

## Game Controls

- **Touch and Drag**: Move your finger up and down on the screen to control the left paddle
- **Objective**: Hit the ball past the computer paddle to score points
- **Difficulty**: Game speed increases every 10 seconds

## Technical Stack

- **React Native** with Expo
- **Three.js** for 3D graphics
- **Expo GL** for OpenGL rendering
- **Expo Haptics** for tactile feedback
- **Expo Screen Orientation** for landscape lock

## File Structure

- `App.js` - Main game component with 3D rendering logic
- `package.json` - Dependencies and scripts
- `app.json` - Expo configuration
- `babel.config.js` - Babel configuration for Expo

## Original Web Version

This mobile app is based on the web version located in the parent directory. The core game mechanics have been adapted for mobile touch controls while maintaining the same visual style and 3D effects.