
# Docker Deployment Guide for Trade Snapshot Journal

This guide explains how to deploy the Trade Snapshot Journal application using Docker and Portainer.

## Option 1: Using Portainer

### Method A: Deploy using Docker Compose Stack (Recommended)

1. **Access your Portainer dashboard**
   - Open your browser and navigate to your Portainer instance (typically `http://your-server-ip:9000`)
   - Log in with your credentials

2. **Create a new stack**
   - In Portainer, navigate to "Stacks" and click "Add stack"
   - Give your stack a name (e.g., "trade-journal")

3. **Use the Web Editor**
   - Under "Build method", select "Web editor"
   - Copy and paste the entire contents of the `docker-compose.yml` file from this repository
   - Optional: Customize environment variables if needed
     - `HOST_PORT`: Change from the default 8080 if needed
     - `IMAGE_NAME`: Specify a custom image name if desired

4. **Deploy the stack**
   - Click "Deploy the stack"
   - Wait for the deployment to complete

### Method B: Deploy using Git Repository

1. **Access your Portainer dashboard**
   - Open your browser and navigate to your Portainer instance
   - Log in with your credentials

2. **Create a new stack**
   - In Portainer, navigate to "Stacks" and click "Add stack"
   - Give your stack a name (e.g., "trade-journal")

3. **Use Git Repository**
   - Under "Build method", select "Repository"
   - Enter your Git repository URL
   - Set the reference name (branch, typically "main" or "master")
   - Set the Compose path to "docker-compose.yml"

4. **Deploy the stack**
   - Click "Deploy the stack"
   - Wait for the deployment to complete

## Troubleshooting Portainer Deployment

If you encounter issues deploying in Portainer:

1. **Check Portainer logs**
   - Go to "Stacks" > your stack name > "Logs"
   - Look for any error messages

2. **Volume permissions**
   - Ensure Portainer has permission to create and manage volumes
   - If using custom bind mounts, ensure proper permissions

3. **Port conflicts**
   - If you get a port conflict error, change the `HOST_PORT` in the environment variables

4. **Build context issues**
   - If deploying from a Git repository, ensure the Dockerfile is in the repository root
   - If using Web Editor, check that the image is built correctly

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
- `http://your-server-ip:8080` (or the port you configured)

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

## Environment Variables

You can customize the deployment by setting the following environment variables in Portainer:

- `HOST_PORT`: The port on your host machine (default: 8080)
- `IMAGE_NAME`: Custom image name if building your own image
- `DATA_DIR`: Location for data storage inside the container (default: /data)
- `PORT`: Internal application port (default: 3000, usually no need to change)

