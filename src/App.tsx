import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ListPage from './pages/ListPage';
import HierarchyPage from './pages/HierarchyPage';
import LoginPage from './pages/LoginPage';
import { RawNetworkData, GraphNode, DeviceRecord } from './types';
import { DEFAULT_DATA } from './constants';
import { 
  Upload, X, Search, 
  Terminal, CheckCircle2, AlertCircle, Download, ArrowRight, 
  Bell, Trash2, PanelLeft, Info, RefreshCw
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Helper to Create GraphNode for consistency
const createGraphNodeFromDevice = (device: DeviceRecord): GraphNode => ({
  id: device.mac || `dev-${device.id}`,
  label: device.name,
  type: device.type,
  ip: device.ip,
  mac: device.mac,
  vendor: device.vendor,
  state: device.type.includes('ACTIVE') || device.type === 'Switch' ? 'ACTIVE' : 'INACTIVE',
  confidence: device.confidence,
  method: device.detection_method,
  details: device,
  x: 0, y: 0, vx: 0, vy: 0 
});

type NotificationType = {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };
  
  const [data, setData] = useState<RawNetworkData>(DEFAULT_DATA);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [showInputModal, setShowInputModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Filtering State
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SWITCH' | 'ROUTER' | 'FIREWALL' | 'DESKTOP' | 'SMARTPHONE' | 'CAMERA'>('ALL');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('All Networks');
  
  // Global Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track current scan_id to avoid unnecessary updates
  const currentScanId = useRef<string | null>(null);
  const [filteredDevices, setFilteredDevices] = useState<DeviceRecord[]>([]);

  // Action States
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{status: 'success' | 'error', msg: string} | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [deviceLogs, setDeviceLogs] = useState<any[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationType[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const prevDevicesRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Auto-refresh State
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    return localStorage.getItem('autoRefresh') !== 'false'; // Default true
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setShowNotificationPanel(false);
      }
    };

    if (showNotificationPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationPanel]);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now();
    const newNotif = { id, message, type, timestamp: Date.now() };
    
    // Add to toasts
    setNotifications(prev => [...prev, newNotif]);
    // Add to history
    setNotificationHistory(prev => [newNotif, ...prev].slice(0, 50));

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Helper to validate data structure
  const isValidData = (json: any): boolean => {
    return json && json.data && json.data.devices && Array.isArray(json.data.devices.records);
  };

  // Polling Effect
  useEffect(() => {
    let isMounted = true;
    let pollInterval: number | null = null;

    const fetchData = async (isManual: boolean = false) => {
      if (isManual) {
        setIsRefreshing(true);
      }
      
      try {
        // Fetch from backend API instead of static file
        const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';
        const res = await fetch(`${backendUrl}/api/latest-scan`, {
          cache: "no-store"
        });

        if (!res.ok) {
          console.warn(`Backend API error: ${res.status} ${res.statusText}`);
          if (isManual) {
            addNotification('Failed to refresh data', 'warning');
          }
          return;
        }

        const validJson = await res.json();

        if (isMounted) {
          if (validJson && isValidData(validJson)) {
              // Check if scan_id has changed
              const newScanId = validJson.scan_id;
              const isSameScan = newScanId === currentScanId.current;
              
              if (isSameScan && !isManual) {
                console.log(`⏭️  Skipping update - same scan_id: ${newScanId}`);
                return; // Don't update state if scan hasn't changed
              }
              
              if (!isSameScan) {
                console.log(`✨ New scan detected: ${newScanId}`);
                currentScanId.current = newScanId;
              }
              
              setData(validJson);
              setLastRefreshTime(new Date());

              // Detect New Devices
              const currentMacs = new Set(validJson.data.devices.records.map((d: DeviceRecord) => d.mac));
              
              if (!isFirstLoad.current) {
                 const newMacs = Array.from(currentMacs).filter((x) => !prevDevicesRef.current.has(x as string));
                 if (newMacs.length > 0 && !isSameScan) {
                     const newDeviceCount = newMacs.length;
                     const sampleName = validJson.data.devices.records.find((d: DeviceRecord) => d.mac === newMacs[0])?.name || 'Unknown Device';
                     const msg = newDeviceCount === 1 
                        ? `New device detected: ${sampleName}` 
                        : `${newDeviceCount} new devices detected in network scan`;
                     addNotification(msg, 'success');
                 }
              }
              
              if (isManual) {
                const statusMsg = isSameScan 
                  ? 'Dashboard refreshed (no new scan data)'
                  : 'Dashboard refreshed successfully';
                addNotification(statusMsg, 'success');
              }
              
              prevDevicesRef.current = currentMacs as Set<string>;
          } else {
             console.warn("Incomplete or malformed data received, skipping update.");
             if (isManual) {
               addNotification('Invalid data received', 'warning');
             }
          }
          isFirstLoad.current = false;
        }
      } catch (err) {
        console.error("Failed to fetch data from backend API", err);
        if (isManual) {
          addNotification('Network error occurred', 'warning');
        }
      } finally {
        if (isManual) {
          setTimeout(() => setIsRefreshing(false), 500);
        }
      }
    };

    // Make fetchData accessible globally for manual refresh
    (window as any).refreshDashboard = () => fetchData(true);

    fetchData(); // initial load
    
    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      pollInterval = window.setInterval(() => fetchData(false), 30000);
    }

    return () => {
      isMounted = false;
      if (pollInterval) window.clearInterval(pollInterval);
    };
  }, [autoRefresh]);

  // Save auto-refresh preference
  useEffect(() => {
    localStorage.setItem('autoRefresh', String(autoRefresh));
  }, [autoRefresh]);

  const handleManualRefresh = () => {
    (window as any).refreshDashboard?.();
  };

  // Compute Filtered Data
  const filteredData = useMemo(() => {
      // Defensive Check: Ensure valid data structure before filtering
      if (!data || !data.data || !data.data.devices || !Array.isArray(data.data.devices.records)) {
          return DEFAULT_DATA;
      }

      let records = data.data.devices.records;

      // 1. Filter by Network
      if (selectedNetwork !== 'All Networks') {
          records = records.filter(d => d.network === selectedNetwork);
      }

      // 2. Filter by Category
      if (selectedCategory === 'SWITCH') {
          // Find all switches first
          const switches = records.filter(d => d.type === 'Switch' || d.type.includes('Switch'));
          
          // Get all devices connected to these switches via connections
          const switchIds = new Set(switches.map(s => s.id));
          const connectedMacs = new Set<string>();
          
          if (data.data.connections && data.data.connections.records) {
              data.data.connections.records.forEach(conn => {
                  if (switchIds.has(conn.device_id)) {
                      connectedMacs.add(conn.mac_address.replace(/-/g, ':'));
                  }
              });
          }
          
          // Include switches and all connected devices
          records = records.filter(d => 
              (d.type === 'Switch' || d.type.includes('Switch')) || 
              connectedMacs.has(d.mac)
          );
      }
      else if (selectedCategory === 'ROUTER') records = records.filter(d => d.type === 'Router' || d.type === 'Gateway' || d.type.includes('Router'));
      else if (selectedCategory === 'FIREWALL') records = records.filter(d => d.type === 'Firewall' || d.type.includes('Firewall'));
      else if (selectedCategory === 'DESKTOP') records = records.filter(d => d.type === 'Desktop' || d.type === 'Workstation' || d.type === 'Laptop' || d.type.includes('ACTIVE_HOST'));
      else if (selectedCategory === 'SMARTPHONE') records = records.filter(d => d.type.includes('Android') || d.type.includes('iOS') || d.type.includes('Phone') || d.type.includes('Smartphone'));
      else if (selectedCategory === 'CAMERA') records = records.filter(d => d.type.includes('Camera') || d.type.includes('IP Camera'));

      // Return a new data object structure so children components re-render with filtered set
      return {
          ...data,
          data: {
              ...data.data,
              devices: {
                  ...data.data.devices,
                  count: records.length,
                  records: records
              }
          }
      };
  }, [data, selectedNetwork, selectedCategory]);

  // Extract Unique Networks for Dropdown
  const uniqueNetworks = useMemo(() => {
      if (!data || !data.data || !data.data.devices || !Array.isArray(data.data.devices.records)) {
          return ['All Networks'];
      }
      const nets = new Set(data.data.devices.records.map(d => d.network).filter(Boolean));
      return ['All Networks', ...Array.from(nets)];
  }, [data]);

  // Search Effect
  useEffect(() => {
    if (!searchTerm.trim()) {
        setFilteredDevices([]);
        return;
    }
    
    // Safety check
    if (!data || !data.data || !data.data.devices || !Array.isArray(data.data.devices.records)) return;

    const term = searchTerm.toLowerCase();
    const results = data.data.devices.records.filter(d => 
        (d.name && d.name.toLowerCase().includes(term)) ||
        (d.ip && d.ip.includes(term)) ||
        (d.vendor && d.vendor.toLowerCase().includes(term) ) ||
        (d.mac && d.mac.toLowerCase().includes(term))
    );
    setFilteredDevices(results.slice(0, 8)); // Limit results
  }, [searchTerm, data]); 

  // Sync selectedCategory with current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/switches') setSelectedCategory('SWITCH');
    else if (path === '/routers') setSelectedCategory('ROUTER');
    else if (path === '/firewalls') setSelectedCategory('FIREWALL');
    else if (path === '/desktops') setSelectedCategory('DESKTOP');
    else if (path === '/smartphones') setSelectedCategory('SMARTPHONE');
    else if (path === '/cameras') setSelectedCategory('CAMERA');
    else if (path === '/dashboard' || path === '/') setSelectedCategory('ALL');
  }, [location.pathname]);

  // Clear ping result when node changes
  useEffect(() => {
    setPingResult(null);
    setIsPinging(false);
  }, [selectedNode]);

  const handleSearchResultClick = (device: DeviceRecord) => {
    const node = createGraphNodeFromDevice(device);
    setSelectedNode(node);
    navigate('/dashboard'); // Navigate to dashboard route
    setSearchTerm(''); 
    setFilteredDevices([]);
  };

  const handleJsonUpdate = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (isValidData(parsed)) {
        setData(parsed);
        setShowInputModal(false);
        setJsonInput('');
      } else {
        alert("Invalid JSON format. Must contain data.devices.records array.");
      }
    } catch (e) {
      alert("Invalid JSON syntax.");
    }
  };

  const handlePing = () => {
    if (!selectedNode) return;
    setIsPinging(true);
    setPingResult(null);
    
    // Simulate network delay
    setTimeout(() => {
        const isOnline = selectedNode.state === 'ACTIVE' || selectedNode.type === 'Switch';
        const success = isOnline && Math.random() > 0.1; 
        
        setIsPinging(false);
        if (success) {
            const time = Math.floor(Math.random() * 20) + 1;
            setPingResult({
                status: 'success',
                msg: `Reply from ${selectedNode.ip}: bytes=32 time=${time}ms TTL=64`
            });
        } else {
            setPingResult({
                status: 'error',
                msg: `Request timed out. Destination host unreachable.`
            });
        }
        setTimeout(() => {
            if (selectedNode) setPingResult(null);
        }, 5000);
    }, 1500);
  };

  const handleViewLogs = () => {
    if (!selectedNode) return;
    
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const messages = [
        `Interface eth0 connection established`,
        `SSH session opened for user admin from 10.0.0.5`,
        `Packet dropped: IN=eth0 OUT= MAC=${selectedNode.mac.substring(0,8)}...`,
        `Cron job executed: /usr/bin/daily_backup`,
        `System load average: 0.12, 0.08, 0.05`,
        `DHCPDISCOVER received on eth0`,
        `DHCPOFFER sent to ${selectedNode.ip}`,
        `SNMP query received from management server`,
        `Kernel: [1234.567] link is up`,
        `Authentication failed for user root`
    ];
    
    const logs = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
        level: levels[Math.floor(Math.random() * (selectedNode.state === 'ACTIVE' ? 2 : levels.length))],
        message: messages[Math.floor(Math.random() * messages.length)]
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setDeviceLogs(logs);
    setShowLogsModal(true);
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans relative">
      
      {/* Sidebar Navigation */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedNetwork={selectedNetwork}
        setSelectedNetwork={setSelectedNetwork}
        uniqueNetworks={uniqueNetworks}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Notifications Container (Toasts) */}
        <div className="absolute top-6 right-8 z-[60] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border border-white/10 ${
                            n.type === 'success' ? 'bg-emerald-500/90 text-white' : 
                            n.type === 'warning' ? 'bg-amber-500/90 text-white' : 
                            'bg-blue-600/90 text-white'
                        }`}
                    >
                        {n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        <div className="text-sm font-medium">{n.message}</div>
                        <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="ml-2 hover:bg-white/20 rounded p-0.5">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Header */}
        <header className="h-20 flex items-center px-8 justify-between z-20 shrink-0 relative">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50"
            >
                <PanelLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight flex items-center gap-2">
                    Eagleye <span className="text-blue-500">Radar</span>
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    System Operational
                </p>
            </div>
          </div>

          {/* Global Search Bar with Results Dropdown */}
          <div className="flex-1 max-w-md mx-8 relative group z-50">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-700/50 rounded-xl leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 sm:text-sm transition-all shadow-inner"
                placeholder="Search nodes, IPs, vendors, mac..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <button 
                    onClick={() => { setSearchTerm(''); setFilteredDevices([]); }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
            {searchTerm && filteredDevices.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0F172A] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50"
                >
                    <div className="py-2">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                            <span>Matches Found</span>
                            <span className="bg-slate-800 text-slate-400 px-1.5 rounded">{filteredDevices.length}</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredDevices.map((device, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSearchResultClick(device)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-600/10 hover:border-l-2 border-l-2 border-transparent hover:border-blue-500 flex items-center justify-between group transition-all"
                            >
                                <div>
                                    <div className="text-sm font-medium text-slate-200 group-hover:text-white flex items-center gap-2">
                                        {device.name}
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${device.type.includes('ACTIVE') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                            {device.type}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 group-hover:text-slate-400 font-mono mt-0.5">
                                        {device.ip} • {device.vendor} • {device.mac}
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                            </button>
                        ))}
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-3">
             {/* Refresh Button with Auto-refresh Toggle */}
             <div className="relative">
               <button 
                  className={`p-2.5 rounded-full transition-all duration-200 ${isRefreshing ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  title={`Refresh Dashboard${lastRefreshTime ? ' - Last: ' + lastRefreshTime.toLocaleTimeString() : ''}`}
               >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
               </button>
             </div>
             
             {/* Auto-refresh Toggle Button */}
             <div className="relative">
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setAutoRefresh(!autoRefresh);
                 }}
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                   autoRefresh 
                     ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30' 
                     : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-300'
                 }`}
                 title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}
               >
                 <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                 Auto
               </button>
             </div>

             {/* Notification Button */}
             <button 
                className={`relative p-2.5 rounded-full transition-all duration-200 ${showNotificationPanel ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                title="Notifications"
             >
                <Bell className="w-5 h-5" />
                {notificationHistory.length > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617]"></span>
                )}
             </button>

             {/* Notification Dropdown Panel */}
             <AnimatePresence>
             {showNotificationPanel && (
                 <motion.div
                     ref={notificationPanelRef}
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="fixed top-20 right-8 w-80 bg-[#0F172A] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-[80]"
                 >
                     <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                         <div className="flex items-center gap-2">
                             <Bell className="w-4 h-4 text-slate-400" />
                             <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Notifications</span>
                         </div>
                         <button 
                            onClick={() => setNotificationHistory([])} 
                            className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                         >
                            <Trash2 className="w-3 h-3" /> Clear
                         </button>
                     </div>
                     <div className="max-h-[300px] overflow-y-auto custom-scrollbar bg-[#0b1120]">
                         {notificationHistory.length === 0 ? (
                             <div className="p-8 text-center flex flex-col items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center">
                                     <Bell className="w-5 h-5 text-slate-600" />
                                 </div>
                                 <p className="text-slate-500 text-xs">No notifications yet</p>
                             </div>
                         ) : (
                             notificationHistory.map(n => (
                                 <div key={n.id} className="p-3 border-b border-slate-800/30 hover:bg-white/5 transition-colors group">
                                     <div className="flex items-start gap-3">
                                         <div className={`mt-0.5 p-1 rounded-full shrink-0 ${
                                             n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 
                                             n.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                                             'bg-blue-500/10 text-blue-400'
                                         }`}>
                                            {n.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : 
                                             n.type === 'warning' ? <AlertCircle className="w-3 h-3" /> :
                                             <Info className="w-3 h-3" />}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <p className="text-xs text-slate-300 leading-relaxed break-words">{n.message}</p>
                                             <p className="text-[10px] text-slate-600 mt-1 font-mono">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                         </div>
                                     </div>
                                 </div>
                             ))
                         )}
                     </div>
                 </motion.div>
             )}
             </AnimatePresence>

           
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-hidden px-6 pb-6 pt-0 relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            <div className={`flex flex-col gap-6 lg:col-span-3 h-full overflow-y-auto pr-1 custom-scrollbar pb-2`}>
              
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <DashboardPage
                    filteredData={filteredData}
                    fullData={data}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    searchTerm={searchTerm}
                    isPinging={isPinging}
                    pingResult={pingResult}
                    handlePing={handlePing}
                    handleViewLogs={handleViewLogs}
                    showStats={true}
                  />
                } />
                <Route path="/switches" element={
                  <DashboardPage
                    filteredData={filteredData}
                    fullData={data}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    searchTerm={searchTerm}
                    isPinging={isPinging}
                    pingResult={pingResult}
                    handlePing={handlePing}
                    handleViewLogs={handleViewLogs}
                    showDeviceOverview={true}
                    deviceType="Switch"
                  />
                } />
                <Route path="/routers" element={
                  <DashboardPage
                    filteredData={filteredData}
                    fullData={data}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    searchTerm={searchTerm}
                    isPinging={isPinging}
                    pingResult={pingResult}
                    handlePing={handlePing}
                    handleViewLogs={handleViewLogs}
                    showDeviceOverview={true}
                    deviceType="Router"
                  />
                } />
                <Route path="/firewalls" element={
                  <DashboardPage
                    filteredData={filteredData}
                    fullData={data}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    searchTerm={searchTerm}
                    isPinging={isPinging}
                    pingResult={pingResult}
                    handlePing={handlePing}
                    handleViewLogs={handleViewLogs}
                    showDeviceOverview={true}
                    deviceType="Firewall"
                  />
                } />
                <Route path="/desktops" element={
                  <DashboardPage
                    filteredData={filteredData}
                    fullData={data}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    searchTerm={searchTerm}
                    isPinging={isPinging}
                    pingResult={pingResult}
                    handlePing={handlePing}
                    handleViewLogs={handleViewLogs}
                    showDeviceOverview={true}
                    deviceType="Desktop"
                  />
                } />
                <Route path="/smartphones" element={
                  <DashboardPage
                    filteredData={filteredData}
                    fullData={data}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    searchTerm={searchTerm}
                    isPinging={isPinging}
                    pingResult={pingResult}
                    handlePing={handlePing}
                    handleViewLogs={handleViewLogs}
                    showDeviceOverview={true}
                    deviceType="Smartphone"
                  />
                } />
                <Route path="/cameras" element={
                  <DashboardPage
                    filteredData={filteredData}
                    fullData={data}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    searchTerm={searchTerm}
                    isPinging={isPinging}
                    pingResult={pingResult}
                    handlePing={handlePing}
                    handleViewLogs={handleViewLogs}
                    showDeviceOverview={true}
                    deviceType="Camera"
                  />
                } />
                <Route path="/list" element={
                  <ListPage
                    devices={filteredData.data.devices.records}
                    onSelect={(node) => {
                      setSelectedNode(node);
                      navigate('/dashboard');
                    }}
                    searchTerm={searchTerm}
                  />
                } />
                <Route path="/hierarchy" element={
                  <HierarchyPage
                    data={filteredData}
                    onDeviceSelect={(device) => {
                      const node = createGraphNodeFromDevice(device);
                      setSelectedNode(node);
                      navigate('/dashboard');
                    }}
                  />
                } />
              </Routes>

            </div>
          </div>
        </div>
      </main>

      {/* Input Modal */}
      <AnimatePresence>
      {showInputModal && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Import Topology Data</h3>
                    <p className="text-xs text-slate-400">Paste Export JSON directly</p>
                  </div>
              </div>
              <button onClick={() => setShowInputModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <textarea 
                className="w-full flex-1 bg-[#020617] border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-64 shadow-inner custom-scrollbar"
                placeholder='{ "export_timestamp": "...", "data": { ... } }'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              ></textarea>
            </div>
            <div className="p-5 border-t border-slate-800 bg-slate-900/30 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setJsonInput(JSON.stringify(DEFAULT_DATA, null, 2));
                }}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors mr-auto hover:bg-white/5 rounded-lg"
              >
                Load Default
              </button>
              <button 
                onClick={() => setShowInputModal(false)}
                className="px-4 py-2 text-slate-300 hover:text-white text-sm transition-colors hover:bg-white/5 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleJsonUpdate}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95"
              >
                Visualize
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Logs Modal */}
      <AnimatePresence>
      {showLogsModal && selectedNode && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="glass-panel bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-700 w-full max-w-4xl h-[70vh] flex flex-col overflow-hidden"
          >
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400 border border-violet-500/20">
                       <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Logs</h3>
                       <p className="text-xs text-slate-400 font-mono">{selectedNode.label} • {selectedNode.ip}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg hover:bg-white/10" title="Download">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowLogsModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/10 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-auto bg-[#0a0f1e] p-4 custom-scrollbar">
                <div className="font-mono text-xs space-y-1">
                    {deviceLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2 group">
                            <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                            <span className={`font-bold shrink-0 w-16 ${
                                log.level === 'INFO' ? 'text-blue-400' : 
                                log.level === 'WARN' ? 'text-yellow-400' : 
                                log.level === 'ERROR' ? 'text-red-400' : 'text-slate-400'
                            }`}>[{log.level}]</span>
                            <span className="text-slate-300 break-all">{log.message}</span>
                        </div>
                    ))}
                    <div className="animate-pulse text-slate-500 mt-2">_</div>
                </div>
             </div>
             
             <div className="p-2 bg-slate-900/50 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between px-4">
                <span>Showing last {deviceLogs.length} events</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live</span>
             </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(71, 85, 105, 0.4);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(71, 85, 105, 0.7);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;