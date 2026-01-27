# Deployment Guide

This guide covers deploying the NBA Game Predictions application to various platforms.

## Prerequisites

- Docker and Docker Compose installed
- Git repository with CI/CD pipeline configured
- Account on chosen cloud platform

## Local Deployment (Docker Compose)

The simplest way to run the entire stack locally:

```bash
# Clone the repository
git clone https://github.com/yourusername/nba-predictions.git
cd nba-predictions

# Start all services
docker-compose up --build

# Services available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - PostgreSQL: localhost:5432
```

To run in detached mode:
```bash
docker-compose up -d --build
```

To stop:
```bash
docker-compose down
```

To stop and remove volumes:
```bash
docker-compose down -v
```

## Cloud Deployment Options

### Option 1: Railway

Railway provides easy deployment for containerized applications.

1. **Create Railway Account**: https://railway.app

2. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Create New Project**:
   ```bash
   railway init
   ```

4. **Add PostgreSQL Database**:
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Note the `DATABASE_URL` connection string

5. **Configure Environment Variables**:
   ```bash
   railway variables set DATABASE_URL="your_postgres_url"
   railway variables set SECRET_KEY="your_secret_key"
   railway variables set ENVIRONMENT="production"
   ```

6. **Deploy**:
   ```bash
   railway up
   ```

7. **Set up Automatic Deployments**:
   - Connect your GitHub repository in Railway dashboard
   - Add `RAILWAY_TOKEN` to GitHub secrets

### Option 2: Render

Render provides free tier hosting for web services.

1. **Create Render Account**: https://render.com

2. **Create New Web Services**:

   **Backend Service**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Environment: Python 3

   **Frontend Service**:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment: Static Site

3. **Add PostgreSQL**:
   - Create new PostgreSQL database in Render
   - Copy the connection string

4. **Configure Environment**:
   - Add `DATABASE_URL` to backend service
   - Add `VITE_API_URL` to frontend build

5. **Set up Deploy Hook**:
   - Copy the Deploy Hook URL from Render
   - Add as `RENDER_DEPLOY_HOOK_URL` in GitHub secrets

### Option 3: Fly.io

Fly.io provides global edge deployment.

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Create `fly.toml` for Backend**:
   ```toml
   app = "nba-predictions-api"
   
   [build]
     dockerfile = "backend/Dockerfile"
   
   [env]
     ENVIRONMENT = "production"
   
   [http_service]
     internal_port = 8000
     force_https = true
   ```

3. **Create PostgreSQL**:
   ```bash
   fly postgres create --name nba-predictions-db
   fly postgres attach nba-predictions-db
   ```

4. **Deploy**:
   ```bash
   fly deploy
   ```

### Option 4: AWS (ECS/Fargate)

For production-grade deployment on AWS:

1. **Prerequisites**:
   - AWS CLI configured
   - ECR repository created
   - ECS cluster created

2. **Push Images to ECR**:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URL
   docker tag nba-predictions-backend:latest $ECR_URL/backend:latest
   docker push $ECR_URL/backend:latest
   ```

3. **Create ECS Task Definition and Service**

4. **Set up RDS PostgreSQL**

5. **Configure Application Load Balancer**

## Database Migrations

For production environments, use Alembic for database migrations:

```bash
cd backend

# Initialize Alembic (one-time)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

## Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SECRET_KEY` | JWT signing secret | Yes |
| `ENVIRONMENT` | `development` or `production` | No |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |

## Health Checks

The application provides health check endpoints:

- Backend: `GET /api/health`
- Frontend: Serves `index.html` on all routes

## Monitoring and Logging

### Recommended Tools

- **Logging**: Structured JSON logging, ship to CloudWatch/Datadog
- **Monitoring**: Prometheus + Grafana, or cloud-native solutions
- **Error Tracking**: Sentry

### Adding Sentry

Backend:
```python
import sentry_sdk
sentry_sdk.init(dsn="your-sentry-dsn")
```

Frontend:
```typescript
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: "your-sentry-dsn" });
```

## SSL/TLS

All cloud platforms above provide automatic SSL certificates. For custom domains:

1. Add your domain in the platform dashboard
2. Update DNS records (CNAME or A record)
3. Platform will provision SSL certificate automatically

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Verify `DATABASE_URL` is correctly set
   - Check network/firewall rules

2. **CORS errors**:
   - Ensure backend allows frontend origin
   - Check CORS middleware configuration

3. **Build failures**:
   - Check Docker build logs
   - Verify all dependencies are installed

### Getting Help

- Check application logs: `docker-compose logs -f`
- Review CI/CD pipeline runs in GitHub Actions
- Consult platform-specific documentation
