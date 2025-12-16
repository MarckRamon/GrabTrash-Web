# GrabTrash Web Admin Dashboard

A comprehensive waste management administration system built with React and Vite. This web application provides administrators with tools to manage users, trucks, job orders, collection points, and schedules.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Sample Credentials](#sample-credentials)
- [Recent Updates](#recent-updates)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version |
|------------|---------|
| React | ^19.0.0 |
| Vite | ^6.1.0 |
| Material UI (MUI) | ^6.4.11 |
| MUI Icons | ^6.4.5 |
| MUI X Charts | ^7.28.0 |
| MUI X Date Pickers | ^8.3.0 |
| React Router DOM | ^7.6.0 |
| Axios | ^1.9.0 |
| Firebase | ^11.6.0 |
| Leaflet | ^1.9.4 |
| React Leaflet | ^5.0.0 |
| Framer Motion | ^12.4.4 |
| Emotion (React & Styled) | ^11.14.0 |
| date-fns | ^4.1.0 |
| jwt-decode | ^4.0.0 |

### Backend
| Technology | Description |
|------------|-------------|
| Spring Boot | Java-based REST API |
| Firebase Firestore | NoSQL Database |
| Firebase Auth | Authentication |
| Render | Backend Hosting |

### Development Tools
| Tool | Version |
|------|---------|
| ESLint | ^9.19.0 |
| Node.js | 18+ (recommended) |
| npm | 9+ |

---

## ✨ Features

- **Dashboard** - Overview with statistics and charts
- **Users Management** - CRUD operations for all user types with role-based filtering
- **Trucks Management** - Fleet tracking with automated status updates based on driver assignment
- **Job Order Requests** - Manage collection requests with trash weight and notes
- **Collection Points** - Interactive map with public dumpsites, private entities, and job orders
- **Collection Schedule** - Schedule management for waste collection
- **Payment Management** - Track and manage payments

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MarckRamon/GrabTrash-Web.git
   cd GrabTrash-Web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

---

## 📦 Deployment

### Frontend Deployment (Firebase Hosting)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   ```

### Backend Deployment (Render)

The backend is hosted on Render at:
```
https://grabtrash-backend.onrender.com/api
```

Backend deployment is handled through Render's automatic deployment from the GitHub repository.

---

## 🔐 Sample Credentials

### Admin Account
| Field | Value |
|-------|-------|
| Email | `admin@grabtrash.com` |
| Password | `admin123` |
| Role | Admin |

### Driver Account
| Field | Value |
|-------|-------|
| Email | `driver@grabtrash.com` |
| Password | `driver123` |
| Role | Driver |

### Customer Account
| Field | Value |
|-------|-------|
| Email | `customer@grabtrash.com` |
| Password | `customer123` |
| Role | Customer |

### Private Entity Account
| Field | Value |
|-------|-------|
| Email | `entity@grabtrash.com` |
| Password | `entity123` |
| Role | Private Entity |

> ⚠️ **Note**: These are sample/dummy credentials for testing purposes. Please update with real credentials for production use.

---

## 🔄 Recent Updates

### December 2024

#### Users Page
- Added role-based filtering in "Sort by" dropdown (Admin, Customers, Driver, Private Entity)
- Fixed 405 error when updating user locations
- Added Private Entity and Driver options to Edit User dialog

#### Trucks Management
- Automated truck status based on driver assignment:
  - **In Use** when driver is assigned
  - **Available** when driver is removed
- Added fallback mechanism for driver removal

#### Job Order Requests
- Added **Trash Weight** column displaying weight in kg
- Added **Notes** column for user notes

#### Collection Points
- Fixed private entity red pins not displaying on map
- Now correctly fetches data from `/private-entities` endpoint

#### General
- Updated website title to "GrabTrash"
- Updated favicon to GrabTrash logo

---

## 📁 Project Structure

```
src/
├── api/
│   └── axios.js          # Axios configuration and API helpers
├── components/
│   ├── AdminLayout.jsx   # Main admin layout wrapper
│   ├── EditUserDialog.jsx # User edit modal
│   └── ...
├── CollectionPoints.jsx  # Map with collection points
├── CollectionSchedule.jsx # Schedule management
├── Dashboard.jsx         # Main dashboard
├── JobOrderRequest.jsx   # Job orders table
├── Trucks.jsx            # Trucks management
├── Users.jsx             # Users management
├── firebase.js           # Firebase configuration
└── main.jsx              # App entry point
```

---

## 📄 License

This project is private and proprietary.

---

## 👥 Contributors

- GrabTrash Development Team
