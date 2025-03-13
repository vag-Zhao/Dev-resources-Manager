import { useState, useEffect } from 'react';
import { getAllDevTypes } from '../types';

interface AddResourceFormProps {
  onAdd: (devType: string, resourceType: string, url: string, title: string) => void;
  onCancel: () => void;
  initialDevType?: string;
}

function AddResourceForm({ onAdd, onCancel, initialDevType }: AddResourceFormProps) {
  const [devType, setDevType] = useState(initialDevType || '');
  const [resourceType, setResourceType] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [allDevTypes, setAllDevTypes] = useState(getAllDevTypes());

  // 获取当前开发类型的资源类型选项
  const getResourceTypes = () => {
    const selectedDevType = allDevTypes.find(type => type.id === devType);
    return selectedDevType?.resourceTypes || [];
  };

  // 当开发类型改变时，重置资源类型
  useEffect(() => {
    setResourceType('');
  }, [devType]);

  // 如果提供了初始开发类型，自动选择
  useEffect(() => {
    if (initialDevType) {
      setDevType(initialDevType);
    }
  }, [initialDevType]);

  // 每次打开表单时重新获取所有类型
  useEffect(() => {
    setAllDevTypes(getAllDevTypes());
  }, []);

  // 尝试从URL获取标题
  const fetchTitleFromUrl = async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 从URL中提取域名作为标题的一部分
      const domain = new URL(url).hostname.replace('www.', '');
      const pathName = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
      
      // 创建一个基于URL的标题
      let generatedTitle = domain;
      if (pathName) {
        // 将路径中的连字符和下划线替换为空格，并首字母大写
        const formattedPath = pathName
          .replace(/[-_]/g, ' ')
          .replace(/\.[^/.]+$/, '') // 移除文件扩展名
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        generatedTitle += ` - ${formattedPath}`;
      }
      
      setTitle(generatedTitle);
    } catch (err) {
      console.error('Error fetching title:', err);
      setError('无法获取网页标题，请手动输入');
    } finally {
      setIsLoading(false);
    }
  };

  // 当URL变化时尝试获取标题
  useEffect(() => {
    if (url && !title) {
      fetchTitleFromUrl(url);
    }
  }, [url, title]);

  // 表单提交处理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!devType) {
      setError('请选择开发类型');
      return;
    }
    
    if (!resourceType) {
      setError('请选择资源类型');
      return;
    }
    
    if (!url) {
      setError('请输入资源URL');
      return;
    }
    
    if (!title) {
      setError('请输入资源标题');
      return;
    }
    
    // 验证URL格式
    try {
      new URL(url);
    } catch (err) {
      setError('请输入有效的URL地址');
      return;
    }
    
    try {
      // 提交表单
      onAdd(devType, resourceType, url, title);
      
      // 重置表单
      setDevType('');
      setResourceType('');
      setUrl('');
      setTitle('');
      setError('');
    } catch (err) {
      console.error('Error adding resource:', err);
      setError('添加资源时出错，请重试');
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-start">
          <i className="fas fa-exclamation-circle mt-1 mr-2"></i>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 开发类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              开发类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={devType}
              onChange={(e) => setDevType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">选择开发类型</option>
              {allDevTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* 资源类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              资源类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!devType}
            >
              <option value="">选择资源类型</option>
              {getResourceTypes().map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* URL输入 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            资源URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <i className="fas fa-link absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        
        {/* 标题输入 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            资源标题 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="资源标题"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <i className="fas fa-heading absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <i className="fas fa-spinner fa-spin text-gray-400"></i>
              </div>
            )}
          </div>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                处理中...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                保存资源
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddResourceForm; 