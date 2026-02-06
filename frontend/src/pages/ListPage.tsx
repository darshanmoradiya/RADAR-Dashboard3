import React from 'react';
import DeviceList from '../components/DeviceList';
import { DeviceRecord, GraphNode } from '../types';

interface ListPageProps {
  devices: DeviceRecord[];
  onSelect: (node: GraphNode) => void;
  searchTerm: string;
  onDevicesUpdate?: (devices: DeviceRecord[]) => void;
}

const ListPage: React.FC<ListPageProps> = ({ devices, onSelect, searchTerm, onDevicesUpdate }) => {
  return (
    <div className="h-full pb-4">
      <DeviceList 
        devices={devices} 
        onSelect={onSelect} 
        searchTerm={searchTerm}
        onDevicesUpdate={onDevicesUpdate}
      />
    </div>
  );
};

export default ListPage;
