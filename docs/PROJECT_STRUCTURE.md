# 📁 RADAR Dashboard - Project Structure

## 🎯 Organized Module-Wise Structure

```
RADAR-Dashboard3/
│
├── 📂 src/                          # Frontend Source Code
│   ├── App.tsx                      # Main application component
│   ├── index.tsx                    # Entry point
│   ├── constants.ts                 # Application constants
│   ├── types.ts                     # TypeScript type definitions
│   │
│   ├── 📂 components/               # Reusable UI Components
│   │   ├── DeviceList.tsx           # Device table/list view
│   │   ├── DeviceOverview.tsx       # Device cards overview
│   │   ├── HierarchyView.tsx        # Network hierarchy tree
│   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   ├── StatsPanel.tsx           # Statistics panel
│   │   ├── SwitchOverview.tsx       # Switch-specific view
│   │   └── TopologyGraph.tsx        # Network topology graph (D3.js)
│   │
│   └── 📂 pages/                    # Page-level Components
│       ├── DashboardPage.tsx        # Main dashboard page
│       ├── HierarchyPage.tsx        # Hierarchy view page
│       ├── ListPage.tsx             # Device list page
│       └── LoginPage.tsx            # Authentication page
│
├── 📂 backend/                      # Backend API Server
│   ├── server.js                    # Express.js API server
│   ├── .env                         # Backend environment config
│   ├── .env.example                 # Environment template
│   ├── package.json                 # Backend dependencies
│   │
│   ├── 📂 modules/                  # Backend Modules
│   │   ├── config.js                # OpenSearch configuration
│   │   └── fetch.js                 # Data fetching utilities
│   │
│   └── 📂 scripts/                  # Utility Scripts
│       ├── fetch-latest-with-devices.js   # Fetch latest scan
│       ├── test-fetch.js            # Test OpenSearch connection
│       └── view-raw-data.js         # View raw OpenSearch data
│
├── 📂 docs/                         # Documentation
│   ├── DEPLOYMENT_GUIDE.md          # Full production deployment guide
│   ├── QUICKSTART.md                # 5-minute setup guide
│   ├── INTEGRATION_COMPLETE.md      # Integration summary
│   ├── LATEST_SCAN_GUIDE.md         # Latest scan fetcher docs
│   ├── MIGRATION_COMPLETE.md        # Migration notes
│   └── RAW_DATA_STRUCTURE.md        # Data format documentation
│
├── 📂 public/                       # Static Assets
│   └── raw_data_complete.jsonl      # Legacy static data
│
├── 📂 node_modules/                 # Frontend Dependencies (auto-generated)
├── 📂 backend/node_modules/         # Backend Dependencies (auto-generated)
│
├── 📄 index.html                    # HTML entry point
├── 📄 package.json                  # Frontend dependencies & scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 vite.config.ts                # Vite build configuration
│
├── 📄 docker-compose.yml            # Multi-container orchestration
├── 📄 Dockerfile                    # Frontend container image
├── 📄 backend/Dockerfile            # Backend container image
├── 📄 nginx.conf                    # Nginx configuration
│
├── 📄 .env                          # Frontend environment (not in git)
├── 📄 .env.example                  # Frontend environment template
├── 📄 .env.docker                   # Docker environment template
├── 📄 .gitignore                    # Git ignore rules
└── 📄 README.md                     # Project overview
```

---

## 🚀 NPM Scripts

### Root Level (`npm run <script>`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `concurrently "npm run dev:backend" "npm run dev:frontend"` | **Start both backend and frontend** |
| `dev:backend` | `cd backend && npm run dev` | Start backend only (nodemon) |
| `dev:frontend` | `vite` | Start frontend only (Vite dev server) |
| `build` | `tsc && vite build` | Build production frontend |
| `preview` | `vite preview` | Preview production build |
| `start` | `npm run dev` | Alias for dev |

### Backend Level (`cd backend && npm run <script>`)

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node server.js` | Start backend server (production) |
| `dev` | `nodemon server.js` | Start backend with auto-reload |
| `fetch` | `node scripts/test-fetch.js` | Test OpenSearch connection |
| `test:connection` | `node scripts/test-fetch.js` | Same as fetch |
| `raw` | `node scripts/view-raw-data.js` | View raw OpenSearch JSON |
| `latest` | `node scripts/fetch-latest-with-devices.js` | Fetch latest scan to files |

---

## 🎯 Quick Commands

### Development
```bash
# Start everything (backend + frontend)
npm run dev

# Or start separately
npm run dev:backend     # Terminal 1
npm run dev:frontend    # Terminal 2
```

### Production Docker
```bash
docker-compose up -d
```

### Testing
```bash
# Test backend API
cd backend
npm run fetch

# Test latest scan
npm run latest

# View raw data
npm run raw
```

---

## 📦 Module Organization

### Frontend Modules

**`src/components/`** - Reusable UI Components
- Pure presentational components
- Receive data via props
- No direct API calls
- Reusable across pages

**`src/pages/`** - Page Components
- Top-level route components
- Compose multiple components
- Handle page-specific logic
- Connected to routing

**`src/`** - Core Application
- `App.tsx` - Main app with routing
- `types.ts` - TypeScript interfaces
- `constants.ts` - App-wide constants
- `index.tsx` - React entry point

### Backend Modules

**`backend/modules/`** - Core Business Logic
- `config.js` - Configuration management
- `fetch.js` - OpenSearch data fetching

**`backend/scripts/`** - Utility Scripts
- Standalone scripts for testing
- Data exploration tools
- Can be run independently

**`backend/server.js`** - API Server
- Express.js REST API
- Request handling
- OpenSearch integration

### Documentation

**`docs/`** - All Documentation
- Deployment guides
- API documentation
- Architecture diagrams
- Migration notes

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      REQUEST FLOW                            │
└─────────────────────────────────────────────────────────────┘

1. User Opens Browser
   └─> index.html loads
       └─> src/index.tsx renders
           └─> src/App.tsx mounts

2. App.tsx Initialization
   └─> useEffect() hook triggers
       └─> Calls backend API: GET /api/latest-scan

3. Backend API (server.js)
   └─> Receives request
       └─> Calls modules/fetch.js
           └─> Fetches from OpenSearch
               └─> Transforms data format
                   └─> Returns JSON to frontend

4. Frontend Receives Data
   └─> Updates state: setData(validJson)
       └─> Re-renders components
           └─> pages/DashboardPage.tsx
               └─> components/TopologyGraph.tsx
               └─> components/StatsPanel.tsx
               └─> components/DeviceList.tsx

5. Auto-Refresh (if enabled)
   └─> Every 30 seconds, repeat step 2-4

6. Manual Refresh
   └─> User clicks refresh button
       └─> Immediately triggers step 2-4
```

---

## 🌐 API Endpoints

### Backend API (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/latest-scan` | Get latest scan with all devices |
| GET | `/api/scan/:scanId` | Get specific scan by ID |
| GET | `/api/scans?size=10` | List all available scans |

---

## 🎨 Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | DashboardPage | Main dashboard view |
| `/dashboard` | DashboardPage | Dashboard with stats |
| `/switches` | DashboardPage | Switch-specific view |
| `/routers` | DashboardPage | Router-specific view |
| `/firewalls` | DashboardPage | Firewall-specific view |
| `/desktops` | DashboardPage | Desktop devices view |
| `/smartphones` | DashboardPage | Mobile devices view |
| `/cameras` | DashboardPage | Camera devices view |
| `/list` | ListPage | Device list/table view |
| `/hierarchy` | HierarchyPage | Network hierarchy tree |
| `/login` | LoginPage | Authentication |

---

## 🔧 Environment Variables

### Frontend (`.env`)
```env
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (`backend/.env`)
```env
# OpenSearch
OPENSEARCH_HOST=192.168.92.143
OPENSEARCH_PORT=9200
OPENSEARCH_PROTOCOL=https
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD="MyStrong#Pass90"

# Server
PORT=3001
HOST=0.0.0.0

# Indices
OPENSEARCH_INDEX_SCANS=radar-scans
OPENSEARCH_INDEX_DEVICES=radar-devices
```

---

## 📊 Dependencies

### Frontend
- **React 19** - UI framework
- **React Router** - Routing
- **D3.js** - Network graph visualization
- **Framer Motion** - Animations
- **Recharts** - Charts/statistics
- **Lucide React** - Icons
- **Vite** - Build tool
- **TypeScript** - Type safety

### Backend
- **Express** - Web server
- **CORS** - Cross-origin requests
- **dotenv** - Environment variables
- **nodemon** - Auto-reload (dev)

### Development
- **concurrently** - Run multiple commands
- **TypeScript** - Type checking

---

## 🐳 Docker Structure

```
docker-compose.yml
├── Service: backend
│   ├── Port: 3001
│   ├── Dockerfile: backend/Dockerfile
│   └── Dependencies: OpenSearch
│
└── Service: frontend
    ├── Port: 80
    ├── Dockerfile: Dockerfile (root)
    ├── Nginx serving built React app
    └── Depends on: backend
```

---

## 🔐 Security

### Environment-based Configuration
- ✅ No hardcoded credentials
- ✅ `.env` files in `.gitignore`
- ✅ `.env.example` templates provided

### API Security
- ✅ CORS configured
- ✅ Health check endpoints
- ✅ Error handling
- ✅ Request logging

### Docker Security
- ✅ Non-root user in containers
- ✅ Health checks
- ✅ Resource limits (can be configured)

---

## 📝 Development Workflow

### 1. Initial Setup
```bash
# Install dependencies
npm install
cd backend && npm install
```

### 2. Configuration
```bash
# Frontend
cp .env.example .env
# Edit VITE_BACKEND_URL if needed

# Backend
cd backend
cp .env.example .env
# Edit OpenSearch credentials
```

### 3. Development
```bash
# Start everything
npm run dev

# Backend runs on: http://localhost:3001
# Frontend runs on: http://localhost:5173
```

### 4. Building
```bash
# Build frontend
npm run build

# Output: dist/
```

### 5. Production Deployment
```bash
# Docker
docker-compose up -d

# Traditional
cd backend && pm2 start server.js
npm run build && cp -r dist/* /var/www/html/
```

---

## 🆘 Troubleshooting

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

cd backend
rm -rf node_modules package-lock.json
npm install
```

### Backend Won't Start
```bash
cd backend
# Check environment
cat .env

# Test OpenSearch connection
npm run fetch
```

### Frontend Shows 404
```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Check frontend environment
cat .env
```

---

## 📚 Next Steps

1. **Read Documentation**: Check `docs/QUICKSTART.md`
2. **Configure Environment**: Update `.env` files
3. **Start Development**: Run `npm run dev`
4. **Deploy**: Follow `docs/DEPLOYMENT_GUIDE.md`

---

**Last Updated:** February 3, 2026  
**Version:** 2.0.0 (Restructured)
