
# Trade Snapshot Journal

A comprehensive trading journal application that helps you track and analyze your trading performance. All data is stored locally in your browser's localStorage, ensuring your trading data never leaves your machine.

## Features

- Track trades with detailed entry and exit information
- Analyze performance with key metrics and visualizations
- Calendar view of trading performance
- Monthly performance breakdown by strategy and instrument
- Fully private - all data stays on your local machine
- Export/import functionality to save your data between browsers or devices

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

### Option 4: Docker Deployment

For Docker deployment instructions, including how to use with Portainer:

```sh
# See the Docker deployment guide
cat README.docker.md
```

Or open the [Docker Deployment Guide](README.docker.md) file.

## Data Storage and Backup

While the app uses your browser's localStorage for convenience, we understand the importance of data portability. You can:

- **Export your data**: Save a JSON backup file of all your trades at any time
- **Import your data**: Load your trades from a previously exported file
- **Cross-browser usage**: Export from one browser and import into another
- **Protection against data loss**: Regular exports protect against browser cache clearing

These features make the application truly browser-independent while still maintaining privacy by keeping all data on your local machine.

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- localStorage for data persistence
