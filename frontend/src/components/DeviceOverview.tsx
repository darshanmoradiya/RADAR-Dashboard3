import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RawNetworkData, DeviceRecord } from '../types';
import { Server, Activity, Clock, MapPin, Mail, Wifi, CheckCircle, AlertCircle, Monitor, Shield, Camera, Smartphone, Router as RouterIcon, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface DeviceOverviewProps {
  data: RawNetworkData;
  deviceType: string;
  onDeviceSelect?: (device: DeviceRecord) => void;
}

const DeviceOverview: React.FC<DeviceOverviewProps> = ({ data, deviceType, onDeviceSelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDevices, setExpandedDevices] = useState<Set<number>>(new Set());
  const devicesPerPage = 5;
  
  if (!data || !data.data || !data.data.devices) return null;

  const toggleDevice = (deviceId: number) => {
    setExpandedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  };

  // Filter devices by type
  const filteredDevices = data.data.devices.records.filter(d => {
    if (deviceType === 'Switch') return d.type === 'Switch' || d.type.includes('Switch');
    if (deviceType === 'Router') return d.type === 'Router' || d.type === 'Gateway' || d.type.includes('Router');
    if (deviceType === 'Firewall') return d.type === 'Firewall' || d.type.includes('Firewall');
    if (deviceType === 'Desktop') return ['Desktop', 'Workstation', 'Laptop'].some(t => d.type.includes(t));
    if (deviceType === 'Smartphone') return ['Android', 'iOS', 'Phone', 'Smartphone'].some(t => d.type.includes(t));
    if (deviceType === 'Camera') return d.type.includes('Camera') || d.type.includes('IP Camera');
    return false;
  });
  
  // Calculate connection count for each device
  const connectionCounts = new Map<number, number>();
  if (data.data.connections && data.data.connections.records) {
    data.data.connections.records.forEach(conn => {
      connectionCounts.set(conn.device_id, (connectionCounts.get(conn.device_id) || 0) + 1);
    });
  }

  // Parse uptime to human readable
  const formatUptime = (uptime: string | null | undefined) => {
    if (!uptime) return 'N/A';
    const parts = uptime.split(':');
    if (parts.length === 4) {
      return `${parts[0]}d ${parts[1]}h ${parts[2]}m`;
    }
    return uptime;
  };

  // Parse services
  const parseServices = (services: string | null | undefined) => {
    if (!services) return [];
    try {
      const parsed = JSON.parse(services);
      return Object.entries(parsed).map(([port, service]) => `${service} (${port})`);
    } catch {
      return [];
    }
  };

  // Get icon and color based on device type
  const getDeviceIcon = () => {
    if (deviceType === 'Switch') return Server;
    if (deviceType === 'Router') return RouterIcon;
    if (deviceType === 'Firewall') return Shield;
    if (deviceType === 'Desktop') return Monitor;
    if (deviceType === 'Smartphone') return Smartphone;
    if (deviceType === 'Camera') return Camera;
    return Server;
  };

  const getDeviceColor = () => {
    if (deviceType === 'Switch') return { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' };
    if (deviceType === 'Router') return { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500' };
    if (deviceType === 'Firewall') return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' };
    if (deviceType === 'Desktop') return { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' };
    if (deviceType === 'Smartphone') return { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500' };
    if (deviceType === 'Camera') return { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' };
    return { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' };
  };

  const Icon = getDeviceIcon();
  const colors = getDeviceColor();
  
  // Proper pluralization
  const getPluralLabel = (type: string) => {
    if (type === 'Switch') return 'Switches';
    if (type.endsWith('s')) return type;
    return `${type}s`;
  };
  const categoryLabel = getPluralLabel(deviceType);

  // Calculate total connections only for filtered devices
  const totalConnections = filteredDevices.reduce((sum, device) => {
    return sum + (connectionCounts.get(device.id) || 0);
  }, 0);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDevices.length / devicesPerPage);
  const startIndex = (currentPage - 1) * devicesPerPage;
  const endIndex = startIndex + devicesPerPage;
  const currentDevices = filteredDevices.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-panel rounded-xl border border-slate-700/50 p-4 bg-gradient-to-r from-${colors.bg.replace('bg-', '')}/10 to-${colors.bg.replace('bg-', '')}/5`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${colors.bg}/20 rounded-xl border ${colors.border}/30`}>
              <Icon className={`w-8 h-8 ${colors.text}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Network {categoryLabel}</h2>
              <p className="text-sm text-slate-400 mt-1">{deviceType === 'Switch' || deviceType === 'Router' ? 'Core infrastructure devices' : `Connected ${categoryLabel.toLowerCase()}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${colors.text}`}>{filteredDevices.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Total {categoryLabel}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">
                {filteredDevices.filter(d => d.state === 'ACTIVE' || d.type === 'Switch').length}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Active</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {totalConnections}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Connections</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Device Details Cards */}
      <div className="space-y-2">
        {/* Show current page devices */}
        <div className="grid grid-cols-1 gap-2">
          {currentDevices.map((device, idx) => {
            const connections = connectionCounts.get(device.id) || 0;
            const services = parseServices(device.services);
            const isDeviceExpanded = expandedDevices.has(device.id);
          
          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-panel rounded-xl border border-slate-700/50 p-2 hover:border-${colors.border.replace('border-', '')}/50 transition-all group`}
            >
              <div className="flex items-start gap-2">
                {/* Icon */}
                <div className={`p-1.5 rounded-lg border ${device.state === 'ACTIVE' || device.type === 'Switch' ? `${colors.bg}/10 ${colors.border}/30` : 'bg-slate-700/30 border-slate-600/30'}`}>
                  <Icon className={`w-4 h-4 ${device.state === 'ACTIVE' || device.type === 'Switch' ? colors.text : 'text-slate-400'}`} />
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => onDeviceSelect && onDeviceSelect(device)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-bold text-white group-hover:${colors.text} transition-colors cursor-pointer`}>
                          {device.name}
                        </h3>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-xs text-slate-400 font-mono">{device.ip}</span>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-xs text-slate-400 font-mono">{device.mac}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                        device.state === 'ACTIVE' || device.type === 'Switch'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {device.state === 'ACTIVE' || device.type === 'Switch' ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                        {device.state === 'ACTIVE' || device.type === 'Switch' ? 'ACTIVE' : 'LIMITED'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDevice(device.id);
                        }}
                        className="p-1 hover:bg-slate-800/50 rounded-lg transition-colors"
                      >
                        {isDeviceExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400 hover:text-blue-400 transition-colors" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hover:text-blue-400 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isDeviceExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 mb-3">
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Wifi className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Connections</span>
                      </div>
                      <div className="text-xl font-bold text-white">{connections}</div>
                      <div className="text-[10px] text-slate-600">Active ports</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Uptime</span>
                      </div>
                      <div className="text-sm font-bold text-white">{formatUptime(device.uptime)}</div>
                      <div className="text-[10px] text-slate-600">Since last reboot</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Open Ports</span>
                      </div>
                      <div className="text-xl font-bold text-white">{device.open_ports_count || device.open_ports?.length || 0}</div>
                      <div className="text-[10px] text-slate-600">{device.detection_method}</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Services</span>
                      </div>
                      <div className="text-xl font-bold text-white">{services.length}</div>
                      <div className="text-[10px] text-slate-600">Running</div>
                    </div>
                  </div>

                  {/* Switch Ports Status - Only for switches */}
                  {device.type === 'Switch' && (device.up_ports || device.down_ports) && (
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 mb-3">
                      <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Port Status</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {device.up_ports && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                              <span className="text-xs text-emerald-400 font-bold">UP ({device.up_ports_count || device.up_ports.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {device.up_ports.slice(0, 3).map((port: string) => (
                                <span key={port} className="px-1.5 py-0.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-mono">
                                  {port}
                                </span>
                              ))}
                              {device.up_ports.length > 3 && (
                                <span className="px-1.5 py-0.5 text-slate-500 text-[9px]">
                                  +{device.up_ports.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {device.down_ports && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                              <span className="text-xs text-slate-400 font-bold">DOWN ({device.down_ports_count || device.down_ports.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {device.down_ports.slice(0, 3).map((port: string) => (
                                <span key={port} className="px-1.5 py-0.5 bg-slate-800 text-slate-500 border border-slate-700 rounded text-[9px] font-mono">
                                  {port}
                                </span>
                              ))}
                              {device.down_ports.length > 3 && (
                                <span className="px-1.5 py-0.5 text-slate-500 text-[9px]">
                                  +{device.down_ports.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Connection Information */}
                  {(device.connected_switch || device.neighbors) && (
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 mb-3">
                      <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Network Connections</h4>
                      {device.connected_switch && device.connected_switch !== 'None' && (
                        <div className="mb-1 text-xs">
                          <span className="text-slate-500">Connected to: </span>
                          <span className="text-slate-300 font-medium">{device.connected_switch}</span>
                          {device.connected_port && device.connected_port !== 'None' && (
                            <span className="text-slate-500 ml-2">Port: {device.connected_port}</span>
                          )}
                        </div>
                      )}
                      {device.neighbors && device.neighbors.length > 0 && (
                        <div className="text-xs">
                          <span className="text-slate-500 block mb-1">Neighbors:</span>
                          {device.neighbors.slice(0, 2).map((neighbor, idx) => (
                            <div key={idx} className="text-slate-300 ml-2 text-[10px]">
                              • {neighbor.ip} via {neighbor.protocol} (Port: {neighbor.port})
                            </div>
                          ))}
                          {device.neighbors.length > 2 && (
                            <span className="text-slate-500 ml-2 text-[10px]">+{device.neighbors.length - 2} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span>{device.vendor}</span>
                    </div>
                    {device.contact && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-xs">{device.contact.split(',')[0]}</span>
                      </div>
                    )}
                    {services.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">Services:</span>
                        <span className={colors.text}>{services.slice(0, 3).join(', ')}{services.length > 3 && ` +${services.length - 3}`}</span>
                      </div>
                    )}
                  </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel rounded-xl border border-slate-700/50 p-4 flex items-center justify-between"
          >
            <div className="text-sm text-slate-400">
              Showing <span className="text-white font-bold">{startIndex + 1}</span> to{' '}
              <span className="text-white font-bold">{Math.min(endIndex, filteredDevices.length)}</span> of{' '}
              <span className="text-white font-bold">{filteredDevices.length}</span> {categoryLabel.toLowerCase()}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-all ${
                  currentPage === 1
                    ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                      currentPage === page
                        ? `${colors.bg}/20 ${colors.text} border ${colors.border}/30`
                        : 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-all ${
                  currentPage === totalPages
                    ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DeviceOverview;
