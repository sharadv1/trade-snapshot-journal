
# Docker Deployment Guide for Trade Snapshot Journal

This guide explains how to deploy the Trade Snapshot Journal application using Docker and Portainer.

## Option 1: Using Portainer

1. **Access your Portainer dashboard**
   - Open your browser and navigate to your Portainer instance (typically `http://your-server-ip:9000`)
   - Log in with your credentials

2. **Deploy using Git repository (recommended)**
   - In Portainer, navigate to "Stacks" and click "Add stack"
   - Under "Build method", select "Git repository"
   - Enter your Git repository URL
   - Set the reference name (branch, typically "main" or "master")
   - Click "Deploy the stack"

3. **Or deploy using docker-compose.yml**
   - In Portainer, navigate to "Stacks" and click "Add stack"
   - Under "Build method", select "Web editor"
   - Upload or paste the contents of the docker-compose.yml file
   - Click "Deploy the stack"

## Option 2: Manual Docker Commands

If you prefer using the command line:

```bash
# Clone the repository
git clone <your-repository-url>
cd trade-snapshot-journal

# Build and run with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t trade-journal .
docker run -d -p 8080:3000 -v trade-journal-data:/data --name trade-journal trade-journal
```

## Accessing Your Application

After deployment, your application will be available at:
- `http://your-server-ip:8080`

## Data Persistence

This Docker setup includes a Node.js backend that stores all trade data in a persistent volume:

- All data is saved to the `trade-journal-data` Docker volume
- The volume persists even if the container is removed or updated
- Data is stored in a JSON file on the server
- The application automatically connects to this backend API
- To enable the server sync feature, enter `http://localhost:8080/api/trades` in the server configuration

## Backing Up Your Data

To create a backup of your trade data from the Docker volume:

```bash
# Copy the trades.json file from the container
docker cp trade-journal:/data/trades.json ./trades-backup.json
```

To restore from a backup:

```bash
# Copy a backup file to the container
docker cp ./trades-backup.json trade-journal:/data/trades.json
```
