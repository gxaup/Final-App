# Full Loop Report 🚌

Full Loop Report is a premium, mobile-first web application designed for transit inspectors to log bus violations in real-time. It features a streamlined interface, session persistence, and instant report generation.

## ✨ Features
- **Zero-Config Startup**: Works out of the box with an in-memory database fallback.
- **Streamlined Login**: Enter your name and start reporting instantly. No registration required.
- **Real-Time Logging**: Quick-tap violation buttons with support for custom notes.
- **Driver Tracking**: Automatically tracks driver "suitability" based on recent reports.
- **Report Generation**: Instantly generate and download formatted text reports.
- **High-End Design**: Dark mode, glassmorphism, and smooth animations.

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the App**:
   ```bash
   npm run dev
   ```

3. **Access the App**:
   Open [http://localhost:5000](http://localhost:5000) in your browser.

## 🛠 Tech Stack
- **Frontend**: React, TypeScript, Vite, TanStack Query, Radix UI, Tailwind CSS.
- **Backend**: Node.js, Express, tsx.
- **Database**: Drizzle ORM (PostgreSQL with In-Memory fallback), Zod.

## 📖 How to Use

1. **Login**: Enter your name on the landing screen.
2. **Start Report**: Click "Start Report" and enter the bus details (Number, Driver, Route, Stop).
3. **Log Violations**: Use the large grid of buttons to log infractions. Tap a button to log a violation instantly, or click the edit icon on it to add notes.
4. **End Session**: When finished, click "End Session & Report". Enter your "Time Off" and the report will be generated.
5. **View Reports**: Access all past reports via the "Reports" button on the home screen.
