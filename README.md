# BlueFood Frontend

React + TypeScript frontend for BlueFood supply chain traceability.

## Prerequisites

- Node.js LTS
- Backend API running at http://localhost:5085
- If you want to scan QR codes from a phone, the backend should be reachable from the phone network or via `BLUEFOOD_PUBLIC_BASE_URL`.

Create `BlueFood_frontend/.env` from `.env.example` when you want the frontend to call a non-default backend base URL.

## Run

1. Open terminal in this folder.
2. Install dependencies:

   npm install

3. Start the frontend:

   npm run dev

4. Open the local URL printed by Vite, usually http://localhost:5173

## Environment

If needed, set the backend base URL:

- VITE_API_BASE_URL=http://localhost:5085

If the backend is running on a different host or LAN IP, point `VITE_API_BASE_URL` to that address so the frontend and QR trace page stay in sync.

## Main Screens

- Batch creation
- Trace lookup by batch code
- Trace lookup by QR token
- Certificate creation and attachment

## Mobile Scanner Module (Flutter)

A Flutter scanner module is available at `bluefood_scan_app` in this folder.

Purpose:
- Scan QR directly on phone camera.
- Extract BlueFood QR token.
- Call existing backend endpoint `GET /api/trace/{qrToken}`.
- Optionally open public trace URL.

Run steps:
1. Install Flutter SDK on your machine.
2. Open terminal in `BlueFood_frontend/bluefood_scan_app`.
3. Run `flutter pub get`.
4. Run on Android with backend base URL override:

   flutter run --dart-define=API_BASE_URL=http://192.168.130.68:5085

Notes:
- Replace `192.168.130.68` with your current backend LAN IP.
- No SQL Server schema changes are required.
- Backend APIs and database remain the same.
