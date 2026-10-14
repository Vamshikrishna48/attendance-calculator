# Attendance Gap Predictor & Management System

A unified, real-time cross-platform Attendance Prediction and Management System designed for students, faculty, and administrators. Seamlessly synchronizes between the **Android Mobile App** and the **PC Web Application**.

## Features

- **Real-Time Mobile & PC Live Sync**: Any changes made by a student, faculty member, or admin on mobile or PC are instantly updated across all devices via the central Node.js backend.
- **Attendance Gap Predictor**:
  - Calculates required attendance percentage (threshold: 80%).
  - Predicts classes needed to recover or classes that can be safely missed.
  - Enforces curriculum bounds (conducted classes cannot exceed total semester classes).
- **Faculty Portal**:
  - Update and synchronize total conducted classes across programs and subjects.
  - Search and inspect student attendance records.
- **Admin Portal**:
  - Manage batches, programs, semesters, subjects, and curriculum mappings.
  - Manage admin accounts and view registered student profiles.
- **Android Mobile App**:
  - Native Android WebView wrapper with automatic LAN auto-discovery and live sync status indicators.
  - Standalone and central server modes.

## Quick Start

### 1. Run the Backend Server
```bash
npm install
npm run dev
```
The server will run on:
- Localhost: `http://localhost:3000`
- Network: `http://<your-local-ip>:3000`

### 2. Android Mobile App
- Install `Attendance_Predictor.apk` on your Android device.
- Ensure your mobile device is connected to the same Wi-Fi network as the server.
- The app automatically connects to the server and indicates live sync status.
