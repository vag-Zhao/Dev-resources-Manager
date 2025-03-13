import { useState } from 'react';
import { DevTypeInfo, ResourceType, DEV_RESOURCE_TYPES } from '../types';

interface AddDevTypeFormProps {
  onAdd: (newType: DevTypeInfo) => void;
  onCancel: () => void;
}

export default function AddDevTypeForm({ onAdd, onCancel }: AddDevTypeFormProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('fa-folder');
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [newResourceType, setNewResourceType] = useState({ name: '', icon: 'fa-file' });
  const [error, setError] = useState('');
  const [useDefaultResourceTypes, setUseDefaultResourceTypes] = useState(true);

  const commonIcons = [
    'fa-folder', 'fa-code', 'fa-book', 'fa-tools', 'fa-cog', 'fa-cube', 
    'fa-database', 'fa-cloud', 'fa-mobile-alt', 'fa-desktop', 'fa-server',
    'fa-laptop-code', 'fa-terminal', 'fa-microchip', 'fa-layer-group'
  ];

  const handleSubmit = () => {
    try {
      if (!name.trim()) {
        setError('请输入类型名称');
        return;
      }

      // 确定要使用的资源类型
      let finalResourceTypes = resourceTypes;
      
      // 如果选择使用默认资源类型且没有添加自定义资源类型
      if (useDefaultResourceTypes && resourceTypes.length === 0) {
        finalResourceTypes = [...DEV_RESOURCE_TYPES];
      }
      // 如果没有任何资源类型，添加一个默认的"其他资源"类型
      else if (finalResourceTypes.length === 0) {
        finalResourceTypes = [{ id: 'other', name: '其他资源', icon: 'fa-file' }];
      }

      const newType: DevTypeInfo = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        icon,
        resourceTypes: finalResourceTypes
      };

      onAdd(newType);
    } catch (error) {
      setError(error instanceof Error ? error.message : '添加失败');
    }
  };

  const addResourceType = () => {
    if (!newResourceType.name.trim()) {
      setError('请输入资源类型名称');
      return;
    }

    const resourceType: ResourceType = {
      id: newResourceType.name.toLowerCase().replace(/\s+/g, '-'),
      name: newResourceType.name.trim(),
      icon: newResourceType.icon
    };

    setResourceTypes([...resourceTypes, resourceType]);
    setNewResourceType({ name: '', icon: 'fa-file' });
    setError('');
  };

  const removeResourceType = (id: string) => {
    setResourceTypes(resourceTypes.filter(type => type.id !== id));
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          类型名称
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例如：设计资源"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          图标
        </label>
        <div className="grid grid-cols-8 gap-2">
          {commonIcons.map((iconName) => (
            <button
              key={iconName}
              onClick={() => setIcon(iconName)}
              className={`p-2 rounded-lg transition-colors ${
                icon === iconName
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <i className={`fas ${iconName} text-lg`}></i>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            资源类型
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useDefaultTypes"
              checked={useDefaultResourceTypes}
              onChange={(e) => setUseDefaultResourceTypes(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useDefaultTypes" className="text-sm text-gray-600">
              使用默认资源类型
            </label>
          </div>
        </div>

        {useDefaultResourceTypes && resourceTypes.length === 0 && (
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2">
            <p>将使用默认的开发资源类型，包括：开发库、框架、开发工具、教程文档等。</p>
          </div>
        )}

        <div className="space-y-2">
          {resourceTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
            >
              <div className="flex items-center gap-2">
                <i className={`fas ${type.icon}`}></i>
                <span>{type.name}</span>
              </div>
              <button
                onClick={() => removeResourceType(type.id)}
                className="text-red-500 hover:text-red-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newResourceType.name}
            onChange={(e) => setNewResourceType(prev => ({ ...prev, name: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="添加资源类型"
          />
          <button
            onClick={addResourceType}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
          >
            添加
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          确认添加
        </button>
      </div>
    </div>
  );
} 