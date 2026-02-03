import React from 'react';
import { motion } from 'framer-motion';
import { RawNetworkData, DeviceRecord } from '../types';
import { Server, Activity, Clock, MapPin, Mail, Wifi, CheckCircle, AlertCircle } from 'lucide-react';

interface SwitchOverviewProps {
  data: RawNetworkData;
  onSwitchSelect?: (switchDevice: DeviceRecord) => void;
}

const SwitchOverview: React.FC<SwitchOverviewProps> = ({ data, onSwitchSelect }) => {
  if (!data || !data.data || !data.data.devices) return null;

  const switches = data.data.devices.records.filter(d => d.type === 'Switch');
  
  // Calculate connection count for each switch
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

  return (
    <div className="space-y-4 mb-6">
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl border border-slate-700/50 p-6 bg-gradient-to-r from-blue-600/10 to-blue-500/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <Server className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Network Switches</h2>
              <p className="text-sm text-slate-400 mt-1">Core infrastructure devices</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{switches.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Total Switches</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">
                {switches.filter(s => s.confidence >= 60).length}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Active</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {Array.from(connectionCounts.values()).reduce((sum, count) => sum + count, 0)}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Connections</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Switch Details Cards */}
      <div className="grid grid-cols-1 gap-4">
        {switches.map((sw, idx) => {
          const connections = connectionCounts.get(sw.id) || 0;
          const services = parseServices(sw.services);
          const isHealthy = sw.confidence >= 60;
          
          return (
            <motion.div
              key={sw.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onSwitchSelect && onSwitchSelect(sw)}
              className="glass-panel rounded-xl border border-slate-700/50 p-5 hover:border-blue-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-xl border ${isHealthy ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-700/30 border-slate-600/30'}`}>
                  <Server className={`w-6 h-6 ${isHealthy ? 'text-blue-400' : 'text-slate-400'}`} />
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {sw.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 font-mono">{sw.ip}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-400 font-mono">{sw.mac}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
                      isHealthy 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {isHealthy ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {isHealthy ? 'ACTIVE' : 'LIMITED'}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
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
                      <div className="text-sm font-bold text-white">{formatUptime(sw.uptime)}</div>
                      <div className="text-[10px] text-slate-600">Since last reboot</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Confidence</span>
                      </div>
                      <div className="text-xl font-bold text-white">{sw.confidence}%</div>
                      <div className="text-[10px] text-slate-600">{sw.detection_method}</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Services</span>
                      </div>
                      <div className="text-xl font-bold text-white">{services.length}</div>
                      <div className="text-[10px] text-slate-600">Running</div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span>{sw.vendor}</span>
                    </div>
                    {sw.contact && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-xs">{sw.contact.split(',')[0]}</span>
                      </div>
                    )}
                    {services.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">Services:</span>
                        <span className="text-blue-400">{services.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SwitchOverview;
