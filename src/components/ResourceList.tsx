import { useState, useEffect } from 'react';
import { ResourceData, DevType, ResourceType, getAllDevTypes } from '../types';
import ResourceCard from './ResourceCard';
import AddResourceForm from './AddResourceForm';
import Modal from './Modal';

interface ResourceListProps {
  resourceData: ResourceData;
  selectedDevType: DevType;
  onAddResource: (devType: string, resourceType: string, url: string, title: string) => void;
  onDeleteResource: (devType: string, resourceType: string, index: number) => void;
}

function ResourceList({ 
  resourceData, 
  selectedDevType, 
  onAddResource, 
  onDeleteResource 
}: ResourceListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allDevTypes, setAllDevTypes] = useState(getAllDevTypes());

  // 每次渲染更新类型列表
  useEffect(() => {
    setAllDevTypes(getAllDevTypes());
  }, []);

  // 获取要显示的开发类型
  const devTypesToShow = selectedDevType 
    ? [selectedDevType] 
    : Object.keys(resourceData);

  // 搜索过滤函数
  const filterBySearch = (title: string, url: string) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return title.toLowerCase().includes(term) || url.toLowerCase().includes(term);
  };

  // 如果没有数据，显示空状态
  if (devTypesToShow.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center p-8 max-w-md">
          <i className="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">还没有保存任何资源</h2>
          <p className="text-gray-500 mb-6">点击下方按钮开始添加您的第一个资源链接</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            添加资源
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* 头部搜索和添加按钮 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          {selectedDevType 
            ? allDevTypes.find(type => type.id === selectedDevType)?.name || '资源列表' 
            : '全部资源'}
        </h1>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="搜索资源..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>
            添加
          </button>
        </div>
      </div>

      {/* 添加资源模态框 */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="添加新资源"
        size="lg"
      >
        <AddResourceForm
          onAdd={(devType, resourceType, url, title) => {
            onAddResource(devType, resourceType, url, title);
            setIsAddModalOpen(false);
          }}
          onCancel={() => setIsAddModalOpen(false)}
          initialDevType={selectedDevType || undefined}
        />
      </Modal>

      {/* 资源列表 */}
      <div className="space-y-8">
        {devTypesToShow.map(devType => {
          const devTypeData = resourceData[devType];
          if (!devTypeData) return null;
          
          const devTypeInfo = allDevTypes.find(type => type.id === devType);
          const devTypeName = devTypeInfo?.name || devType;
          const devTypeIcon = devTypeInfo?.icon || 'fa-code';
          
          return (
            <div key={devType} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* 开发类型标题 */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <i className={`fas ${devTypeIcon} mr-2 text-blue-500`}></i>
                  {devTypeName}
                </h2>
              </div>
              
              {/* 资源类型列表 */}
              <div className="p-4">
                {Object.entries(devTypeData).map(([resourceType, resources]) => {
                  // 查找资源类型信息
                  const devTypeObj = allDevTypes.find(type => type.id === devType);
                  const resourceTypeObj = devTypeObj?.resourceTypes.find(type => type.id === resourceType);
                  
                  const resourceTypeName = resourceTypeObj?.name || 
                    allDevTypes.flatMap(dt => dt.resourceTypes).find((type: ResourceType) => type.id === resourceType)?.name || 
                    resourceType;
                  const resourceTypeIcon = resourceTypeObj?.icon || 
                    allDevTypes.flatMap(dt => dt.resourceTypes).find((type: ResourceType) => type.id === resourceType)?.icon || 
                    'fa-link';
                  
                  // 过滤搜索结果
                  const filteredResources = resources.filter(resource => 
                    filterBySearch(resource.title, resource.url)
                  );
                  
                  if (filteredResources.length === 0) return null;
                  
                  return (
                    <div key={resourceType} className="mb-6 last:mb-0">
                      <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                        <i className={`fas ${resourceTypeIcon} mr-2 text-blue-500`}></i>
                        {resourceTypeName}
                        <span className="ml-2 text-sm text-gray-500">({filteredResources.length})</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResources.map((resource, index) => (
                          <ResourceCard
                            key={index}
                            {...resource}
                            type={resourceType}
                            onDelete={() => onDeleteResource(devType, resourceType, index)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResourceList; 