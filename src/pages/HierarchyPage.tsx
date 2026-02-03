// import React from 'react';
import HierarchyView from '../components/HierarchyView';
import { RawNetworkData, DeviceRecord } from '../types';

interface HierarchyPageProps {
  data: RawNetworkData;
  onDeviceSelect: (device: DeviceRecord) => void;
}

const HierarchyPage: React.FC<HierarchyPageProps> = ({ data, onDeviceSelect }) => {
  return (
    <div className="h-full pb-4">
      <HierarchyView 
        data={data} 
        onDeviceSelect={onDeviceSelect}
      />
    </div>
  );
};

export default HierarchyPage;
