import { useState } from 'react';
import { ResourceData, DevType, DEV_TYPES } from '../types';

interface SidebarProps {
  resourceData: ResourceData;
  selectedDevType: DevType | null;
  onSelectDevType: (devType: DevType | null) => void;
}

function Sidebar({ resourceData, selectedDevType, onSelectDevType }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 获取每种开发类型的资源数量
  const getResourceCount = (devType: string): number => {
    if (!resourceData[devType]) return 0;
    
    return Object.values(resourceData[devType]).reduce(
      (total, resources) => total + resources.length, 
      0
    );
  };

  return (
    <aside 
      className={`bg-white shadow-lg transition-all duration-300 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* 侧边栏头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-800">
            <i className="fas fa-bookmark mr-2 text-blue-500"></i>
            资源收纳库
          </h1>
        )}
        {isCollapsed && (
          <i className="fas fa-bookmark text-xl text-blue-500 mx-auto"></i>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>

      {/* 开发类型列表 */}
      <nav className="p-2 overflow-y-auto" style={{ height: 'calc(100vh - 65px)' }}>
        <div className="mb-4 px-2">
          <button
            onClick={() => onSelectDevType(null)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              selectedDevType === null 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <i className={`fas fa-home ${isCollapsed ? 'text-xl' : 'mr-3'}`}></i>
            {!isCollapsed && <span className="flex-1 text-left">全部资源</span>}
          </button>
        </div>
        
        <div className="px-2 py-1">
          {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">开发类型</h3>}
        </div>
        
        <ul className="space-y-1">
          {DEV_TYPES.map((devType) => {
            const count = getResourceCount(devType.id);
            const isActive = selectedDevType === devType.id;
            
            return (
              <li key={devType.id}>
                <button
                  onClick={() => onSelectDevType(devType.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <i className={`fas ${devType.icon} ${isCollapsed ? 'text-xl' : 'mr-3'}`}></i>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{devType.name}</span>
                      {count > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                          {count}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && count > 0 && (
                    <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar; 