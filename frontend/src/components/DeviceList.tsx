import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DeviceRecord, GraphNode } from '../types';
import { Filter, X, Upload, CheckCircle2, AlertTriangle, Undo, Plus, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

interface DeviceListProps {
  devices: DeviceRecord[];
  onSelect: (node: GraphNode) => void;
  searchTerm: string;
  onDevicesUpdate?: (devices: DeviceRecord[]) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({ devices, onSelect, searchTerm, onDevicesUpdate }) => {
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [uploadStatus, setUploadStatus] = useState<{type: 'idle' | 'success' | 'error', message: string}>({type: 'idle', message: ''});
  const [preImportDevices, setPreImportDevices] = useState<DeviceRecord[] | null>(null);
  const [importedDevices, setImportedDevices] = useState<{
    new: Set<string>, 
    updated: Map<string, string[]>
  }>({new: new Set(), updated: new Map()});
  const [showImportModeModal, setShowImportModeModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewDevices, setPreviewDevices] = useState<{devices: DeviceRecord[], mode: string, stats: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear import indicators after 15 seconds
  useEffect(() => {
    if (importedDevices.new.size > 0 || importedDevices.updated.size > 0) {
      const timer = setTimeout(() => {
        setImportedDevices({new: new Set(), updated: new Map()});
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [importedDevices]);

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


  // Handle Excel file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Store file and show mode selection modal
    setPendingFile(file);
    setShowImportModeModal(true);
  };

  // Process Excel file with selected mode
  const processExcelFile = (mode: 'add' | 'override') => {
    if (!pendingFile) return;

    setShowImportModeModal(false);
    
    // Save current state before import
    setPreImportDevices([...devices]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Helper: Case-insensitive column lookup
        const getColumn = (row: any, ...names: string[]) => {
          for (const name of names) {
            // Try exact match first
            if (row[name]) return row[name];
            // Try case-insensitive match
            const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
            if (key && row[key]) return row[key];
          }
          return '';
        };

        // Map Excel data to DeviceRecord format
        const newDevices: DeviceRecord[] = jsonData.map((row: any, index: number) => {
          const ipValue = getColumn(row, 'IP Address', 'IP ADDRESS', 'ip', 'IP');
          const macValue = getColumn(row, 'MAC Address', 'MAC ADDRESS', 'mac', 'MAC');
          
          return {
            id: devices.length + index + 1,
            ip: ipValue || '',
            name: getColumn(row, 'Device Name', 'Device', 'DEVICE', 'name') || `Device-${ipValue || index}`,
            type: getColumn(row, 'Type', 'TYPE', 'type') || 'UNKNOWN',
            detection_method: getColumn(row, 'Detection Method', 'detection_method') || 'Excel Import',
            mac: macValue ? macValue.replace(/-/g, ':') : '', // Convert hyphens to colons
            network: getColumn(row, 'Network', 'NETWORK', 'network') || 'Imported',
            vendor: getColumn(row, 'Vendor', 'VENDOR', 'vendor') || 'Unknown',
            last_seen: getColumn(row, 'Last Seen', 'last_seen') || new Date().toISOString(),
            name_source: getColumn(row, 'Name Source', 'name_source') || 'Excel',
            netbios_domain: getColumn(row, 'Domain', 'netbios_domain') || null,
            logged_in_user: getColumn(row, 'User', 'logged_in_user') || null,
            confidence: parseInt(getColumn(row, 'Confidence', 'CONFIDENCE', 'confidence') || '75') || 75,
          };
        });

        // Process devices based on selected mode
        let finalDevices: DeviceRecord[];
        const newlyAddedDevices: DeviceRecord[] = [];
            let overrideCount = 0;
        let addCount = 0;
        let removedCount = 0;
        const newDeviceIds = new Set<string>();
        const updatedDevicesMap = new Map<string, string[]>();
        
        // Helper: Detect changed fields
        const getChangedFields = (oldDevice: DeviceRecord, newDevice: DeviceRecord): string[] => {
          const changed: string[] = [];
          if (oldDevice.ip !== newDevice.ip) changed.push('IP');
          if (oldDevice.mac !== newDevice.mac) changed.push('MAC');
          if (oldDevice.name !== newDevice.name) changed.push('Name');
          if (oldDevice.type !== newDevice.type) changed.push('Type');
          if (oldDevice.vendor !== newDevice.vendor) changed.push('Vendor');
          if (oldDevice.confidence !== newDevice.confidence) changed.push('Confidence');
          return changed;
        };
        
        if (mode === 'override') {
          // Override mode: Only keep devices from Excel
          const updatedDevices: DeviceRecord[] = [];
          
          newDevices.forEach(newDevice => {
            const existingDevice = devices.find(
              d => (newDevice.mac && d.mac === newDevice.mac) || (newDevice.ip && d.ip === newDevice.ip)
            );
            
            const deviceId = newDevice.mac || newDevice.ip;
            
            if (existingDevice) {
              // Device exists - update it
              const changedFields = getChangedFields(existingDevice, newDevice);
              updatedDevices.push({ ...existingDevice, ...newDevice });
              overrideCount++;
              if (deviceId && changedFields.length > 0) {
                updatedDevicesMap.set(deviceId, changedFields);
              }
            } else {
              // New device - collect to add at top
              newlyAddedDevices.push(newDevice);
              addCount++;
              if (deviceId) newDeviceIds.add(deviceId);
            }
          });
          
          removedCount = devices.length - overrideCount;
          finalDevices = [...newlyAddedDevices, ...updatedDevices];
          
        } else {
          // Add/Merge mode: Keep existing devices not in Excel
          const updatedDevices = [...devices];
          
          newDevices.forEach(newDevice => {
            const existingIndex = updatedDevices.findIndex(
              d => (newDevice.mac && d.mac === newDevice.mac) || (newDevice.ip && d.ip === newDevice.ip)
            );
            
            const deviceId = newDevice.mac || newDevice.ip;
            
            if (existingIndex >= 0) {
              // Override existing device
              const changedFields = getChangedFields(updatedDevices[existingIndex], newDevice);
              updatedDevices[existingIndex] = { ...updatedDevices[existingIndex], ...newDevice };
              overrideCount++;
              if (deviceId && changedFields.length > 0) {
                updatedDevicesMap.set(deviceId, changedFields);
              }
            } else {
              // Collect new devices to add at the top
              newlyAddedDevices.push(newDevice);
              addCount++;
              if (deviceId) newDeviceIds.add(deviceId);
            }
          });
          
          // Add new devices at the beginning (top) of the list
          finalDevices = [...newlyAddedDevices, ...updatedDevices];
        }

        setImportedDevices({new: newDeviceIds, updated: updatedDevicesMap});
        
        // Store preview instead of immediately applying
        const modeLabel = mode === 'override' ? 'Override' : 'Merge';
        const message = mode === 'override'
          ? `${modeLabel}: ${addCount} new, ${overrideCount} updated, ${removedCount} removed`
          : `${modeLabel}: ${addCount} new, ${overrideCount} updated`;
        
        setPreviewDevices({
          devices: finalDevices,
          mode: modeLabel,
          stats: message
        });
        
        setUploadStatus({
          type: 'success',
          message: `Preview ready: ${message}` 
        });
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setUploadStatus({
          type: 'error',
          message: 'Failed to parse Excel file. Check format.'
        });
        setPreImportDevices(null); // Clear saved state on error
        setTimeout(() => setUploadStatus({type: 'idle', message: ''}), 5000);
      }
    };

    reader.readAsArrayBuffer(pendingFile);
    // Reset input and pending file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPendingFile(null);
  };

  // Save preview changes
  const handleSavePreview = () => {
    if (previewDevices && onDevicesUpdate) {
      // Save current state before applying preview
      setPreImportDevices([...devices]);
      
      // Apply preview
      onDevicesUpdate(previewDevices.devices);
      
      setUploadStatus({
        type: 'success',
        message: `Saved: ${previewDevices.stats}`
      });
      
      setTimeout(() => {
        setUploadStatus({type: 'idle', message: ''});
        setImportedDevices({new: new Set(), updated: new Map()});
      }, 5000);
      
      setPreviewDevices(null);
    }
  };
  
  // Cancel preview
  const handleCancelPreview = () => {
    setPreviewDevices(null);
    setImportedDevices({new: new Set(), updated: new Map()});
    setUploadStatus({type: 'idle', message: ''});
  };

  // Undo last import
  const handleUndoImport = () => {
    if (preImportDevices && onDevicesUpdate) {
      onDevicesUpdate(preImportDevices);
      setPreImportDevices(null);
      setImportedDevices({new: new Set(), updated: new Map()});
      setUploadStatus({
        type: 'success',
        message: 'Restored to previous state'
      });
      setTimeout(() => setUploadStatus({type: 'idle', message: ''}), 3000);
    }
  };

  // Use preview devices if available, otherwise use current devices
  const displayDevices = previewDevices ? previewDevices.devices : devices;
  
  const filtered = displayDevices.filter(d => {
    // Search filter
    const matchesSearch = d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ip?.includes(searchTerm) ||
      d.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = selectedTypes.size === 0 || selectedTypes.has(d.type);
    
    
    
    return matchesSearch && matchesType;
  });

  const getStateColor = (type: string) => {
      if (type.includes('ACTIVE') || type === 'Switch') return 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      if (type === 'L2ONLY') return 'bg-slate-800 text-slate-500 border-slate-700';
      return 'bg-amber-500/5 text-amber-400 border-amber-500/20';
  };

  return (
    <div className="glass-panel rounded-xl shadow-lg flex flex-col h-full overflow-hidden border border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/20 backdrop-blur-sm">
         <div className="flex justify-between items-center mb-3">
           <h3 className="text-slate-100 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
              Device Inventory
           </h3>
           <div className="flex items-center gap-2">
             <span className="text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50 shadow-inner">
                {filtered.length} Devices
             </span>
             
             {/* Save/Cancel Preview Buttons */}
             {previewDevices && (
               <>
                 <button
                   onClick={handleSavePreview}
                   className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-600/10 hover:bg-green-600/20 border border-green-500/30 rounded-lg transition-all group"
                   title="Save these changes"
                 >
                   <CheckCircle2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                   <span>Save Changes</span>
                 </button>
                 <button
                   onClick={handleCancelPreview}
                   className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 rounded-lg transition-all group"
                   title="Discard preview"
                 >
                   <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                   <span>Cancel</span>
                 </button>
               </>
             )}
             
             {/* Undo Import Button */}
             {!previewDevices && preImportDevices && (
               <button
                 onClick={handleUndoImport}
                 className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/30 rounded-lg transition-all group"
                 title="Undo last import and restore previous state"
               >
                 <Undo className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                 <span>Undo the Last Import</span>
               </button>
             )}
             
             {/* Excel Upload Button */}
             {!previewDevices && (
               <button
                 onClick={() => fileInputRef.current?.click()}
                 className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-lg transition-all group"
                 title="Upload Excel file to import devices"
               >
                 <Upload className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                 <span>Import Excel</span>
               </button>
             )}
             <input
               ref={fileInputRef}
               type="file"
               accept=".xlsx,.xls,.csv"
               onChange={handleFileUpload}
               className="hidden"
             />
           </div>
         </div>
         
         {/* Upload Status Message */}
         <AnimatePresence>
           {uploadStatus.type !== 'idle' && (
             <motion.div
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                 uploadStatus.type === 'success'
                   ? 'bg-green-600/10 text-green-400 border border-green-500/30'
                   : 'bg-red-600/10 text-red-400 border border-red-500/30'
               }`}
             >
               {uploadStatus.type === 'success' ? (
                 <CheckCircle2 className="w-4 h-4" />
               ) : (
                 <AlertTriangle className="w-4 h-4" />
               )}
               <span>{uploadStatus.message}</span>
             </motion.div>
           )}
         </AnimatePresence>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/80 text-slate-300 sticky top-0 z-10 backdrop-blur-md shadow-sm">
            <tr>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500">Device</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500">IP Address</th>
              <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-slate-500">MAC Address</th>
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
             
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            <AnimatePresence initial={false}>
            {filtered.map((device) => {
              const deviceId = device.mac || device.ip;
              const isNewDevice = importedDevices.new.has(deviceId);
              const isUpdatedDevice = importedDevices.updated.has(deviceId);
              const updatedFields = importedDevices.updated.get(deviceId) || [];
              
              return (
              <motion.tr 
                key={device.id}
                initial={{ opacity: 0, scale: isNewDevice || isUpdatedDevice ? 0.98 : 1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`hover:bg-blue-500/5 cursor-pointer transition-colors duration-150 group ${
                  isNewDevice ? 'bg-green-500/5 border-l-2 border-green-500' : 
                  isUpdatedDevice ? 'bg-amber-500/5 border-l-2 border-amber-500' : ''
                }`}
                onClick={() => {
                    const node: GraphNode = {
                             id: device.mac || `dev-${device.id}`,
                             label: device.name,
                             type: device.type,
                             ip: device.ip,
                             mac: device.mac,
                             vendor: device.vendor,
                             state: device.type, // Map Type to State roughly
                             method: device.detection_method,
                             details: device,
                             confidence: device.confidence,
                             index: 0, 
                             x: 0, y: 0, vx: 0, vy: 0
                         };
                     onSelect(node);
                }}
              >
                <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-slate-200 truncate max-w-[180px] group-hover:text-blue-400 transition-colors">{device.name}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">{device.vendor}</div>
                      </div>
                      {isNewDevice ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600/20 text-green-400 border border-green-500/30 rounded text-[9px] font-bold uppercase tracking-wide animate-pulse">
                          <Plus className="w-2.5 h-2.5" />
                          NEW
                        </span>
                      ) : isUpdatedDevice ? (
                        <span 
                          className="flex items-center gap-1 px-2 py-0.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold uppercase tracking-wide animate-pulse cursor-help"
                          title={`Updated: ${updatedFields.join(', ')}`}
                        >
                          <RefreshCcw className="w-2.5 h-2.5" />
                          UPDATED
                        </span>
                      ) : null}
                    </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-400 group-hover:text-slate-300">{device.ip}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500 group-hover:text-slate-400">
                  {device.mac || <span className="text-slate-600 italic">N/A</span>}
                </td>
                <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStateColor(device.type)}`}>
                        {device.type}
                    </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                     
                  </div>
                </td>
              </motion.tr>
              );
            })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      
      {/* Import Mode Selection Modal */}
      <AnimatePresence>
        {showImportModeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center"
            onClick={() => {
              setShowImportModeModal(false);
              setPendingFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-2">Choose Import Mode</h3>
              <p className="text-sm text-slate-400 mb-6">
                How would you like to import the devices from <span className="text-blue-400">{pendingFile?.name}</span>?
              </p>
              
              <div className="space-y-3">
                {/* Add/Merge Mode */}
                <button
                  onClick={() => processExcelFile('add')}
                  className="w-full flex items-start gap-4 p-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-lg transition-all group text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">Add / Merge</div>
                    <div className="text-xs text-slate-400">
                      • Add new devices from Excel<br/>
                      • Update matching devices<br/>
                      • <span className="text-blue-400 font-medium">Keep existing devices not in Excel</span>
                    </div>
                  </div>
                </button>
                
                {/* Override Mode */}
                <button
                  onClick={() => processExcelFile('override')}
                  className="w-full flex items-start gap-4 p-4 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 rounded-lg transition-all group text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                    <RefreshCcw className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">Override / Replace</div>
                    <div className="text-xs text-slate-400">
                      • Add new devices from Excel<br/>
                      • Update matching devices<br/>
                      • <span className="text-red-400 font-medium">Remove devices not in Excel</span>
                    </div>
                  </div>
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowImportModeModal(false);
                  setPendingFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="mt-4 w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeviceList;