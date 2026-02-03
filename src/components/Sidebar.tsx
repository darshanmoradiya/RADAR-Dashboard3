import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Network, List, Shield, Router, Monitor, 
  Smartphone, Server, Zap, ChevronDown, Filter, LogOut
} from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  selectedCategory: 'ALL' | 'SWITCH' | 'ROUTER' | 'FIREWALL' | 'DESKTOP' | 'SMARTPHONE' | 'CAMERA';
  setSelectedCategory: (category: 'ALL' | 'SWITCH' | 'ROUTER' | 'FIREWALL' | 'DESKTOP' | 'SMARTPHONE' | 'CAMERA') => void;
  selectedNetwork: string;
  setSelectedNetwork: (network: string) => void;
  uniqueNetworks: string[];
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  selectedCategory,
  setSelectedCategory,
  selectedNetwork,
  setSelectedNetwork,
  uniqueNetworks,
  onLogout
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <nav className={`flex flex-col glass-panel border-r-0 border-r-slate-800 z-40 rounded-2xl shadow-2xl relative transition-all duration-300 m-3 mb-3 mr-0 py-6 ${
        isSidebarOpen ? 'w-64' : 'w-20'
    }`}>
      <div className={`flex flex-col px-4 mb-6 ${isSidebarOpen ? 'items-start' : 'items-center'}`}>
          <div className={`flex items-center gap-3 mb-6 w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
              <div className="shrink-0">
                  <img 
                    src="https://forensiccybertech.com/wp-content/uploads/2025/05/Eagleye-logo-1.png" 
                    alt="Eagleye" 
                    className="w-10 h-10 object-contain" 
                  />
              </div>
              <div className={`${isSidebarOpen ? 'block' : 'hidden'} overflow-hidden
               whitespace-nowrap`}>
                  <h1 className="text-lg font-black text-white tracking-wide leading-none">EAGLEYE</h1>
                  <p className="text-[10px] text-blue-500 font-bold tracking-[0.25em] mt-0.5">RADAR</p>
              </div>
          </div>

          {/* Network Selector - Hide when collapsed for cleaner UI */}
          {isSidebarOpen && (
              <div className="w-full relative group z-50 animate-fadeIn">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="h-3 w-3 text-slate-500" />
                   </div>
                   <select 
                      value={selectedNetwork}
                      onChange={(e) => setSelectedNetwork(e.target.value)}
                      className="appearance-none w-full bg-slate-900/50 border border-slate-700 hover:border-blue-500/50 text-slate-300 text-xs rounded-lg pl-8 pr-8 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all truncate"
                   >
                      {uniqueNetworks.map(net => (
                          <option key={net} value={net}>{net}</option>
                      ))}
                   </select>
                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-3 w-3 text-slate-500" />
                   </div>
              </div>
          )}
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar w-full">
        {isSidebarOpen && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 animate-fadeIn">Views</div>}
        
        <NavButton 
          active={selectedCategory === 'ALL' && (currentPath === '/dashboard' || currentPath === '/')} 
          onClick={() => { setSelectedCategory('ALL'); navigate('/dashboard'); }} 
          icon={<LayoutDashboard className="w-4 h-4" />}
          label="Dashboard"
          expanded={isSidebarOpen}
        />
        <NavButton 
          active={currentPath === '/list'} 
          onClick={() => navigate('/list')} 
          icon={<List className="w-4 h-4" />}
          label="Inventory List"
          expanded={isSidebarOpen}
        />
        <NavButton 
          active={currentPath === '/hierarchy'} 
          onClick={() => navigate('/hierarchy')} 
          icon={<Network className="w-4 h-4" />}
          label="Hierarchy"
          expanded={isSidebarOpen}
        />
        
        <div className="my-4 border-t border-slate-800/50 mx-2"></div>
        
        {isSidebarOpen && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 animate-fadeIn">Devices</div>}
        
        <NavButton 
          active={currentPath === '/switches'} 
          onClick={() => navigate('/switches')} 
          icon={<Server className="w-4 h-4" />}
          label="Switches"
          expanded={isSidebarOpen}
        />
        <NavButton 
          active={currentPath === '/routers'} 
          onClick={() => navigate('/routers')} 
          icon={<Router className="w-4 h-4" />}
          label="Routers"
          expanded={isSidebarOpen}
        />
        <NavButton 
          active={currentPath === '/firewalls'} 
          onClick={() => navigate('/firewalls')} 
          icon={<Shield className="w-4 h-4" />}
          label="Firewalls"
          expanded={isSidebarOpen}
        />
        <NavButton 
          active={currentPath === '/desktops'} 
          onClick={() => navigate('/desktops')} 
          icon={<Monitor className="w-4 h-4" />}
          label="Desktops"
          expanded={isSidebarOpen}
        />
        <NavButton 
          active={currentPath === '/smartphones'} 
          onClick={() => navigate('/smartphones')} 
          icon={<Smartphone className="w-4 h-4" />}
          label="Smartphones"
          expanded={isSidebarOpen}
        />
        <NavButton 
          active={currentPath === '/cameras'} 
          onClick={() => navigate('/cameras')} 
          icon={<Zap className="w-4 h-4" />}
          label="Cameras"
          expanded={isSidebarOpen}
        />
      </div>

      {/* Logout Button at Bottom */}
      {onLogout && (
        <div className="px-3 py-4 border-t border-slate-800/50">
          <button
            onClick={onLogout}
            className={`group relative p-2.5 rounded-xl flex items-center transition-all duration-300 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 ${
              isSidebarOpen ? 'justify-start gap-3' : 'justify-center'
            }`}
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span className="text-xs font-medium">Logout</span>}
            {/* Tooltip for collapsed state */}
            {!isSidebarOpen && (
              <span className="fixed left-20 bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none shadow-xl border border-slate-700 z-50">
                Logout
              </span>
            )}
          </button>
        </div>
      )}
    </nav>
  );
};

const NavButton = ({ active, onClick, icon, label, expanded }: any) => (
    <button 
      onClick={onClick}
      className={`group relative p-2.5 rounded-xl flex items-center transition-all duration-300 w-full mb-1 ${
          active 
          ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
      } ${expanded ? 'justify-start gap-3' : 'justify-center'}`}
    >
      <span className={active ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]' : ''}>{icon}</span>
      {expanded && <span className={`text-xs font-medium ${active ? 'text-blue-100' : ''}`}>{label}</span>}
      {/* Tooltip for collapsed state */}
      {!expanded && (
        <span className="fixed left-20 bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none shadow-xl border border-slate-700 z-50">
            {label}
        </span>
      )}
      {active && expanded && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>}
    </button>
);

export default Sidebar;
