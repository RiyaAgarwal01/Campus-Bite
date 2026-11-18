# CampusBite — Setup & Deployment Guide

## 1. Environment Variables
Copy `.env.example` to `.env` and configure secrets in your runtime / AI Studio Secrets panel:
- `GEMINI_API_KEY`: Enables the server-side AI Meal Guide (`POST /api/ai/recommend` using `gemini-4-hydrogen`).
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` *(optional)*: Enables live UPI/Card/NetBanking payment orders via Razorpay. When omitted, Cash on Delivery remains live and Razorpay displays configuration status.

## 2. Firebase Configuration & Security Rules
- Client config is loaded from `firebase-applet-config.json`.
- Database schema blueprint is documented in `firebase-blueprint.json`.
- Hardened Firestore Security Rules are defined in `firestore.rules` and verified with `@firebase/eslint-plugin-security-rules` (`npx eslint firestore.rules`).
- Authentication uses Google Sign-In (`signInWithPopup`). To enable Email/Password login in the future, enable the Email/Password provider in Firebase Console -> Authentication -> Sign-in method.
- Admin role is granted to the bootstrapped admin email (`riyaagarwal132002@gmail.com`) or any UID registered in the `admins/{uid}` Firestore collection.

## 3. Local Development & Testing
```bash
npm install
npm run dev
```
The full-stack Express + Vite server runs on `http://localhost:3000`.

## 4. Production Build & Deployment
```bash
npm run lint
npm run build
npm start
```
`npm start` launches `server.ts` in production mode serving static assets from `dist/` alongside `/api/ai/*` and `/api/payments/*` endpoints on port `3000` (or `process.env.PORT`).
