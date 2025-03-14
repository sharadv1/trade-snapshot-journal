
# Trade Snapshot Journal

A comprehensive trading journal application that helps you track and analyze your trading performance. All data is stored locally in your browser's localStorage, ensuring your trading data never leaves your machine.

## Features

- Track trades with detailed entry and exit information
- Analyze performance with key metrics and visualizations
- Calendar view of trading performance
- Monthly performance breakdown by strategy and instrument
- Fully private - all data stays on your local machine

## How to Run Locally

### Option 1: Quick Setup (Recommended)

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd trade-snapshot-journal

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

This will launch the application on your local machine, typically at http://localhost:8080

### Option 2: Build for Production

If you want to build the application for production use:

```sh
# Build the application
npm run build

# Preview the built application locally
npm run preview
```

### Option 3: Deploy to a Local Server

You can also deploy the built application to any static file server:

1. Run `npm run build` to create a production build in the `dist` folder
2. Copy the contents of the `dist` folder to your web server directory
3. Access the application via your local server URL

## Data Storage

All data is stored in your browser's localStorage. This means:

- Your trading data never leaves your machine
- No server or cloud storage is used
- Data persists between sessions on the same browser
- To backup your data, you can export it (feature coming soon)

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- localStorage for data persistence

