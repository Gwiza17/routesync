# RouteSync — Business Concept Paper

## Executive Summary

RouteSync is a mobile application that connects passengers with independent drivers by exposing each driver's real-time availability calendar. Passengers search for a driver, view their schedule, book a trip with a defined pick-up and drop-off location, receive an upfront cost estimate, and get live turn-by-turn navigation guidance once the trip begins.

---

## Problem Statement

Existing ride-hailing platforms treat driver availability as a black box — passengers request a ride and hope a driver is nearby. There is no way to plan ahead, book a specific driver, or understand a driver's recurring schedule. Independent drivers (school runs, medical transport, corporate shuttles, private chauffeurs) lack a lightweight tool to publish their availability and accept bookings without relying on large platform intermediaries.

---

## Solution

RouteSync gives every driver a unique profile with a live, bookable calendar. Passengers find a driver, see exactly when they are available, and book a specific time slot. The app calculates a transparent cost estimate before confirmation and provides in-app navigation once the trip is underway.

---

## Core Features

### 1. Driver Profile & Unique Driver ID
- Each driver registers and receives a unique Driver ID (shareable via link or QR code).
- Profile includes: name, photo, vehicle details, rate per mile, and service area.

### 2. Driver Schedule / Availability Calendar
- Drivers publish their available time slots (daily, weekly, or recurring).
- Passengers browse a driver's calendar and select an open slot.
- Calendar syncs in real time — bookings immediately remove the slot from availability.

### 3. Trip Booking (Pick-Up & Drop-Off)
- Passenger selects:
  - Date and time slot
  - Pick-up address
  - Drop-off address
- System confirms the booking and notifies both driver and passenger.

### 4. Trip Cost Estimation
- Cost is calculated in two legs:
  - **Leg 1:** Driver's start location → Passenger pick-up location (deadhead distance)
  - **Leg 2:** Passenger pick-up location → Drop-off location (fare distance)
- Formula:
  ```
  Total Cost = (Leg 1 miles + Leg 2 miles) × Driver's Rate Per Mile
  ```
- Drivers set their own rate per mile on their profile.
- Passengers see the full estimated cost before confirming the booking.

### 5. Live Navigation During Trip
- When the driver starts the trip, the app activates a live map view for both driver and passenger.
- Driver receives turn-by-turn guidance to the pick-up location, then to the drop-off.
- Passenger sees the driver's live location and ETA on their screen.

---

## User Roles

| Role      | Key Actions |
|-----------|-------------|
| Driver    | Register, set rate/mile, publish schedule, accept/decline bookings, start trip navigation |
| Passenger | Find driver (by ID or search), view calendar, book trip, track live location |

---

## Revenue Model

| Stream | Description |
|--------|-------------|
| Platform commission | Small percentage (e.g., 5–10%) deducted from each completed trip |
| Driver subscription | Optional premium tier for calendar tools, analytics, and priority listing |
| In-app payments | Stripe or similar gateway processes passenger payments; RouteSync holds and disburses |

---

## Tech Stack (Proposed)

| Layer | Technology |
|-------|------------|
| Mobile (iOS & Android) | React Native (Expo) |
| Backend API | Node.js + Express or FastAPI (Python) |
| Database | PostgreSQL (users, bookings, schedules) |
| Real-time updates | WebSockets (Socket.io) or Firebase Realtime DB |
| Maps & Navigation | Google Maps SDK / Mapbox |
| Distance & routing | Google Maps Distance Matrix API |
| Authentication | Firebase Auth or Auth0 |
| Payments | Stripe |
| Hosting | AWS / Render / Railway |

---

## User Flow

```
PASSENGER
  └── Search driver by ID or name
        └── View driver profile + rate per mile
              └── Open driver's calendar
                    └── Select available slot
                          └── Enter pick-up & drop-off addresses
                                └── View cost estimate
                                      └── Confirm & pay
                                            └── Receive booking confirmation
                                                  └── On trip day: track driver live + navigation

DRIVER
  └── Publish available time slots on calendar
        └── Receive booking notification
              └── Accept booking
                    └── On trip day: start trip → turn-by-turn navigation to pick-up → to drop-off
                          └── Trip ends → payment released
```

---

## Key Differentiators

- **Transparency:** Passengers see the full cost before booking — no surge surprises.
- **Driver ownership:** Drivers control their schedule, rate, and client relationships.
- **Pre-scheduling:** Unlike on-demand apps, RouteSync is built for planned trips.
- **Direct driver access:** Unique Driver IDs let passengers rebook favorite drivers directly.

---

## MVP Scope (Phase 1)

1. Driver registration + unique ID generation
2. Driver calendar (availability publishing)
3. Passenger booking flow (pick-up / drop-off + date/time)
4. Cost estimation engine (rate × miles, two-leg calculation)
5. Booking confirmation (push notifications)
6. Live map view + turn-by-turn navigation during trip

---

## Future Phases

- Ratings & reviews
- Recurring/subscription bookings
- Multi-stop trips
- Driver earnings dashboard
- Corporate accounts
- Accessibility features (wheelchair-accessible vehicle filter)

---

*Document version: 1.0 — May 2026*
