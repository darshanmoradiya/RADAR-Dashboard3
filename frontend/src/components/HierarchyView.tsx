// import React, { useMemo, useState } from 'react';
// import { motion } from 'framer-motion';
// import { RawNetworkData, DeviceRecord, ConnectionRecord } from '../types';
// import { 
//   Server, Monitor, Smartphone, Wifi, Shield, Camera, 
//   Router, HardDrive, Activity, Network, Minus, CornerDownRight, ChevronDown, ChevronRight
// } from 'lucide-react';

// interface HierarchyViewProps {
//   data: RawNetworkData;
//   onDeviceSelect?: (device: DeviceRecord) => void;
// }

// const getDeviceIcon = (type: string) => {
//   if (type === 'Switch' || type.includes('Switch')) return Server;
//   if (type.includes('Router') || type.includes('Gateway')) return Router;
//   if (type.includes('Camera')) return Camera;
//   if (type.includes('Firewall')) return Shield;
//   if (type.includes('Access Point') || type.includes('WAP')) return Wifi;
//   if (type.includes('Phone') || type.includes('Android') || type.includes('iOS')) return Smartphone;
//   return Monitor;
// };

// const getDeviceColor = (type: string) => {
//   if (type.includes('Camera')) return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
//   if (type.includes('Switch')) return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
//   if (type.includes('Access Point') || type.includes('WAP')) return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
//   if (type.includes('Phone') || type.includes('Android') || type.includes('iOS')) return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' };
//   if (type.includes('Firewall')) return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
//   if (type.includes('Router')) return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' };
//   return { bg: 'bg-slate-700/30', text: 'text-slate-400', border: 'border-slate-600/30' };
// };

// const HierarchyView: React.FC<HierarchyViewProps> = ({ data, onDeviceSelect }) => {
//   // State for collapsed categories (key: "switch-{switchId}-{category}" or "standalone-{category}")
//   const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
//   if (!data || !data.data || !data.data.devices) return null;

//   const { devices, connections } = data.data;
  
//   // Toggle category collapse state
//   const toggleCategory = (categoryKey: string) => {
//     setCollapsedCategories(prev => {
//       const next = new Set(prev);
//       if (next.has(categoryKey)) {
//         next.delete(categoryKey);
//       } else {
//         next.add(categoryKey);
//       }
//       return next;
//     });
//   };

//   // Build hierarchy structure
//   const hierarchy = useMemo(() => {
//     // Find switches first (root devices)
//     const switches = devices.records.filter(d => d.type === 'Switch');
    
//     console.log('HierarchyView Debug:', {
//       totalDevices: devices.records.length,
//       switches: switches.length,
//       hasConnections: !!connections,
//       connectionRecords: connections?.records?.length || 0
//     });
    
//     // Build connection map
//     const connectionMap: { [deviceId: number]: ConnectionRecord[] } = {};
//     if (connections && connections.records) {
//       connections.records.forEach(conn => {
//         if (!connectionMap[conn.device_id]) {
//           connectionMap[conn.device_id] = [];
//         }
//         connectionMap[conn.device_id].push(conn);
//       });
//     }
    
//     console.log('Connection Map:', connectionMap);

//     // Group devices by vendor for switches
//     const switchHierarchy = switches.map(sw => {
//       const swConnections = connectionMap[sw.id] || [];
      
//       console.log(`======= Switch ${sw.name} =======`);
//       console.log('Switch Details:', {
//         id: sw.id,
//         name: sw.name,
//         mac: sw.mac,
//         ip: sw.ip
//       });
//       console.log('Total connections for this switch:', swConnections.length);
      
//       if (swConnections.length > 0) {
//         console.log('First 3 connection MACs:', swConnections.slice(0, 3).map(c => c.mac_address));
//         console.log('Sample device MACs:', devices.records.slice(0, 5).map(d => ({ name: d.name, mac: d.mac })));
//       }
      
//       // Group connected devices by type - improved MAC matching
//       const connectedDevices: { [mac: string]: DeviceRecord } = {};
//       let matchedCount = 0;
//       let unmatchedCount = 0;
      
//       swConnections.forEach(conn => {
//         // Normalize MAC addresses for comparison (remove all separators and compare)
//         const connMacNormalized = conn.mac_address.replace(/[-:]/g, '').toLowerCase();
        
//         const device = devices.records.find(d => {
//           if (!d.mac) return false;
//           const deviceMacNormalized = d.mac.replace(/[-:]/g, '').toLowerCase();
//           return deviceMacNormalized === connMacNormalized;
//         });
        
//         if (device && device.id !== sw.id) {
//           connectedDevices[device.mac] = device;
//           matchedCount++;
//         } else {
//           unmatchedCount++;
//           if (unmatchedCount <= 3) {
//             console.log(`No device found for connection MAC: ${conn.mac_address} (normalized: ${connMacNormalized})`);
//           }
//         }
//       });
      
//       console.log(`Matched devices: ${matchedCount}, Unmatched: ${unmatchedCount}`);
//       console.log(`Total unique connected devices: ${Object.keys(connectedDevices).length}`);
//       console.log('=================================\n');

//       // Categorize connected devices
//       const connected = Object.values(connectedDevices);
//       const categorized: { [category: string]: DeviceRecord[] } = {};
      
//       connected.forEach(device => {
//         const category = device.type || 'Unknown';
//         if (!categorized[category]) {
//           categorized[category] = [];
//         }
//         categorized[category].push(device);
//       });

//       return {
//         switch: sw,
//         connections: swConnections.length,
//         connectedDevices: connected,
//         categorized: categorized
//       };
//     });

//     // Standalone devices (not connected to switches) - also categorize
//     const connectedMacs = new Set<string>();
//     switches.forEach(sw => {
//       const swConns = connectionMap[sw.id] || [];
//       swConns.forEach(c => {
//         const normalized = c.mac_address.replace(/[-:]/g, '').toLowerCase();
//         connectedMacs.add(normalized);
//       });
//     });
    
//     const standaloneDevices = devices.records.filter(d => {
//       if (d.type === 'Switch') return false;
//       if (!d.mac) return true;
//       const deviceMacNormalized = d.mac.replace(/[-:]/g, '').toLowerCase();
//       return !connectedMacs.has(deviceMacNormalized);
//     });
    
//     const standaloneCategorized: { [category: string]: DeviceRecord[] } = {};
//     standaloneDevices.forEach(device => {
//       const category = device.type || 'Unknown';
//       if (!standaloneCategorized[category]) {
//         standaloneCategorized[category] = [];
//       }
//       standaloneCategorized[category].push(device);
//     });

//     return { 
//       switches: switchHierarchy, 
//       standalone: standaloneDevices,
//       standaloneCategorized: standaloneCategorized
//     };
//   }, [devices, connections]);

//   return (
//     <div className="h-full overflow-y-auto custom-scrollbar pb-4">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="space-y-6"
//       >
//         {/* Header */}
//         <div className="glass-panel rounded-xl border border-slate-700/50 p-6">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
//               <Network className="w-5 h-5" />
//             </div>
//             <div>
//               <h2 className="text-xl font-bold text-white">Network Hierarchy Tree</h2>
//               <p className="text-sm text-slate-400">Visual topology structure with connections</p>
//             </div>
//           </div>
//         </div>

//         {/* Tree View */}
//         <div className="glass-panel rounded-xl border border-slate-700/50 p-6">
//           <div className="space-y-0">
//             {/* Network Root */}
//             <div className="flex items-center gap-3 p-3 bg-blue-600/10 rounded-lg border border-blue-500/30 mb-4">
//               <Network className="w-5 h-5 text-blue-400" />
//               <div>
//                 <div className="text-base font-bold text-white">Corporate Network</div>
//                 <div className="text-xs text-slate-400 font-mono">172.16.16.0/24</div>
//               </div>
//             </div>

//             {/* Network Switches Tree */}
//             {hierarchy.switches.map((item, swIdx) => {
//               const isLastSwitch = swIdx === hierarchy.switches.length - 1 && hierarchy.standalone.length === 0;
//               const colors = getDeviceColor(item.switch.type);
//               const Icon = getDeviceIcon(item.switch.type);
              
//               return (
//                 <div key={item.switch.id} className="relative">
//                   {/* Vertical Line from root */}
//                   <div className="absolute left-4 top-0 w-0.5 h-6 bg-slate-700/50"></div>
                  
//                   {/* Horizontal connector */}
//                   <div className="absolute left-4 top-6 w-6 h-0.5 bg-slate-700/50"></div>
                  
//                   {/* Vertical line down to children (if any) */}
//                   {!isLastSwitch && (
//                     <div className="absolute left-4 top-6 w-0.5 h-full bg-slate-700/50"></div>
//                   )}

//                   {/* Switch Node */}
//                   <div className="ml-10 mb-0">
//                     <motion.div
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: swIdx * 0.1 }}
//                       onClick={() => onDeviceSelect && onDeviceSelect(item.switch)}
//                       className={`flex items-center gap-3 p-3 ${colors.bg} rounded-lg border ${colors.border} cursor-pointer hover:scale-[1.01] transition-all group mb-2`}
//                     >
//                       <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
//                         <Icon className="w-5 h-5" />
//                       </div>
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2">
//                           <span className="text-sm font-bold text-white">{item.switch.name}</span>
//                           <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} text-xs rounded-full font-bold uppercase tracking-wide`}>
//                             {item.switch.type}
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
//                           <span className="font-mono">{item.switch.ip}</span>
//                           <span>•</span>
//                           <span>{item.switch.vendor}</span>
//                           <span>•</span>
//                           <span className="flex items-center gap-1 text-blue-400">
//                             <Activity className="w-3 h-3" />
//                             {item.connectedDevices.length} devices
//                           </span>
//                         </div>
//                       </div>
//                     </motion.div>

//                     {/* Connected Devices Tree - Categorized */}
//                     {item.connectedDevices.length > 0 && (
//                       <div className="relative ml-6 space-y-4">
//                         {Object.entries(item.categorized).map(([category, categoryDevices], catIdx) => {
//                           const isLastCategory = catIdx === Object.entries(item.categorized).length - 1;
//                           const categoryColors = getDeviceColor(category);
//                           const categoryKey = `switch-${item.switch.id}-${category}`;
//                           const isCollapsed = collapsedCategories.has(categoryKey);
                          
//                           return (
//                             <div key={category} className="relative">
//                               {/* Category Header */}
//                               {catIdx === 0 && (
//                                 <div className="absolute left-4 -top-2 w-0.5 h-4 bg-slate-700/50"></div>
//                               )}
                              
//                               {!isLastCategory && (
//                                 <div className="absolute left-4 top-0 w-0.5 h-full bg-slate-700/50"></div>
//                               )}
                              
//                               <div className="absolute left-4 top-4 w-6 h-0.5 bg-slate-700/50"></div>
                              
//                               {isLastCategory && (
//                                 <div className="absolute left-4 top-0 w-0.5 h-4 bg-slate-700/50"></div>
//                               )}

//                               <div className="ml-10">
//                                 <div 
//                                   onClick={() => toggleCategory(categoryKey)}
//                                   className={`flex items-center gap-2 p-2 ${categoryColors.bg} rounded-lg border ${categoryColors.border} mb-2 cursor-pointer hover:opacity-80 transition-opacity`}
//                                 >
//                                   {isCollapsed ? <ChevronRight className={`w-3.5 h-3.5 ${categoryColors.text}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${categoryColors.text}`} />}
//                                   <div className={`text-xs font-bold ${categoryColors.text} uppercase tracking-wide`}>
//                                     {category} ({categoryDevices.length})
//                                   </div>
//                                 </div>

//                                 {/* Devices in this category */}
//                                 {!isCollapsed && (
//                                   <div className="relative ml-4 space-y-2">
//                                   {categoryDevices.map((device, devIdx) => {
//                                     const isLastDevice = devIdx === categoryDevices.length - 1;
//                                     const devColors = getDeviceColor(device.type);
//                                     const DevIcon = getDeviceIcon(device.type);
                                    
//                                     return (
//                                       <div key={device.id} className="relative">
//                                         {devIdx === 0 && (
//                                           <div className="absolute left-3 -top-2 w-0.5 h-3 bg-slate-700/50"></div>
//                                         )}
                                        
//                                         {!isLastDevice && (
//                                           <div className="absolute left-3 top-0 w-0.5 h-full bg-slate-700/50"></div>
//                                         )}
                                        
//                                         <div className="absolute left-3 top-3 w-4 h-0.5 bg-slate-700/50"></div>
                                        
//                                         {isLastDevice && (
//                                           <div className="absolute left-3 top-0 w-0.5 h-3 bg-slate-700/50"></div>
//                                         )}

//                                         <motion.div
//                                           initial={{ opacity: 0, x: 20 }}
//                                           animate={{ opacity: 1, x: 0 }}
//                                           transition={{ delay: (swIdx * 0.1) + (catIdx * 0.05) + (devIdx * 0.02) }}
//                                           onClick={() => onDeviceSelect && onDeviceSelect(device)}
//                                           className="ml-7"
//                                         >
//                                           <div className={`flex items-center gap-2 p-2 bg-slate-900/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-slate-600 cursor-pointer transition-all group`}>
//                                             <div className={`p-1 rounded ${devColors.bg} ${devColors.text}`}>
//                                               <DevIcon className="w-3.5 h-3.5" />
//                                             </div>
//                                             <div className="flex-1 min-w-0">
//                                               <div className="flex items-center gap-2">
//                                                 <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
//                                                   {device.name}
//                                                 </span>
//                                                 <span className="text-[10px] text-slate-500 font-mono">{device.ip}</span>
//                                               </div>
//                                               <div className="text-[10px] text-slate-600 truncate">
//                                                 {device.vendor}
//                                               </div>
//                                             </div>
//                                             <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
//                                               device.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
//                                               device.confidence >= 60 ? 'bg-amber-500/20 text-amber-400' :
//                                               'bg-slate-700/50 text-slate-400'
//                                             }`}>
//                                               {device.confidence}%
//                                             </span>
//                                           </div>
//                                         </motion.div>
//                                       </div>
//                                     );
//                                   })}
//                                   </div>
//                                 )}
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}

//             {/* Standalone Devices */}
//             {hierarchy.standalone.length > 0 && (
//               <div className="relative mt-4">
//                 {/* Vertical Line from root */}
//                 <div className="absolute left-4 top-0 w-0.5 h-6 bg-slate-700/50"></div>
                
//                 {/* Horizontal connector */}
//                 <div className="absolute left-4 top-6 w-6 h-0.5 bg-slate-700/50"></div>

//                 {/* Standalone Section */}
//                 <div className="ml-10">
//                   <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 mb-2">
//                     <HardDrive className="w-5 h-5 text-slate-400" />
//                     <div>
//                       <div className="text-sm font-bold text-white">Standalone Devices</div>
//                       <div className="text-xs text-slate-500">{hierarchy.standalone.length} devices not connected to switches</div>
//                     </div>
//                   </div>

//                   {/* Standalone devices list - Categorized */}
//                   <div className="relative ml-6 space-y-4">
//                     {Object.entries(hierarchy.standaloneCategorized).map(([category, categoryDevices], catIdx) => {
//                       const isLastCategory = catIdx === Object.entries(hierarchy.standaloneCategorized).length - 1;
//                       const categoryColors = getDeviceColor(category);
//                       const categoryKey = `standalone-${category}`;
//                       const isCollapsed = collapsedCategories.has(categoryKey);
                      
//                       return (
//                         <div key={category} className="relative">
//                           {catIdx === 0 && (
//                             <div className="absolute left-4 -top-2 w-0.5 h-4 bg-slate-700/50"></div>
//                           )}
                          
//                           {!isLastCategory && (
//                             <div className="absolute left-4 top-0 w-0.5 h-full bg-slate-700/50"></div>
//                           )}
                          
//                           <div className="absolute left-4 top-4 w-6 h-0.5 bg-slate-700/50"></div>
                          
//                           {isLastCategory && (
//                             <div className="absolute left-4 top-0 w-0.5 h-4 bg-slate-700/50"></div>
//                           )}

//                           <div className="ml-10">
//                             <div 
//                               onClick={() => toggleCategory(categoryKey)}
//                               className={`flex items-center gap-2 p-2 ${categoryColors.bg} rounded-lg border ${categoryColors.border} mb-2 cursor-pointer hover:opacity-80 transition-opacity`}
//                             >
//                               {isCollapsed ? <ChevronRight className={`w-3.5 h-3.5 ${categoryColors.text}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${categoryColors.text}`} />}
//                               <div className={`text-xs font-bold ${categoryColors.text} uppercase tracking-wide`}>
//                                 {category} ({categoryDevices.length})
//                               </div>
//                             </div>

//                             {/* Devices in this category */}
//                             {!isCollapsed && (
//                               <div className="relative ml-4 space-y-2">
//                               {categoryDevices.map((device, devIdx) => {
//                                 const isLastDevice = devIdx === categoryDevices.length - 1;
//                                 const devColors = getDeviceColor(device.type);
//                                 const DevIcon = getDeviceIcon(device.type);
                                
//                                 return (
//                                   <div key={device.id} className="relative">
//                                     {devIdx === 0 && (
//                                       <div className="absolute left-3 -top-2 w-0.5 h-3 bg-slate-700/50"></div>
//                                     )}
                                    
//                                     {!isLastDevice && (
//                                       <div className="absolute left-3 top-0 w-0.5 h-full bg-slate-700/50"></div>
//                                     )}
                                    
//                                     <div className="absolute left-3 top-3 w-4 h-0.5 bg-slate-700/50"></div>
                                    
//                                     {isLastDevice && (
//                                       <div className="absolute left-3 top-0 w-0.5 h-3 bg-slate-700/50"></div>
//                                     )}

//                                     <motion.div
//                                       initial={{ opacity: 0, x: 20 }}
//                                       animate={{ opacity: 1, x: 0 }}
//                                       transition={{ delay: (catIdx * 0.05) + (devIdx * 0.02) }}
//                                       onClick={() => onDeviceSelect && onDeviceSelect(device)}
//                                       className="ml-7"
//                                     >
//                                       <div className={`flex items-center gap-2 p-2 bg-slate-900/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-slate-600 cursor-pointer transition-all group`}>
//                                         <div className={`p-1 rounded ${devColors.bg} ${devColors.text}`}>
//                                           <DevIcon className="w-3.5 h-3.5" />
//                                         </div>
//                                         <div className="flex-1 min-w-0">
//                                           <div className="flex items-center gap-2">
//                                             <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
//                                               {device.name}
//                                             </span>
//                                             <span className="text-[10px] text-slate-500 font-mono">{device.ip}</span>
//                                           </div>
//                                           <div className="text-[10px] text-slate-600 truncate">
//                                             {device.vendor}
//                                           </div>
//                                         </div>
//                                         <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
//                                           device.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
//                                           device.confidence >= 60 ? 'bg-amber-500/20 text-amber-400' :
//                                           'bg-slate-700/50 text-slate-400'
//                                         }`}>
//                                           {device.confidence}%
//                                         </span>
//                                       </div>
//                                     </motion.div>
//                                   </div>
//                                 );
//                               })}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default HierarchyView;
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RawNetworkData, DeviceRecord, ConnectionRecord } from '../types';
import { 
  Server, Monitor, Smartphone, Wifi, Shield, Camera, 
  Router, HardDrive, Activity, Network, ChevronDown, ChevronRight,
  Search, X, Filter, Maximize2, Minimize2, Layers, Zap
} from 'lucide-react';

interface HierarchyViewProps {
  data: RawNetworkData;
  onDeviceSelect?: (device: DeviceRecord) => void;
  showStandalone?: boolean;
  rootDeviceType?: string;
}

const getDeviceIcon = (type: string) => {
  if (type === 'Switch' || type.includes('Switch')) return Server;
  if (type.includes('Router') || type.includes('Gateway')) return Router;
  if (type.includes('Camera')) return Camera;
  if (type.includes('Firewall')) return Shield;
  if (type.includes('Access Point') || type.includes('WAP')) return Wifi;
  if (type.includes('Phone') || type.includes('Android') || type.includes('iOS')) return Smartphone;
  return Monitor;
};

const getDeviceColor = (type: string) => {
  if (type.includes('Camera')) return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
  if (type.includes('Switch')) return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
  if (type.includes('Access Point') || type.includes('WAP')) return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
  if (type.includes('Phone') || type.includes('Android') || type.includes('iOS')) return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' };
  if (type.includes('Firewall')) return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
  if (type.includes('Router')) return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' };
  return { bg: 'bg-slate-700/30', text: 'text-slate-400', border: 'border-slate-600/30' };
};

const HierarchyView: React.FC<HierarchyViewProps> = ({ data, onDeviceSelect, showStandalone = true, rootDeviceType = 'Switch' }) => {
  // State for collapsed categories (key: "switch-{switchId}-{category}" or "standalone-{category}")
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [expandedAll, setExpandedAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  if (!data || !data.data || !data.data.devices) return null;

  const { devices, connections } = data.data;
  
  // Toggle category collapse state
  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  // Expand/Collapse all categories
  const toggleExpandAll = () => {
    if (expandedAll) {
      // Collapse all - add all category keys
      const allKeys = new Set<string>();
      hierarchy.rootDevices.forEach(item => {
        Object.keys(item.categorized).forEach(category => {
          allKeys.add(`${rootDeviceType}-${item.device.id}-${category}`);
        });
      });
      Object.keys(hierarchy.standaloneCategorized).forEach(category => {
        allKeys.add(`standalone-${category}`);
      });
      setCollapsedCategories(allKeys);
    } else {
      // Expand all - clear set
      setCollapsedCategories(new Set());
    }
    setExpandedAll(!expandedAll);
  };

  // Build hierarchy structure
  const hierarchy = useMemo(() => {
    // Find root devices (switches, routers, etc) based on rootDeviceType
    const rootDevices = devices.records.filter(d => 
      d.type === rootDeviceType || 
      d.type.includes(rootDeviceType) ||
      (rootDeviceType === 'Router' && (d.type === 'Gateway' || d.type.includes('Router'))) ||
      (rootDeviceType === 'Firewall' && d.type.includes('Firewall'))
    );
    
    // Build connection map
    const connectionMap: { [deviceId: number]: ConnectionRecord[] } = {};
    if (connections && connections.records) {
      connections.records.forEach(conn => {
        if (!connectionMap[conn.device_id]) {
          connectionMap[conn.device_id] = [];
        }
        connectionMap[conn.device_id].push(conn);
      });
    }

    // Group devices for root devices (switches, routers, etc.)
    const rootDeviceHierarchy = rootDevices.map(rootDev => {
      const rootConnections = connectionMap[rootDev.id] || [];
      
      console.log(`======= ${rootDeviceType} ${rootDev.name} =======`);
      console.log('Device ID:', rootDev.id, 'Connections:', rootConnections.length);
      
      // Group connected devices by type - improved MAC matching
      const connectedDevices: { [mac: string]: DeviceRecord } = {};
      let matchedCount = 0;
      let unmatchedCount = 0;
      
      rootConnections.forEach(conn => {
        // Normalize MAC addresses for comparison (remove all separators and compare)
        const connMacNormalized = conn.mac_address.replace(/[-:]/g, '').toLowerCase();
        
        const device = devices.records.find(d => {
          if (!d.mac) return false;
          const deviceMacNormalized = d.mac.replace(/[-:]/g, '').toLowerCase();
          return deviceMacNormalized === connMacNormalized;
        });
        
        if (device && device.id !== rootDev.id) {
          connectedDevices[device.mac] = device;
          matchedCount++;
        } else {
          unmatchedCount++;
          if (unmatchedCount <= 3) {
            console.log(`No device found for connection MAC: ${conn.mac_address} (normalized: ${connMacNormalized})`);
          }
        }
      });
      
      console.log(`Matched devices: ${matchedCount}, Unmatched: ${unmatchedCount}`);
      console.log(`Total unique connected devices: ${Object.keys(connectedDevices).length}`);
      console.log('=================================\n');

      // Categorize connected devices
      const connected = Object.values(connectedDevices);
      const categorized: { [category: string]: DeviceRecord[] } = {};
      
      connected.forEach(device => {
        const category = device.type || 'Unknown';
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(device);
      });

      return {
        device: rootDev,
        connections: rootConnections.length,
        connectedDevices: connected,
        categorized: categorized
      };
    });

    // Standalone devices (not connected to root devices) - also categorize
    const connectedMacs = new Set<string>();
    rootDevices.forEach(rootDev => {
      const rootConns = connectionMap[rootDev.id] || [];
      rootConns.forEach(c => {
        const normalized = c.mac_address.replace(/[-:]/g, '').toLowerCase();
        connectedMacs.add(normalized);
      });
    });
    
    const standaloneDevices = devices.records.filter(d => {
      // Exclude root device type from standalone
      if (d.type === rootDeviceType || d.type.includes(rootDeviceType)) return false;
      if (!d.mac) return true;
      const deviceMacNormalized = d.mac.replace(/[-:]/g, '').toLowerCase();
      return !connectedMacs.has(deviceMacNormalized);
    });
    
    const standaloneCategorized: { [category: string]: DeviceRecord[] } = {};
    standaloneDevices.forEach(device => {
      const category = device.type || 'Unknown';
      if (!standaloneCategorized[category]) {
        standaloneCategorized[category] = [];
      }
      standaloneCategorized[category].push(device);
    });

    return { 
      rootDevices: rootDeviceHierarchy, 
      standalone: standaloneDevices,
      standaloneCategorized: standaloneCategorized
    };
  }, [devices, connections, rootDeviceType]);

  // Filter devices based on search and type
  const filteredHierarchy = useMemo(() => {
    if (!searchTerm && selectedTypeFilter === 'all') return hierarchy;

    const filterDevice = (device: DeviceRecord) => {
      const matchesSearch = !searchTerm || 
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.vendor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedTypeFilter === 'all' || device.type === selectedTypeFilter;
      
      return matchesSearch && matchesType;
    };

    const filteredRootDevices = hierarchy.rootDevices.map(item => {
      const filteredCategorized: { [category: string]: DeviceRecord[] } = {};
      const filteredConnected: DeviceRecord[] = [];
      
      Object.entries(item.categorized).forEach(([category, devices]) => {
        const filtered = devices.filter(filterDevice);
        if (filtered.length > 0) {
          filteredCategorized[category] = filtered;
          filteredConnected.push(...filtered);
        }
      });
      
      return {
        ...item,
        categorized: filteredCategorized,
        connectedDevices: filteredConnected
      };
    });

    const filteredStandaloneCategorized: { [category: string]: DeviceRecord[] } = {};
    Object.entries(hierarchy.standaloneCategorized).forEach(([category, devices]) => {
      const filtered = devices.filter(filterDevice);
      if (filtered.length > 0) {
        filteredStandaloneCategorized[category] = filtered;
      }
    });

    const filteredStandalone = hierarchy.standalone.filter(filterDevice);

    return {
      rootDevices: filteredRootDevices,
      standalone: filteredStandalone,
      standaloneCategorized: filteredStandaloneCategorized
    };
  }, [hierarchy, searchTerm, selectedTypeFilter]);

  // Get all unique device types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    devices.records.forEach(d => types.add(d.type));
    return Array.from(types).sort();
  }, [devices]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDevices = devices.records.length;
    const totalRootDevices = filteredHierarchy.rootDevices.length;
    const totalConnected = filteredHierarchy.rootDevices.reduce(
      (sum, item) => sum + item.connectedDevices.length, 0
    );
    const totalStandalone = filteredHierarchy.standalone.length;
    
    return {
      totalDevices,
      totalRootDevices,
      totalConnected,
      totalStandalone,
      avgConfidence: Math.round(
        devices.records.reduce((sum, d) => sum + d.confidence, 0) / totalDevices
      )
    };
  }, [devices, filteredHierarchy]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header with Search and Stats */}
        <div className="glass-panel rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Network Hierarchy Tree</h2>
                <p className="text-sm text-slate-400">Visual topology structure with connections</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleExpandAll}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all"
                title={expandedAll ? 'Collapse All' : 'Expand All'}
              >
                {expandedAll ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                {expandedAll ? 'Collapse' : 'Expand'} All
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  showFilters 
                    ? 'text-blue-400 bg-blue-600/20 border border-blue-500/30' 
                    : 'text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search devices by name, IP, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                    <button
                      onClick={() => setSelectedTypeFilter('all')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        selectedTypeFilter === 'all'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      All Types
                    </button>
                    {uniqueTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedTypeFilter(type)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          selectedTypeFilter === type
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-5 gap-3 mt-4">
            <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-slate-400">Total Devices</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalDevices}</div>
            </div>
            <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-slate-400">{rootDeviceType}s</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalRootDevices}</div>
            </div>
            <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-slate-400">Connected</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalConnected}</div>
            </div>
            <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-slate-400">Standalone</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalStandalone}</div>
            </div>
            <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-slate-400">Avg Confidence</span>
              </div>
              <div className="text-2xl font-bold text-white">{stats.avgConfidence}%</div>
            </div>
          </div>
        </div>

        {/* Tree View */}
        <div className="glass-panel rounded-xl border border-slate-700/50 p-6">
          <div className="space-y-0">
            {/* Network Root */}
            <div className="flex items-center gap-3 p-3 bg-blue-600/10 rounded-lg border border-blue-500/30 mb-4">
              <Network className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-base font-bold text-white">Corporate Network</div>
                <div className="text-xs text-slate-400 font-mono">172.16.16.0/24</div>
              </div>
            </div>

            {/* Network Root Devices Tree */}
            {filteredHierarchy.rootDevices.map((item, idx) => {
              const isLastRoot = idx === filteredHierarchy.rootDevices.length - 1 && filteredHierarchy.standalone.length === 0;
              const colors = getDeviceColor(item.device.type);
              const Icon = getDeviceIcon(item.device.type);
              
                return (
                <div key={item.device.id} className="relative">
                  {/* Vertical Line from root */}
                  <div className="absolute left-4 top-0 w-0.5 h-6 bg-slate-700/50"></div>
                  
                  {/* Horizontal connector */}
                  <div className="absolute left-4 top-6 w-6 h-0.5 bg-slate-700/50"></div>
                  
                  {/* Vertical line down to children (if any) */}
                  {!isLastRoot && (
                    <div className="absolute left-4 top-6 w-0.5 h-full bg-slate-700/50"></div>
                  )}

                  {/* Root Device Node */}
                  <div className="ml-10 mb-0">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => onDeviceSelect && onDeviceSelect(item.device)}
                      className={`flex items-center gap-3 p-3 ${colors.bg} rounded-lg border ${colors.border} cursor-pointer hover:scale-[1.01] transition-all group mb-2`}
                    >
                      <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{item.device.name}</span>
                          <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} text-xs rounded-full font-bold uppercase tracking-wide`}>
                            {item.device.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span className="font-mono">{item.device.ip}</span>
                          <span>•</span>
                          <span>{item.device.vendor}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-blue-400">
                            <Activity className="w-3 h-3" />
                            {item.connectedDevices.length} devices
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Connected Devices Tree - Categorized */}
                    {item.connectedDevices.length > 0 && (
                      <div className="relative ml-6 space-y-4">
                        {Object.entries(item.categorized).map(([category, categoryDevices], catIdx) => {
                          const isLastCategory = catIdx === Object.entries(item.categorized).length - 1;
                          const categoryColors = getDeviceColor(category);
                          const categoryKey = `${rootDeviceType}-${item.device.id}-${category}`;
                          const isCollapsed = collapsedCategories.has(categoryKey);
                          
                          return (
                            <div key={category} className="relative">
                              {/* Category Header */}
                              {catIdx === 0 && (
                                <div className="absolute left-4 -top-2 w-0.5 h-4 bg-slate-700/50"></div>
                              )}
                              
                              {!isLastCategory && (
                                <div className="absolute left-4 top-0 w-0.5 h-full bg-slate-700/50"></div>
                              )}
                              
                              <div className="absolute left-4 top-4 w-6 h-0.5 bg-slate-700/50"></div>
                              
                              {isLastCategory && (
                                <div className="absolute left-4 top-0 w-0.5 h-4 bg-slate-700/50"></div>
                              )}

                              <div className="ml-10">
                                <div 
                                  onClick={() => toggleCategory(categoryKey)}
                                  className={`flex items-center gap-2 p-2 ${categoryColors.bg} rounded-lg border ${categoryColors.border} mb-2 cursor-pointer hover:opacity-80 transition-opacity`}
                                >
                                  {isCollapsed ? <ChevronRight className={`w-3.5 h-3.5 ${categoryColors.text}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${categoryColors.text}`} />}
                                  <div className={`text-xs font-bold ${categoryColors.text} uppercase tracking-wide`}>
                                    {category} ({categoryDevices.length})
                                  </div>
                                </div>

                                {/* Devices in this category */}
                                {!isCollapsed && (
                                  <div className="relative ml-4 space-y-2">
                                  {categoryDevices.map((device, devIdx) => {
                                    const isLastDevice = devIdx === categoryDevices.length - 1;
                                    const devColors = getDeviceColor(device.type);
                                    const DevIcon = getDeviceIcon(device.type);
                                    
                                    return (
                                      <div key={device.id} className="relative">
                                        {devIdx === 0 && (
                                          <div className="absolute left-3 -top-2 w-0.5 h-3 bg-slate-700/50"></div>
                                        )}
                                        
                                        {!isLastDevice && (
                                          <div className="absolute left-3 top-0 w-0.5 h-full bg-slate-700/50"></div>
                                        )}
                                        
                                        <div className="absolute left-3 top-3 w-4 h-0.5 bg-slate-700/50"></div>
                                        
                                        {isLastDevice && (
                                          <div className="absolute left-3 top-0 w-0.5 h-3 bg-slate-700/50"></div>
                                        )}

                                        <motion.div
                                          initial={{ opacity: 0, x: 20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: (idx * 0.1) + (catIdx * 0.05) + (devIdx * 0.02) }}
                                          onClick={() => onDeviceSelect && onDeviceSelect(device)}
                                          className="ml-7 group/device"
                                        >
                                          <div className={`relative flex items-center gap-2 p-2 bg-slate-900/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-blue-500/50 cursor-pointer transition-all`}>
                                            <div className={`p-1 rounded ${devColors.bg} ${devColors.text}`}>
                                              <DevIcon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-slate-300 group-hover/device:text-white truncate">
                                                  {device.name}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">{device.ip}</span>
                                              </div>
                                              <div className="text-[10px] text-slate-600 truncate">
                                                {device.vendor}
                                              </div>
                                            </div>
                                            {/* Hover tooltip */}
                                            <div className="absolute left-0 top-full mt-1 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 group-hover/device:opacity-100 pointer-events-none transition-opacity z-50">
                                              <div className="text-xs space-y-1">
                                                <div className="flex justify-between">
                                                  <span className="text-slate-400">Device:</span>
                                                  <span className="text-white font-medium">{device.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-400">IP:</span>
                                                  <span className="text-blue-400 font-mono">{device.ip}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-400">MAC:</span>
                                                  <span className="text-slate-300 font-mono text-[10px]">{device.mac || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-400">Type:</span>
                                                  <span className="text-white">{device.type}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-400">Method:</span>
                                                  <span className="text-slate-300">{device.detection_method}</span>
                                                </div>
                                              </div>
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                              device.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                              device.confidence >= 60 ? 'bg-amber-500/20 text-amber-400' :
                                              'bg-slate-700/50 text-slate-400'
                                            }`}>
                                              {device.confidence}%
                                            </span>
                                          </div>
                                        </motion.div>
                                      </div>
                                    );
                                  })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Standalone Devices */}
            {showStandalone && filteredHierarchy.standalone.length > 0 && (
              <div className="relative mt-4">
                {/* Vertical Line from root */}
                <div className="absolute left-4 top-0 w-0.5 h-6 bg-slate-700/50"></div>
                
                {/* Horizontal connector */}
                <div className="absolute left-4 top-6 w-6 h-0.5 bg-slate-700/50"></div>

                {/* Standalone Section */}
                <div className="ml-10">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 mb-2">
                    <HardDrive className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-sm font-bold text-white">Standalone Devices</div>
                      <div className="text-xs text-slate-500">{filteredHierarchy.standalone.length} devices not connected to {rootDeviceType.toLowerCase()}s</div>
                    </div>
                  </div>

                  {/* Standalone devices list - Categorized */}
                  <div className="relative ml-6 space-y-4">
                    {Object.entries(filteredHierarchy.standaloneCategorized).map(([category, categoryDevices], catIdx) => {
                      const isLastCategory = catIdx === Object.entries(hierarchy.standaloneCategorized).length - 1;
                      const categoryColors = getDeviceColor(category);
                      const categoryKey = `standalone-${category}`;
                      const isCollapsed = collapsedCategories.has(categoryKey);
                      
                      return (
                        <div key={category} className="relative">
                          {catIdx === 0 && (
                            <div className="absolute left-4 -top-2 w-0.5 h-4 bg-slate-700/50"></div>
                          )}
                          
                          {!isLastCategory && (
                            <div className="absolute left-4 top-0 w-0.5 h-full bg-slate-700/50"></div>
                          )}
                          
                          <div className="absolute left-4 top-4 w-6 h-0.5 bg-slate-700/50"></div>
                          
                          {isLastCategory && (
                            <div className="absolute left-4 top-0 w-0.5 h-4 bg-slate-700/50"></div>
                          )}

                          <div className="ml-10">
                            <div 
                              onClick={() => toggleCategory(categoryKey)}
                              className={`flex items-center gap-2 p-2 ${categoryColors.bg} rounded-lg border ${categoryColors.border} mb-2 cursor-pointer hover:opacity-80 transition-opacity`}
                            >
                              {isCollapsed ? <ChevronRight className={`w-3.5 h-3.5 ${categoryColors.text}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${categoryColors.text}`} />}
                              <div className={`text-xs font-bold ${categoryColors.text} uppercase tracking-wide`}>
                                {category} ({categoryDevices.length})
                              </div>
                            </div>

                            {/* Devices in this category */}
                            {!isCollapsed && (
                              <div className="relative ml-4 space-y-2">
                              {categoryDevices.map((device, devIdx) => {
                                const isLastDevice = devIdx === categoryDevices.length - 1;
                                const devColors = getDeviceColor(device.type);
                                const DevIcon = getDeviceIcon(device.type);
                                
                                return (
                                  <div key={device.id} className="relative">
                                    {devIdx === 0 && (
                                      <div className="absolute left-3 -top-2 w-0.5 h-3 bg-slate-700/50"></div>
                                    )}
                                    
                                    {!isLastDevice && (
                                      <div className="absolute left-3 top-0 w-0.5 h-full bg-slate-700/50"></div>
                                    )}
                                    
                                    <div className="absolute left-3 top-3 w-4 h-0.5 bg-slate-700/50"></div>
                                    
                                    {isLastDevice && (
                                      <div className="absolute left-3 top-0 w-0.5 h-3 bg-slate-700/50"></div>
                                    )}

                                    <motion.div
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: (catIdx * 0.05) + (devIdx * 0.02) }}
                                      onClick={() => onDeviceSelect && onDeviceSelect(device)}
                                      className="ml-7"
                                    >
                                      <div className={`flex items-center gap-2 p-2 bg-slate-900/30 hover:bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-slate-600 cursor-pointer transition-all group`}>
                                        <div className={`p-1 rounded ${devColors.bg} ${devColors.text}`}>
                                          <DevIcon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
                                              {device.name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">{device.ip}</span>
                                          </div>
                                          <div className="text-[10px] text-slate-600 truncate">
                                            {device.vendor}
                                          </div>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                          device.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                          device.confidence >= 60 ? 'bg-amber-500/20 text-amber-400' :
                                          'bg-slate-700/50 text-slate-400'
                                        }`}>
                                          {device.confidence}%
                                        </span>
                                      </div>
                                    </motion.div>
                                  </div>
                                );
                              })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HierarchyView;