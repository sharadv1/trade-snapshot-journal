
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
docker run -d -p 8080:80 --name trade-journal trade-journal
```

## Accessing Your Application

After deployment, your application will be available at:
- `http://your-server-ip:8080`

## Notes

- The application uses browser localStorage for data storage, so your data will be stored in the browser, not in the container.
- If you want to implement server-side data persistence, you'll need to develop a backend API and modify the application to use it.
- The "Server Sync" feature in the application can be configured to connect to an API if you develop one separately.

