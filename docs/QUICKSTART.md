# RADAR Dashboard - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Local Development

1. **Install Backend Dependencies:**
```bash
cd backend
npm install
```

2. **Configure Backend Environment:**
```bash
cp .env.example .env
# Edit .env with your OpenSearch credentials
```

3. **Start Backend Server:**
```bash
npm start
# Server will run on http://localhost:3001
```

4. **Install Frontend Dependencies:**
```bash
cd ..
npm install
```

5. **Configure Frontend Environment:**
```bash
cp .env.example .env
# Make sure VITE_BACKEND_URL=http://localhost:3001
```

6. **Start Frontend:**
```bash
npm run dev
# Dashboard will open at http://localhost:5173
```

### Production Deployment with Docker

1. **Configure Environment:**
```bash
cp .env.docker .env
# Edit .env with your OpenSearch credentials
```

2. **Start Services:**
```bash
docker-compose up -d
```

3. **Access Dashboard:**
- Frontend: http://localhost
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### Test the Integration

```bash
# Test backend API
curl http://localhost:3001/api/health
curl http://localhost:3001/api/latest-scan

# Check if data is showing in dashboard
# Open browser to http://localhost (or http://localhost:5173 for dev)
```

---

## 📡 How It Works

### Data Flow
```
OpenSearch (192.168.92.143:9200)
    ↓ fetch latest scan
Backend API (localhost:3001)
    ↓ transform & cache
Frontend Dashboard (localhost:5173)
    ↓ display topology
User sees real-time network map
```

### Automatic Updates
- Frontend polls backend every **30 seconds**
- Backend caches data for **10 seconds**
- New scans automatically appear on dashboard
- No manual refresh needed

---

## 🔧 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Backend health check |
| `GET /api/latest-scan` | Get latest scan + devices |
| `GET /api/scan/:scanId` | Get specific scan |
| `GET /api/scans?size=10` | List all scans |

---

## 📂 Project Structure

```
RADAR-Dashboard3/
├── backend/
│   ├── server.js           # Express API server
│   ├── modules/
│   │   ├── config.js       # OpenSearch configuration
│   │   └── fetch.js        # Data fetching logic
│   ├── .env                # Backend environment variables
│   └── Dockerfile          # Backend container image
├── App.tsx                 # Main frontend app
├── components/             # React components
├── pages/                  # Dashboard pages
├── docker-compose.yml      # Multi-container orchestration
└── DEPLOYMENT_GUIDE.md     # Full deployment documentation
```

---

## ⚙️ Environment Variables

### Backend (.env in backend/)
```env
OPENSEARCH_HOST=192.168.92.143
OPENSEARCH_PORT=9200
OPENSEARCH_PROTOCOL=https
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD="YourPassword"
OPENSEARCH_INDEX_SCANS=radar-scans
OPENSEARCH_INDEX_DEVICES=radar-devices
PORT=3001
HOST=0.0.0.0
```

### Frontend (.env in root)
```env
VITE_BACKEND_URL=http://localhost:3001
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
npm install
node server.js
# Check for errors in console
```

### Frontend shows "No data"
1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check browser console for errors
3. Verify `VITE_BACKEND_URL` in `.env`

### OpenSearch connection fails
1. Test connection: `curl -k https://192.168.92.143:9200`
2. Verify credentials in `backend/.env`
3. Check if OpenSearch is accessible from your machine

---

## 📚 Next Steps

- **Full Deployment Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Docker Deployment**: Use `docker-compose up -d`
- **AWS Deployment**: Check deployment guide for ECS/Fargate setup
- **Security**: Review security best practices section

---

## 🎯 Key Features

✅ **Real-time Updates**: Automatic polling every 30 seconds  
✅ **Production Ready**: Docker + AWS deployment support  
✅ **Secure**: Environment-based configuration, no hardcoded credentials  
✅ **Scalable**: Stateless backend, horizontal scaling ready  
✅ **Cached**: 10-second cache to reduce OpenSearch load  
✅ **Health Checks**: Built-in monitoring endpoints  

---

## 📞 Need Help?

- Check logs: `docker-compose logs -f backend`
- Test API: `curl http://localhost:3001/api/latest-scan`
- View browser console for frontend errors
- Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed setup

---

**Happy Monitoring! 🎉**
