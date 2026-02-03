# RADAR Dashboard - Production Deployment Guide

## 🚀 Quick Start

This guide covers deploying the RADAR Dashboard in production environments including AWS, Docker, and traditional servers.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
  - [Option 1: Docker Compose (Recommended)](#option-1-docker-compose)
  - [Option 2: AWS Deployment](#option-2-aws-deployment)
  - [Option 3: Traditional Server](#option-3-traditional-server)
- [Configuration](#configuration)
- [Security Best Practices](#security-best-practices)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Frontend      │  React + Vite (Port 80)
│   Dashboard     │  
└────────┬────────┘
         │ HTTP/HTTPS
         ↓
┌─────────────────┐
│   Backend API   │  Express.js (Port 3001)
│   Server        │  
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│   OpenSearch    │  (Port 9200)
│   Cluster       │  radar-scans / radar-devices
└─────────────────┘
```

**Data Flow:**
1. Frontend polls Backend API every 30 seconds
2. Backend fetches latest scan from OpenSearch
3. Backend transforms and caches data (10s TTL)
4. Frontend displays real-time network topology

---

## 📦 Prerequisites

- **Node.js**: v18 or higher
- **Docker**: v20+ with Docker Compose (for containerized deployment)
- **OpenSearch**: 2.x or higher with indices `radar-scans` and `radar-devices`
- **Network Access**: Backend must reach OpenSearch cluster

---

## 🐳 Option 1: Docker Compose (Recommended)

### 1. Configure Environment

Copy the environment template:
```bash
cp .env.docker .env
```

Edit `.env` with your OpenSearch credentials:
```env
OPENSEARCH_HOST=192.168.92.143
OPENSEARCH_PORT=9200
OPENSEARCH_PROTOCOL=https
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=YourSecurePassword
```

### 2. Build and Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 3. Verify Deployment

```bash
# Check health
curl http://localhost:3001/api/health
curl http://localhost/health

# Test API
curl http://localhost:3001/api/latest-scan
```

**Access:**
- Frontend: http://localhost
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### 4. Production Configuration

For production, use a reverse proxy:

```nginx
# /etc/nginx/sites-available/radar-dashboard
server {
    listen 443 ssl http2;
    server_name radar.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

---

## ☁️ Option 2: AWS Deployment

### Architecture on AWS

```
Application Load Balancer (ALB)
    ├── Target Group: Frontend (ECS/EC2)
    └── Target Group: Backend (ECS/EC2)
            ↓
    OpenSearch Service Domain
```

### A. Using AWS ECS (Fargate)

#### 1. Create ECR Repositories

```bash
# Create repositories
aws ecr create-repository --repository-name radar-frontend
aws ecr create-repository --repository-name radar-backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push images
docker build -t radar-frontend .
docker tag radar-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/radar-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/radar-frontend:latest

cd backend
docker build -t radar-backend .
docker tag radar-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/radar-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/radar-backend:latest
```

#### 2. Create ECS Task Definition

```json
{
  "family": "radar-dashboard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/radar-backend:latest",
      "portMappings": [{"containerPort": 3001}],
      "environment": [
        {"name": "OPENSEARCH_HOST", "value": "search-your-domain.region.es.amazonaws.com"},
        {"name": "OPENSEARCH_PORT", "value": "443"},
        {"name": "OPENSEARCH_PROTOCOL", "value": "https"},
        {"name": "PORT", "value": "3001"},
        {"name": "HOST", "value": "0.0.0.0"}
      ],
      "secrets": [
        {"name": "OPENSEARCH_USERNAME", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "OPENSEARCH_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    },
    {
      "name": "frontend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/radar-frontend:latest",
      "portMappings": [{"containerPort": 80}],
      "environment": [
        {"name": "VITE_BACKEND_URL", "value": "http://backend:3001"}
      ]
    }
  ]
}
```

#### 3. Create ECS Service

```bash
aws ecs create-service \
  --cluster radar-cluster \
  --service-name radar-dashboard \
  --task-definition radar-dashboard \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### B. Using OpenSearch Service

```bash
# Create OpenSearch domain
aws opensearch create-domain \
  --domain-name radar-opensearch \
  --engine-version OpenSearch_2.11 \
  --cluster-config InstanceType=t3.small.search,InstanceCount=2 \
  --ebs-options EBSEnabled=true,VolumeType=gp3,VolumeSize=20 \
  --access-policies '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::<account-id>:role/ECSTaskRole"},
      "Action": "es:*",
      "Resource": "arn:aws:es:region:<account-id>:domain/radar-opensearch/*"
    }]
  }'
```

Update backend environment:
```env
OPENSEARCH_HOST=search-radar-opensearch-xxxxx.region.es.amazonaws.com
OPENSEARCH_PORT=443
OPENSEARCH_PROTOCOL=https
```

---

## 🖥️ Option 3: Traditional Server

### 1. Install Dependencies

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Deploy Backend

```bash
cd backend

# Install dependencies
npm ci --only=production

# Configure environment
cp .env.example .env
nano .env  # Edit with your OpenSearch credentials

# Start with PM2
pm2 start server.js --name radar-backend
pm2 save
pm2 startup
```

### 3. Deploy Frontend

```bash
# Build frontend
npm ci
npm run build

# Install nginx
sudo apt-get install -y nginx

# Copy build to nginx
sudo cp -r dist/* /var/www/html/radar/

# Configure nginx
sudo nano /etc/nginx/sites-available/radar
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name radar.yourdomain.com;

    root /var/www/html/radar;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/radar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d radar.yourdomain.com
```

---

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENSEARCH_HOST` | OpenSearch hostname | - | ✅ |
| `OPENSEARCH_PORT` | OpenSearch port | 9200 | ✅ |
| `OPENSEARCH_PROTOCOL` | http or https | https | ✅ |
| `OPENSEARCH_USERNAME` | Auth username | admin | ✅ |
| `OPENSEARCH_PASSWORD` | Auth password | - | ✅ |
| `OPENSEARCH_INDEX_SCANS` | Scans index | radar-scans | ✅ |
| `OPENSEARCH_INDEX_DEVICES` | Devices index | radar-devices | ✅ |
| `PORT` | Backend port | 3001 | ❌ |
| `HOST` | Bind address | 0.0.0.0 | ❌ |
| `CACHE_TTL` | Cache duration (ms) | 10000 | ❌ |
| `NODE_ENV` | Environment | production | ❌ |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_BACKEND_URL` | Backend API URL | http://localhost:3001 | ✅ |

---

## 🔒 Security Best Practices

### 1. Never Hardcode Credentials

✅ **Good:**
```env
OPENSEARCH_PASSWORD="${OPENSEARCH_PASSWORD}"
```

❌ **Bad:**
```javascript
const password = "MyPassword123";
```

### 2. Use Secrets Management

**AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name radar/opensearch \
  --secret-string '{"username":"admin","password":"SecurePass123"}'
```

**Docker Secrets:**
```yaml
services:
  backend:
    secrets:
      - opensearch_password
secrets:
  opensearch_password:
    external: true
```

### 3. Enable TLS/SSL

- Use valid SSL certificates (Let's Encrypt for free)
- Enforce HTTPS in production
- Set secure headers in nginx

### 4. Network Security

- Use VPC/Security Groups to restrict access
- Allow only necessary ports (80, 443, 3001)
- Use private subnets for backend/database

### 5. Rate Limiting

Add to nginx:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20;
    proxy_pass http://localhost:3001;
}
```

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl http://localhost:3001/api/health

# OpenSearch connectivity
curl -k -u admin:password https://opensearch:9200/_cluster/health
```

### Logging

**Docker:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend --tail=100
```

**PM2:**
```bash
pm2 logs radar-backend
pm2 monit
```

### Metrics

Monitor these metrics:
- Backend API response time
- OpenSearch query latency
- Memory/CPU usage
- Error rates
- Cache hit ratio

**Prometheus + Grafana:**
```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

### Backup Strategy

**OpenSearch Snapshots:**
```bash
# Create snapshot repository
PUT /_snapshot/radar_backups
{
  "type": "s3",
  "settings": {
    "bucket": "radar-opensearch-backups",
    "region": "us-east-1"
  }
}

# Create snapshot
PUT /_snapshot/radar_backups/snapshot_1
```

### Updates & Maintenance

```bash
# Update backend
cd backend
git pull
npm ci --only=production
pm2 restart radar-backend

# Update frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/html/radar/
```

---

## 🆘 Troubleshooting

### Backend Can't Connect to OpenSearch

```bash
# Check network connectivity
curl -k https://192.168.92.143:9200

# Verify credentials
curl -k -u admin:password https://192.168.92.143:9200

# Check firewall rules
sudo ufw status
```

### Frontend Shows No Data

1. Check backend API: `curl http://localhost:3001/api/latest-scan`
2. Verify `VITE_BACKEND_URL` in frontend `.env`
3. Check browser console for CORS errors
4. Ensure backend is running: `pm2 status`

### Docker Container Crashes

```bash
# Check logs
docker logs radar-backend

# Check resource limits
docker stats

# Restart container
docker-compose restart backend
```

---

## 📚 API Reference

### GET /api/health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-03T14:00:00.000Z",
  "service": "radar-dashboard-backend",
  "version": "1.0.0"
}
```

### GET /api/latest-scan
Get latest scan with all devices

**Response:**
```json
{
  "export_timestamp": "2026-02-03T14:00:00.000Z",
  "scan_id": "2026-02-03T14:10:08.727Z",
  "data": {
    "devices": {"count": 12, "records": [...]},
    "connections": {"count": 5, "records": [...]},
    "networks": {"count": 1, "records": [...]}
  },
  "cached": false
}
```

### GET /api/scan/:scanId
Get specific scan by ID

### GET /api/scans?size=10
List all available scans

---

## 📞 Support

For issues, see:
- Backend logs: `pm2 logs radar-backend`
- Frontend logs: Browser DevTools Console
- OpenSearch logs: Check cluster logs

---

## 📝 License

Copyright © 2026 RADAR Dashboard Team
