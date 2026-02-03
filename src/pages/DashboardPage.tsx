import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsPanel from '../components/StatsPanel';
import TopologyGraph from '../components/TopologyGraph';
import HierarchyView from '../components/HierarchyView';
import DeviceOverview from '../components/DeviceOverview';
import { RawNetworkData, GraphNode, DeviceRecord } from '../types';
import { 
  Activity, X, Shield, Zap, Terminal, Loader2, CheckCircle2, 
  AlertCircle, FileText, Network as NetworkIcon, GitBranch
} from 'lucide-react';

interface DashboardPageProps {
  filteredData: RawNetworkData;
  fullData: RawNetworkData;
  selectedNode: GraphNode | null;
  setSelectedNode: (node: GraphNode | null) => void;
  searchTerm: string;
  isPinging: boolean;
  pingResult: {status: 'success' | 'error', msg: string} | null;
  handlePing: () => void;
  handleViewLogs: () => void;
  showStats?: boolean;
  showDeviceOverview?: boolean;
  deviceType?: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  filteredData,
  fullData,
  selectedNode,
  setSelectedNode,
  searchTerm,
  isPinging,
  pingResult,
  handlePing,
  handleViewLogs,
  showStats = false,
  showDeviceOverview = false,
  deviceType
}) => {
  const [viewMode, setViewMode] = useState<'graph' | 'hierarchy'>('graph');

  const handleDeviceSelect = (device: DeviceRecord) => {
    const node: GraphNode = {
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
    };
    setSelectedNode(node);
  };

  return (
    <>
      {showStats && <StatsPanel data={filteredData} deviceType={deviceType} />}
      {showDeviceOverview && deviceType && <DeviceOverview data={fullData} deviceType={deviceType} onDeviceSelect={handleDeviceSelect} />}
      <div className="flex-1 min-h-[600px] glass-panel rounded-2xl shadow-xl relative flex flex-col overflow-visible border border-slate-700/30">
        
        {/* View Toggle - Only show when not showing stats */}
        {!showStats && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl rounded-lg border border-slate-700/50 p-1 shadow-lg">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'graph'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <NetworkIcon className="w-3.5 h-3.5" />
              Graph View
            </button>
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === 'hierarchy'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Hierarchy View
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 h-full relative flex flex-col lg:flex-row overflow-hidden">
          {viewMode === 'graph' ? (
            <div className="flex-1 h-full relative p-0 bg-black/20">
              <TopologyGraph 
                data={filteredData} 
                onNodeSelect={setSelectedNode} 
                selectedNodeId={selectedNode?.id || null}
                searchTerm={searchTerm}
              />
            </div>
          ) : (
            <div className="flex-1 h-full relative p-6 bg-black/20 overflow-y-auto custom-scrollbar">
              <HierarchyView 
                data={fullData} 
                onDeviceSelect={handleDeviceSelect}
                showStandalone={showStats}
                rootDeviceType={deviceType}
              />
            </div>
          )}
        
        {/* Details Panel - Slide Over */}
        <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full lg:w-96 bg-[#0f172a]/95 backdrop-blur-xl border-l border-slate-700/50 p-6 overflow-y-auto absolute right-0 top-0 bottom-0 shadow-[ -10px_0_30px_rgba(0,0,0,0.5)] z-20"
          >
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-white/5 ${
                        selectedNode.type === 'Switch' ? 'bg-blue-600/20 text-blue-400' :
                        selectedNode.state === 'ACTIVE' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'
                    }`}>
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight break-all">{selectedNode.label}</h2>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold bg-white/5 px-2 py-0.5 rounded w-fit">{selectedNode.type}</p>
                    </div>
                </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-5">
              <DetailRow label="Status">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                    selectedNode.state === 'ACTIVE' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                        : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
                }`}>
                    {selectedNode.state === 'ACTIVE' && <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>}
                    {selectedNode.state}
                </span>
              </DetailRow>

              <div className="grid grid-cols-1 gap-4">
                 <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <DetailRow label="IP Address" mono copy>{selectedNode.ip || 'N/A'}</DetailRow>
                 </div>
                 <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <DetailRow label="MAC Address" mono>{selectedNode.mac || 'N/A'}</DetailRow>
                 </div>
              </div>

              <DetailRow label="Vendor">{selectedNode.vendor}</DetailRow>
              
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Detection Method">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Shield className="w-3 h-3 text-indigo-400" />
                        {selectedNode.method || 'Unknown'}
                    </div>
                </DetailRow>
                <DetailRow label="Confidence">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Zap className={`w-3 h-3 ${selectedNode.confidence > 50 ? 'text-amber-400' : 'text-slate-500'}`} />
                        {selectedNode.confidence}%
                    </div>
                </DetailRow>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-800">
                 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h4>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handlePing}
                        disabled={isPinging}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 shadow-lg ${
                            isPinging 
                            ? 'bg-blue-600/50 text-white/50 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 hover:scale-[1.02] active:scale-95'
                        }`}
                    >
                        {isPinging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Terminal className="w-3 h-3" />}
                        {isPinging ? 'Pinging...' : 'Ping Device'}
                    </button>
                    <button 
                        onClick={handleViewLogs}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600 hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2"
                    >
                        <FileText className="w-3 h-3" />
                        View Logs
                    </button>
                 </div>

                 {/* Ping Result Feedback */}
                 <AnimatePresence>
                    {pingResult && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`mt-3 p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                                pingResult.status === 'success' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                            }`}
                        >
                            {pingResult.status === 'success' ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
                            {pingResult.msg}
                        </motion.div>
                    )}
                 </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
        </div>
      </div>
    </>
  );
};

const DetailRow = ({ label, children, mono, copy }: any) => (
    <div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{label}</span>
        <div className={`text-sm text-slate-200 flex items-center justify-between ${mono ? 'font-mono tracking-tight' : ''}`}>
            <span>{children}</span>
            {copy && (
                <span className="text-[10px] text-blue-500 cursor-pointer hover:text-blue-400 opacity-0 hover:opacity-100 transition-opacity">COPY</span>
            )}
        </div>
    </div>
);

export default DashboardPage;
