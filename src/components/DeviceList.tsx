import React, { useState, useMemo } from 'react';
import { DeviceRecord, GraphNode } from '../types';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceListProps {
  devices: DeviceRecord[];
  onSelect: (node: GraphNode) => void;
  searchTerm: string;
}

const DeviceList: React.FC<DeviceListProps> = ({ devices, onSelect, searchTerm }) => {
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showConfidenceFilter, setShowConfidenceFilter] = useState(false);
  const [confidenceRange, setConfidenceRange] = useState<{min: number, max: number}>({min: 0, max: 100});

  // Get unique device types
  const uniqueTypes = useMemo(() => {
    const types = new Set(devices.map(d => d.type));
    return Array.from(types).sort();
  }, [devices]);

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Clear all filters
  const clearTypeFilters = () => {
    setSelectedTypes(new Set());
  };

  const clearConfidenceFilter = () => {
    setConfidenceRange({min: 0, max: 100});
  };

  const setConfidencePreset = (min: number, max: number) => {
    setConfidenceRange({min, max});
  };

  const filtered = devices.filter(d => {
    // Search filter
    const matchesSearch = d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ip?.includes(searchTerm) ||
      d.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = selectedTypes.size === 0 || selectedTypes.has(d.type);
    
    // Confidence filter
    const matchesConfidence = d.confidence >= confidenceRange.min && d.confidence <= confidenceRange.max;
    
    return matchesSearch && matchesType && matchesConfidence;
  });

  const getStateColor = (type: string) => {
      if (type.includes('ACTIVE') || type === 'Switch') return 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      if (type === 'L2ONLY') return 'bg-slate-800 text-slate-500 border-slate-700';
      return 'bg-amber-500/5 text-amber-400 border-amber-500/20';
  };

  return (
    <div className="glass-panel rounded-xl shadow-lg flex flex-col h-full overflow-hidden border border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/20 backdrop-blur-sm flex justify-between items-center">
         <h3 className="text-slate-100 font-semibold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
            Device Inventory
         </h3>
         <span className="text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50 shadow-inner">
            {filtered.length} Devices
         </span>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/80 text-slate-300 sticky top-0 z-10 backdrop-blur-md shadow-sm">
            <tr>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500">Device</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500">IP Address</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500 relative">
                <div className="flex items-center gap-2">
                  Type
                  <div className="relative">
                    <button
                      onClick={() => setShowTypeFilter(!showTypeFilter)}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${selectedTypes.size > 0 ? 'text-blue-400' : 'text-slate-500'}`}
                      title="Filter by type"
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Filter Dropdown */}
                    {showTypeFilter && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 p-2">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700">
                          <span className="text-xs font-bold text-slate-300">Filter by Type</span>
                          <div className="flex items-center gap-2">
                            {selectedTypes.size > 0 && (
                              <button
                                onClick={clearTypeFilters}
                                className="text-[10px] text-blue-400 hover:text-blue-300"
                              >
                                Clear
                              </button>
                            )}
                            <button
                              onClick={() => setShowTypeFilter(false)}
                              className="p-0.5 hover:bg-slate-800 rounded transition-colors"
                              title="Close"
                            >
                              <X className="w-3 h-3 text-slate-400 hover:text-white" />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {uniqueTypes.map(type => (
                            <label
                              key={type}
                              className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTypes.has(type)}
                                onChange={() => toggleTypeFilter(type)}
                                className="w-3.5 h-3.5 rounded border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                              />
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStateColor(type)}`}>
                                {type}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500 relative">
                <div className="flex items-center gap-2">
                  Confidence Score
                  <div className="relative">
                    <button
                      onClick={() => setShowConfidenceFilter(!showConfidenceFilter)}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors ${(confidenceRange.min > 0 || confidenceRange.max < 100) ? 'text-blue-400' : 'text-slate-500'}`}
                      title="Filter by confidence"
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Confidence Filter Dropdown */}
                    {showConfidenceFilter && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 p-3">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
                          <span className="text-xs font-bold text-slate-300">Filter by Confidence</span>
                          <div className="flex items-center gap-2">
                            {(confidenceRange.min > 0 || confidenceRange.max < 100) && (
                              <button
                                onClick={clearConfidenceFilter}
                                className="text-[10px] text-blue-400 hover:text-blue-300"
                              >
                                Clear
                              </button>
                            )}
                            <button
                              onClick={() => setShowConfidenceFilter(false)}
                              className="p-0.5 hover:bg-slate-800 rounded transition-colors"
                              title="Close"
                            >
                              <X className="w-3 h-3 text-slate-400 hover:text-white" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Range Inputs */}
                        <div className="space-y-3 mb-3">
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block">Min: {confidenceRange.min}%</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={confidenceRange.min}
                              onChange={(e) => setConfidenceRange({...confidenceRange, min: parseInt(e.target.value)})}
                              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block">Max: {confidenceRange.max}%</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={confidenceRange.max}
                              onChange={(e) => setConfidenceRange({...confidenceRange, max: parseInt(e.target.value)})}
                              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>
                        </div>
                        
                        {/* Quick Presets */}
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-500 mb-1.5">Quick Presets:</div>
                          <button
                            onClick={() => setConfidencePreset(80, 100)}
                            className="w-full text-left px-2 py-1.5 text-[10px] rounded hover:bg-slate-800 text-slate-300 transition-colors"
                          >
                            High (80-100%)
                          </button>
                          <button
                            onClick={() => setConfidencePreset(50, 79)}
                            className="w-full text-left px-2 py-1.5 text-[10px] rounded hover:bg-slate-800 text-slate-300 transition-colors"
                          >
                            Medium (50-79%)
                          </button>
                          <button
                            onClick={() => setConfidencePreset(0, 49)}
                            className="w-full text-left px-2 py-1.5 text-[10px] rounded hover:bg-slate-800 text-slate-300 transition-colors"
                          >
                            Low (0-49%)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            <AnimatePresence initial={false}>
            {filtered.map((device) => (
              <motion.tr 
                key={device.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hover:bg-blue-500/5 cursor-pointer transition-colors duration-150 group"
                onClick={() => {
                     const node: GraphNode = {
                         id: device.mac || `dev-${device.id}`,
                         label: device.name,
                         type: device.type,
                         ip: device.ip,
                         mac: device.mac,
                         vendor: device.vendor,
                         state: device.type, // Map Type to State roughly
                         confidence: device.confidence,
                         method: device.detection_method,
                         details: device,
                         index: 0, 
                         x: 0, y: 0, vx: 0, vy: 0
                     };
                     onSelect(node);
                }}
              >
                <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-200 truncate max-w-[180px] group-hover:text-blue-400 transition-colors">{device.name}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">{device.vendor}</div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-400 group-hover:text-slate-300">{device.ip}</td>
                <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStateColor(device.type)}`}>
                        {device.type}
                    </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                     <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full" 
                            style={{ 
                                width: `${device.confidence}%`,
                                backgroundColor: device.confidence > 80 ? '#10b981' : device.confidence > 50 ? '#f59e0b' : '#ef4444' 
                            }}
                        ></div>
                     </div>
                     <span className="text-[10px] font-mono">{device.confidence}%</span>
                  </div>
                </td>
              </motion.tr>
            ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceList;