import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RawNetworkData } from '../types';
import { 
  Server, Monitor, Smartphone, Wifi, Shield, AlertTriangle, 
  Camera, Activity, Database, Terminal, Globe, Lock, AlertOctagon,
  Clock, ChevronLeft, ChevronRight
} from 'lucide-react';

interface StatsPanelProps {
  data: RawNetworkData;
  deviceType?: string;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ data, deviceType }) => {
  const [servicesPage, setServicesPage] = useState(1);
  const servicesPerPage = 10;
  
  if (!data || !data.data || !data.data.devices) return null; // Defensive Check
  const { devices, scan_metadata } = data.data;

  // Filter devices by category if deviceType is provided
  const filteredDevices = deviceType ? devices.records.filter(d => {
    if (deviceType === 'Switch') return d.type === 'Switch' || d.type.includes('Switch');
    if (deviceType === 'Router') return d.type === 'Router' || d.type === 'Gateway' || d.type.includes('Router');
    if (deviceType === 'Firewall') return d.type === 'Firewall' || d.type.includes('Firewall');
    if (deviceType === 'Desktop') return ['Desktop', 'Workstation', 'Laptop'].some(t => d.type.includes(t));
    if (deviceType === 'Smartphone') return ['Android', 'iOS', 'Phone', 'Smartphone'].some(t => d.type.includes(t));
    if (deviceType === 'Camera') return d.type.includes('Camera') || d.type.includes('IP Camera');
    return true;
  }) : devices.records;

  const totalCount = filteredDevices.length;
  
  // Proper pluralization
  const getPluralLabel = (type: string) => {
    if (type === 'Switch') return 'Switches';
    if (type.endsWith('s')) return type;
    return `${type}s`;
  };
  const categoryLabel = deviceType ? getPluralLabel(deviceType) : 'All Devices';

  // --- Use scan_metadata counts if available, otherwise fall back to counting devices ---
  const useScanMetadata = data.scan_metadata && !deviceType;  // Use metadata only for all devices view
  
  const counts = useScanMetadata ? {
    workstations: data.scan_metadata?.workstations_count || 0,
    servers: data.scan_metadata?.servers_count || 0,
    switches: data.scan_metadata?.switches_count || 0,
    networkDevices: (data.scan_metadata?.routers_count || 0) + (data.scan_metadata?.access_points_count || 0),
    smartphones: data.scan_metadata?.smartphones_count || 0,
    cameras: data.scan_metadata?.cameras_count || 0,
  } : {
    workstations: filteredDevices.filter(d => ['Desktop', 'Workstation', 'Laptop', 'Windows', 'Linux'].some(t => d.type.includes(t))).length,
    servers: filteredDevices.filter(d => ['Server', 'Ubuntu', 'CentOS', 'Debian'].some(t => d.type.includes(t))).length,
    switches: filteredDevices.filter(d => d.type === 'Switch').length,
    networkDevices: filteredDevices.filter(d => ['Router', 'Gateway', 'Firewall', 'WAP', 'Access Point'].some(t => d.type.includes(t))).length,
    smartphones: filteredDevices.filter(d => ['Android', 'iOS', 'Phone'].some(t => d.type.includes(t))).length,
    cameras: filteredDevices.filter(d => ['Camera', 'IP Camera'].some(t => d.type.includes(t))).length,
  };
  
  // Use scan metadata total if available
  const actualTotalDevices = useScanMetadata && data.scan_metadata?.total_devices 
    ? data.scan_metadata.total_devices 
    : totalCount;

  // --- Process Services (Ports) ---
  // Aggregate services from all devices
  const servicesMap = new Map<string, { name: string; count: number }>();
  
  filteredDevices.forEach(device => {
    if (device.services) {
      try {
        const services = JSON.parse(device.services);
        Object.entries(services).forEach(([port, serviceName]) => {
          if (servicesMap.has(port)) {
            servicesMap.get(port)!.count++;
          } else {
            servicesMap.set(port, { name: serviceName as string, count: 1 });
          }
        });
      } catch (e) {
        // Skip invalid JSON
      }
    }
  });

  const serviceList = Array.from(servicesMap.entries()).map(([port, data]) => {
    const portNum = parseInt(port);
    let risk: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let icon = <Activity className="w-4 h-4" />;

    if (portNum === 21) { risk = 'HIGH'; icon = <Database className="w-4 h-4" />; }
    else if (portNum === 22) { risk = 'LOW'; icon = <Terminal className="w-4 h-4" />; }
    else if (portNum === 23) { risk = 'HIGH'; icon = <Terminal className="w-4 h-4" />; }
    else if (portNum === 80) { risk = 'LOW'; icon = <Globe className="w-4 h-4" />; }
    else if (portNum === 443) { risk = 'LOW'; icon = <Lock className="w-4 h-4" />; }
    else if (portNum === 445) { risk = 'MEDIUM'; icon = <Server className="w-4 h-4" />; }
    else if (portNum === 3389) { risk = 'MEDIUM'; icon = <Monitor className="w-4 h-4" />; }
    else if (portNum === 135) { risk = 'LOW'; icon = <Activity className="w-4 h-4" />; }
    else if (portNum === 139) { risk = 'LOW'; icon = <Activity className="w-4 h-4" />; }
    else if (portNum === 53) { risk = 'LOW'; icon = <Activity className="w-4 h-4" />; }

    return { port, name: data.name, risk, icon, count: data.count };
  }).sort((a, b) => b.count - a.count); // Sort by prevalence

  const highRiskCount = serviceList.filter(s => s.risk === 'HIGH').length;

  // Pagination for services
  const totalServicesPages = Math.ceil(serviceList.length / servicesPerPage);
  const startServiceIndex = (servicesPage - 1) * servicesPerPage;
  const endServiceIndex = startServiceIndex + servicesPerPage;
  const currentServices = serviceList.slice(startServiceIndex, endServiceIndex);

  const scanDuration = scan_metadata && scan_metadata[0] ? 
    Math.round((new Date(scan_metadata[0].end_time).getTime() - new Date(scan_metadata[0].start_time).getTime()) / 1000) + 's' 
    : 'N/A';
  
  const scanProtocol = scan_metadata && scan_metadata[0]?.snmp_version || 'SNMP v2c';

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 mb-6"
    >
      {/* 1. Network Header Banner */}
      <motion.div variants={item} className="bg-[#0f172a] rounded-xl border border-slate-700/50 p-5 flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="z-10 mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-white tracking-tight mb-1">{deviceType ? `Network ${categoryLabel}` : 'Corporate Network'}</h2>
            <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">{categoryLabel} • {actualTotalDevices} {deviceType ? `of ${devices.count}` : ''} devices</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
                 <div className="bg-white text-slate-900 px-2 py-0.5 rounded text-xs font-bold font-mono border border-slate-200 shadow-sm">
                    172.16.16.0/24
                 </div>
                 <span className="text-xs text-slate-500">{deviceType ? `${categoryLabel} in network` : 'Main office network'} - {actualTotalDevices} devices {deviceType ? 'in category' : 'detected'}</span>
            </div>
        </div>

        <div className="flex gap-3 z-10">
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-lg">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">{actualTotalDevices} {deviceType ? categoryLabel : 'Total Devices'}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-lg">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">{scanProtocol}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">Scan: {scanDuration}</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400">Live</span>
            </div>
        </div>
      </motion.div>

      {/* 2. Category Grid (4x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <StatCard 
            icon={<Monitor className="w-5 h-5" />}
            color="bg-blue-500"
            count={counts.workstations}
            label="Workstations"
            subtext="Windows/Linux hosts"
        />
        <StatCard 
            icon={<Server className="w-5 h-5" />}
            color="bg-emerald-500"
            count={counts.servers}
            label="Servers"
            subtext="Linux servers"
        />
        <StatCard 
            icon={<Activity className="w-5 h-5" />}
            color="bg-purple-500"
            count={counts.switches}
            label="Switches"
            subtext="Network switches"
        />
        <StatCard 
            icon={<Wifi className="w-5 h-5" />}
            color="bg-amber-600"
            count={counts.networkDevices}
            label="Network Devices"
            subtext="Printers, APs, etc."
        />
        
        <StatCard 
            icon={<Smartphone className="w-5 h-5" />}
            color="bg-cyan-500"
            count={counts.smartphones}
            label="Smartphones"
            subtext="Android & iOS"
        />
        <StatCard 
            icon={<Camera className="w-5 h-5" />}
            color="bg-pink-500"
            count={counts.cameras}
            label="IP Cameras"
            subtext="Hikvision & Dahua"
        />
      </div>

      {/* 3. Detected Services Panel */}
      <motion.div variants={item} className="bg-[#0f172a] rounded-xl border border-slate-700/50 p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Detected Services</h3>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded border border-slate-700">
                  {serviceList.length} total
                </span>
                {totalServicesPages > 1 && (
                  <span className="text-[10px] text-slate-500">
                    Page {servicesPage} of {totalServicesPages}
                  </span>
                )}
              </div>
          </div>
          
          {highRiskCount > 0 && (
             <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
                 <AlertOctagon className="w-4 h-4 text-amber-500" />
                 <span className="text-xs font-bold text-amber-400">{highRiskCount} high-risk service(s) detected</span>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {currentServices.map((service, idx) => (
                <div key={`${service.port}-${idx}`} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-lg group hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-md text-slate-400 border border-slate-700 group-hover:text-white transition-colors">
                            {service.icon}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-200">{service.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Port {service.port}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{service.count} devices</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            service.risk === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            service.risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                            {service.risk}
                        </span>
                    </div>
                </div>
            ))}
            {serviceList.length === 0 && (
                <div className="col-span-2 text-center py-8 text-slate-500 text-xs italic">
                    No services detected in scan data.
                </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalServicesPages > 1 && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Showing <span className="text-white font-bold">{startServiceIndex + 1}</span> to{' '}
                <span className="text-white font-bold">{Math.min(endServiceIndex, serviceList.length)}</span> of{' '}
                <span className="text-white font-bold">{serviceList.length}</span> services
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setServicesPage(Math.max(1, servicesPage - 1))}
                  disabled={servicesPage === 1}
                  className={`p-2 rounded-lg transition-all ${
                    servicesPage === 1
                      ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalServicesPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalServicesPages <= 5) {
                      pageNum = i + 1;
                    } else if (servicesPage <= 3) {
                      pageNum = i + 1;
                    } else if (servicesPage >= totalServicesPages - 2) {
                      pageNum = totalServicesPages - 4 + i;
                    } else {
                      pageNum = servicesPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setServicesPage(pageNum)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          servicesPage === pageNum
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setServicesPage(Math.min(totalServicesPages, servicesPage + 1))}
                  disabled={servicesPage === totalServicesPages}
                  className={`p-2 rounded-lg transition-all ${
                    servicesPage === totalServicesPages
                      ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
      </motion.div>
    </motion.div>
  );
};

const StatCard = ({ icon, color, count, label, subtext, textColor }: any) => {
    // Helper to extract the color class for text/border if generic
    const bgClass = color.replace('bg-', 'bg-') + '/10';
    
    return (
        <motion.div 
            variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
            className="bg-[#0f172a] rounded-xl border border-slate-700/50 p-4 hover:border-slate-500/50 transition-colors group flex items-start gap-4 shadow-md"
        >
            <div className={`p-2.5 rounded-lg shrink-0 ${bgClass} ${textColor ? textColor : 'text-white'}`}>
                {React.cloneElement(icon, { className: `w-6 h-6 ${textColor ? '' : 'text-white'}` })}
            </div>
            <div>
                <div className="text-2xl font-bold text-white mb-0.5">{count}</div>
                <div className="text-xs font-semibold text-slate-300">{label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{subtext}</div>
            </div>
        </motion.div>
    );
};

export default StatsPanel;