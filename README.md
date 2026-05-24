# RouteSync

A mobile app that connects passengers with independent drivers. Passengers search for a driver by unique ID, view their availability calendar, book a trip with pick-up and drop-off locations, get an upfront cost estimate, and track the driver live once the trip begins.

---

## Features

- **Driver profiles** with a unique shareable Driver ID (e.g. `RS-0B4291`)
- **Availability calendar** — drivers publish open time slots, passengers book them
- **Trip booking** — pick-up and drop-off address selection
- **Cost estimation** — calculated across two legs:
  - Driver start location → Passenger pick-up
  - Passenger pick-up → Drop-off
  - Formula: `(Leg 1 miles + Leg 2 miles) × Rate per mile`
- **Live trip tracking** — real-time driver location via WebSockets
- **Turn-by-turn navigation** for drivers during active trips
- Works on **iOS**, **Android**, and **Web**

---

## Project Structure

```
routesync/
├── backend/          Node.js + Express API
│   └── src/
│       ├── config/       Database connection (SQLite / PostgreSQL)
│       ├── controllers/  Auth, driver, booking logic
│       ├── middleware/   JWT authentication
│       ├── models/       User, Driver, Schedule, Booking
│       ├── routes/       API route definitions
│       └── utils/        Distance calculator, driver code generator
└── mobile/           React Native (Expo) app
    └── src/
        ├── components/   Shared components (TripMap)
        ├── context/      Auth context
        ├── navigation/   Stack + tab navigation
        ├── screens/
        │   ├── auth/         Login, Register
        │   ├── driver/       Home, Schedule, Bookings, Active Trip
        │   └── passenger/    Search, Driver Profile, Booking,
        │                     Cost Estimate, My Bookings, Trip Tracking
        └── services/     Axios API client
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile (iOS & Android) | React Native (Expo SDK 56) |
| Web | React Native Web + Leaflet maps |
| Backend | Node.js + Express |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Sequelize |
| Real-time | Socket.io (WebSockets) |
| Maps (native) | react-native-maps |
| Maps (web) | react-leaflet + OpenStreetMap |
| Distance | Google Maps Distance Matrix API / Haversine fallback |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Payments | Stripe (ready to integrate) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Expo Go app (for mobile testing)

### 1. Clone the repo

```bash
git clone https://github.com/Gwiza17/routesync.git
cd routesync
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your keys
npm install
npm run dev
```

Backend runs on `http://localhost:3000`.

### 3. Set up the mobile app

```bash
cd mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your backend URL
npm install
npx expo start
```

- Press `w` to open in browser
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan the QR code with Expo Go on your phone

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/routesync  # optional, uses SQLite if omitted
JWT_SECRET=your_secret_here
GOOGLE_MAPS_API_KEY=your_google_maps_key  # optional, uses haversine fallback if omitted
STRIPE_SECRET_KEY=your_stripe_key
```

### Mobile (`mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
# For physical device testing, use your machine's local IP:
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register driver or passenger |
| POST | `/api/auth/login` | Login |
| GET | `/api/drivers/:code` | Get driver profile by Driver ID |
| GET | `/api/drivers/:code/schedule` | Get driver's available slots |
| POST | `/api/drivers/schedule` | Add availability slot (driver only) |
| DELETE | `/api/drivers/schedule/:id` | Remove a slot (driver only) |
| POST | `/api/bookings/estimate` | Get trip cost estimate |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings/my` | Get my bookings |
| PATCH | `/api/bookings/:id/status` | Update booking status |

---

## Test Accounts

| Role | Email | Password | Driver ID |
|------|-------|----------|-----------|
| Driver | james@routesync.com | password123 | RS-0B4291 |
| Passenger | alice@routesync.com | password123 | — |

---

## Testing on a Physical Device

1. Ensure your phone and laptop are on the **same WiFi network**
2. Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to your laptop's local IP:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api
   ```
3. Disable your Mac firewall: **System Settings → Network → Firewall → Off**
4. Run `npx expo start` and scan the QR code with Expo Go

---

## Roadmap

- [ ] Stripe payment integration
- [ ] Push notifications
- [ ] Ratings & reviews
- [ ] Recurring bookings
- [ ] Driver earnings dashboard
- [ ] Multi-stop trips
- [ ] Corporate accounts

---

## License

MIT
