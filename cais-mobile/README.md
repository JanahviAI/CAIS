# CAIS Mobile App

React Native (Expo) citizen portal for the Complaint Action Intelligence System.
Connects to the same FastAPI backend as the website.

---

## Project Structure

```
cais-mobile/
├── app/
│   ├── _layout.jsx          Root layout — session guard, redirects
│   ├── index.jsx            Entry redirect
│   ├── auth/
│   │   ├── _layout.jsx      Auth stack
│   │   ├── login.jsx        Login screen
│   │   └── register.jsx     Register screen (PRN live detection)
│   └── tabs/
│       ├── _layout.jsx      Bottom tab navigator
│       ├── submit.jsx       Submit Complaint + Emergency button
│       ├── complaints.jsx   My Complaints list (pull to refresh)
│       └── settings.jsx     IP config + connection test + sign out
├── components/
│   ├── Button.jsx           Reusable button (primary / outline / danger)
│   ├── Card.jsx             White card wrapper
│   ├── ErrorBox.jsx         Inline error banner
│   ├── InputField.jsx       Labelled text input
│   ├── LocationPicker.jsx   Searchable modal location selector
│   └── Pill.jsx             Priority / status / category badge
├── constants/
│   ├── colors.js            SIES GST colour palette
│   └── locations.js         All SIES GST campus locations
├── hooks/
│   └── useSession.js        Auth state — persisted via AsyncStorage
└── services/
    ├── api.js               All API calls (dynamic IP)
    └── storage.js           AsyncStorage wrapper (session + IP)
```

---

## Setup

### 1. Install dependencies

```bash
cd cais-mobile
npm install
```

### 2. Start Expo

```bash
npx expo start
```

A QR code appears in your terminal.

### 3. Install Expo Go on your Android phone

Download **Expo Go** from the Google Play Store.

### 4. Scan the QR code

Open Expo Go → tap "Scan QR code" → scan the code in your terminal.
The app loads on your phone.

---

## Connecting to the Backend (Important)

The app talks to your laptop's FastAPI server. For this to work:

### Step 1 — Start the backend on your laptop
```bash
cd cais/backend
complaintenv\Scripts\activate      # Windows
uvicorn main:app --reload --port 8000
```

### Step 2 — Put both devices on the same network

**Best option for demo day — use your laptop as a hotspot:**
1. Windows: Settings → Mobile Hotspot → turn on
2. Connect your phone to that hotspot
3. Note your laptop's IP (Settings → Mobile Hotspot shows the IP, or run `ipconfig` in CMD and look for the hotspot adapter IP)

### Step 3 — Enter the IP in the app

1. Open the app → go to **Settings tab**
2. Enter your laptop's IP (e.g. `192.168.137.1`)
3. Tap **Test Connection** — you should see "Connected successfully"
4. Tap **Save IP**

Now login and submit complaints — they appear on the admin website dashboard instantly.

---

## Demo Flow

1. Open the website admin dashboard (`localhost:3000`, login as admin)
2. Open the app on your phone
3. Login with any seeded student account or register a new one
4. Submit a complaint from the app — watch it appear on the website dashboard
5. Submit an emergency — watch it appear in the Emergency tab on the website
6. Admin resolves the complaint on the website — refresh the app to see status change

---

## Login Credentials

| Type    | Email                              | Password    |
|---------|------------------------------------|-------------|
| Student | aaravmaids124@gst.sies.edu.in     | siesgst123  |
| Student | priyasaids124@gst.sies.edu.in     | siesgst123  |
| Student | karandcs124@gst.sies.edu.in       | siesgst123  |
| New     | Register with your own college email + PRN | your choice |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot reach IP" | Make sure backend is running and both devices on same network |
| App shows blank screen | Shake phone → reload, or restart `npx expo start` |
| Login says invalid | Check IP is saved in Settings and backend is running |
| QR code not scanning | Make sure phone and laptop are on same WiFi |
