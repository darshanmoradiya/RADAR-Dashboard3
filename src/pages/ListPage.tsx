import React from 'react';
import DeviceList from '../components/DeviceList';
import { DeviceRecord, GraphNode } from '../types';

interface ListPageProps {
  devices: DeviceRecord[];
  onSelect: (node: GraphNode) => void;
  searchTerm: string;
}

const ListPage: React.FC<ListPageProps> = ({ devices, onSelect, searchTerm }) => {
  return (
    <div className="h-full pb-4">
      <DeviceList 
        devices={devices} 
        onSelect={onSelect} 
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default ListPage;
