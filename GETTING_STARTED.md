# ✅ RADAR Dashboard - Complete Setup Guide

## 🎉 What's New

Your RADAR Dashboard has been completely restructured and enhanced with new features!

---

## 📁 New Project Structure

```
RADAR-Dashboard3/
├── src/                    # ✨ All frontend code
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   └── App.tsx, types.ts, etc.
│
├── backend/                # 🔧 API server
│   ├── modules/            # Core logic
│   ├── scripts/            # Utility scripts
│   └── server.js
│
├── docs/                   # 📚 All documentation
│   ├── QUICKSTART.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── PROJECT_STRUCTURE.md
│
├── package.json            # Frontend dependencies
└── docker-compose.yml      # Docker deployment
```

---

## 🚀 Quick Start (ONE COMMAND!)

```bash
npm run dev
```

**That's it!** This command will:
- ✅ Start backend API server (http://localhost:3001)
- ✅ Start frontend dev server (http://localhost:5173)
- ✅ Auto-reload on file changes
- ✅ Connect to OpenSearch automatically

**To stop everything:** Press `Ctrl+C` once

---

## 🎮 New Features

### 1. **Unified Development Command**
```bash
npm run dev              # Starts BOTH backend & frontend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
```

### 2. **Refresh Button** 🔄
- Located next to the notification bell (top-right)
- Click to manually refresh dashboard data
- Shows spinning animation while refreshing
- Displays success/error notifications

### 3. **Auto-Refresh Toggle** ⚡
- Hover over refresh button to see dropdown
- Toggle auto-refresh ON/OFF
- When ON: Checks for new data every 30 seconds
- When OFF: Only refreshes when you click the button
- Shows last refresh time
- Preference saved in browser storage

### 4. **Refresh Notifications** 🔔
- "Dashboard refreshed successfully" - when manual refresh succeeds
- "Failed to refresh data" - when refresh fails
- Shows new device alerts automatically
- All notifications appear in notification panel

---

## 📊 Dashboard Features

### Current Features:
- ✅ Real-time network topology graph
- ✅ Device statistics and overview
- ✅ Search devices by IP, MAC, vendor
- ✅ Filter by device type (switches, routers, etc.)
- ✅ Network hierarchy view
- ✅ Device list/table view
- ✅ Connection tracking
- ✅ Auto-refresh with toggle
- ✅ Manual refresh button
- ✅ Notification system

### How It Works:
1. **Backend** fetches latest scan from OpenSearch
2. **Frontend** polls backend every 30 seconds (if auto-refresh is ON)
3. **Dashboard** updates automatically with new devices
4. **Notifications** alert you when new devices appear
5. **Manual Refresh** lets you update anytime

---

## ⚙️ Configuration

### Frontend (`.env` in root)
```env
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (`backend/.env`)
```env
OPENSEARCH_HOST=192.168.92.143
OPENSEARCH_PORT=9200
OPENSEARCH_PROTOCOL=https
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD="MyStrong#Pass90"

PORT=3001
HOST=0.0.0.0
```

---

## 🎯 Usage Examples

### Development Workflow

```bash
# 1. Clone/Open Project
cd RADAR-Dashboard3

# 2. Install Dependencies (first time only)
npm install
cd backend && npm install && cd ..

# 3. Configure Environment (first time only)
cp .env.example .env
cp backend/.env.example backend/.env
# Edit both files with your settings

# 4. Start Development
npm run dev

# 5. Open Browser
# http://localhost:5173
```

### Using the Dashboard

1. **Open** http://localhost:5173
2. **Login** with your credentials
3. **View** the network topology
4. **Search** for devices using the search bar
5. **Filter** by device type using sidebar
6. **Refresh** manually using the refresh button
7. **Toggle** auto-refresh in the dropdown
8. **Check** notifications for new devices

### Manual Refresh

Click the **refresh button** (🔄) in the top-right corner:
- Immediately fetches latest data from OpenSearch
- Shows spinning animation
- Displays success notification
- Updates all dashboard components

### Auto-Refresh Toggle

Hover over the **refresh button** to see dropdown:
- **ON** (blue toggle): Checks every 30 seconds
- **OFF** (gray toggle): Manual refresh only
- Shows last refresh time
- Preference saved in browser

---

## 📚 Available Scripts

### Root Level
```bash
npm run dev          # Start both backend & frontend
npm run build        # Build production frontend
npm run preview      # Preview production build
npm start            # Alias for dev
```

### Backend (cd backend)
```bash
npm start            # Start backend server
npm run dev          # Start with auto-reload
npm run fetch        # Test OpenSearch connection
npm run latest       # Fetch latest scan to files
npm run raw          # View raw OpenSearch data
```

---

## 🐳 Production Deployment

### Docker (Recommended)
```bash
# 1. Configure
cp .env.docker .env
# Edit with your OpenSearch credentials

# 2. Deploy
docker-compose up -d

# 3. Access
# Frontend: http://localhost
# Backend: http://localhost:3001
```

### Traditional Server
```bash
# Backend with PM2
cd backend
npm ci --only=production
pm2 start server.js --name radar-backend

# Frontend with Nginx
npm run build
sudo cp -r dist/* /var/www/html/radar/
```

---

## 🔍 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Backend health check |
| `GET /api/latest-scan` | Get latest scan with all devices |
| `GET /api/scan/:scanId` | Get specific scan by ID |
| `GET /api/scans?size=10` | List all available scans |

**Test Backend:**
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/latest-scan
```

---

## 🐛 Troubleshooting

### "Cannot GET /" Error
**Problem:** Frontend can't find the page  
**Solution:** Check that `src/index.tsx` path is correct in `index.html`

### Backend Won't Start
**Problem:** Port already in use or OpenSearch not reachable  
**Solution:**
```bash
# Kill any running node processes
Get-Process -Name node | Stop-Process -Force

# Test OpenSearch connection
cd backend
npm run fetch
```

### Frontend Shows "No Data"
**Problem:** Backend not running or wrong URL  
**Solution:**
1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check `.env` file: `VITE_BACKEND_URL=http://localhost:3001`
3. Restart frontend: `Ctrl+C` then `npm run dev`

### Auto-Refresh Not Working
**Problem:** Toggle is OFF or backend not responding  
**Solution:**
1. Hover over refresh button
2. Toggle auto-refresh ON (blue)
3. Check browser console for errors
4. Verify backend is responding

### "concurrently" Error
**Problem:** Package not installed  
**Solution:**
```bash
npm install concurrently
```

---

## 📖 Documentation

- **[PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)** - Complete structure guide
- **[QUICKSTART.md](docs/QUICKSTART.md)** - 5-minute setup
- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[INTEGRATION_COMPLETE.md](docs/INTEGRATION_COMPLETE.md)** - Integration summary

---

## ✨ Key Improvements

### Before:
- ❌ Had to start backend and frontend separately
- ❌ No manual refresh option
- ❌ Auto-refresh always on (no control)
- ❌ Files scattered in root directory
- ❌ No visual feedback on refresh

### After:
- ✅ One command starts everything (`npm run dev`)
- ✅ Manual refresh button with animation
- ✅ Auto-refresh toggle (ON/OFF control)
- ✅ Organized folder structure
- ✅ Success/error notifications
- ✅ Last refresh time display
- ✅ Preference saved in browser

---

## 🎯 Next Steps

1. **Start Development:**
   ```bash
   npm run dev
   ```

2. **Open Dashboard:**
   http://localhost:5173

3. **Test Features:**
   - Click refresh button
   - Toggle auto-refresh
   - Check notifications

4. **Deploy to Production:**
   ```bash
   docker-compose up -d
   ```

5. **Read Documentation:**
   - [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
   - [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

---

## 📞 Support

- **Logs:** Check terminal output from `npm run dev`
- **Backend Logs:** Look for `[0]` prefixed messages
- **Frontend Logs:** Look for `[1]` prefixed messages
- **Browser Console:** Press F12 to see frontend errors

---

## 🎊 Success!

You now have a **fully integrated, production-ready** RADAR Dashboard with:

✅ Unified development environment  
✅ Manual refresh with visual feedback  
✅ Auto-refresh toggle control  
✅ Organized folder structure  
✅ Comprehensive documentation  
✅ Docker deployment ready  
✅ Real-time network monitoring  

**Happy Monitoring! 🚀**

---

*Last Updated: February 3, 2026*  
*Version: 2.0.0 (Restructured + Enhanced)*
