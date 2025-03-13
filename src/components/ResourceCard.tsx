import { useState, useCallback, useEffect } from 'react';
import { ResourceItem, getAllDevTypes } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface ResourceCardProps extends ResourceItem {
  onDelete: () => void;
  onEdit?: (editedData: { title: string; url: string }) => void;
}

export default function ResourceCard({ title, url, type, addedAt, onDelete, onEdit }: ResourceCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedUrl, setEditedUrl] = useState(url);
  const [isExiting, setIsExiting] = useState(false);
  const [allDevTypes, setAllDevTypes] = useState(getAllDevTypes());

  // 每次渲染时更新类型列表
  useEffect(() => {
    setAllDevTypes(getAllDevTypes());
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      setIsExiting(true);
      // 等待动画完成后再执行删除
      setTimeout(async () => {
        await onDelete();
      }, 500); // 与动画时长相匹配
    } catch (error) {
      console.error('Error deleting resource:', error);
      setIsExiting(false);
    }
  }, [onDelete]);

  const handleCancelDelete = useCallback(() => {
    setShowConfirm(false);
    setIsDeleting(false);
  }, []);

  const handleCopyUrl = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(url);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying URL:', error);
    }
  }, [url]);

  const handleVisitUrl = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  }, [url]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  // 获取中文类型名称
  const getChineseTypeName = (type: string) => {
    // 先从所有开发类型中查找该资源类型
    for (const devType of allDevTypes) {
      const resourceType = devType.resourceTypes.find(rt => rt.id === type);
      if (resourceType) {
        return resourceType.name;
      }
    }

    // 如果没有找到，使用预定义的映射
    const typeMap: { [key: string]: string } = {
      'libraries': '开发库',
      'frameworks': '框架',
      'tools': '开发工具',
      'tutorials': '教程文档',
      'apis': 'API文档',
      'rules': '开发规则',
      'templates': '项目模板',
      'packages': '依赖包',
      'fonts': '字体资源',
      'images': '图片素材',
      'icons': '图标资源',
      'music': '音频素材',
      'videos': '视频素材',
      'colors': '配色方案',
      'animations': '动画资源',
      'illustrations': '插画素材',
      'other': '其他资源'
    };
    return typeMap[type] || type;
  };

  // 处理单击编辑
  const handleCardClick = () => {
    if (onEdit) {
      setIsEditing(true);
    }
  };

  // 处理保存编辑
  const handleSave = () => {
    if (onEdit) {
      onEdit({ title: editedTitle, url: editedUrl });
      setIsEditing(false);
    }
  };

  // 处理取消编辑
  const handleCancel = () => {
    setEditedTitle(title);
    setEditedUrl(url);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="transform transition-all duration-500 ease-in-out animate-fade-in">
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6 space-y-4 border border-blue-100">
          <div className="space-y-4 animate-slide-down">
            <div className="space-y-2 transform transition-all duration-300 ease-in-out hover:translate-y-[-2px]">
              <label className="block text-sm font-medium text-gray-700 animate-fade-in">
                标题
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out"
                placeholder="输入标题"
              />
            </div>
            <div className="space-y-2 transform transition-all duration-300 ease-in-out hover:translate-y-[-2px]">
              <label className="block text-sm font-medium text-gray-700 animate-fade-in">
                URL
              </label>
              <input
                type="url"
                value={editedUrl}
                onChange={(e) => setEditedUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out"
                placeholder="输入URL"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2 animate-fade-in">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`transform transition-all duration-300 ease-in-out ${
          isExiting ? 'card-delete-exit' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl border border-gray-100 hover:border-blue-100 transition-all duration-300 ease-in-out transform hover:translate-y-[-2px] cursor-pointer">
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-lg font-semibold text-gray-800 truncate transition-all duration-300 ease-in-out">
                  {title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5 transition-all duration-300 ease-in-out hover:text-gray-700">
                    <i className="fas fa-globe w-4"></i>
                    {getDomain(url)}
                  </span>
                  <span className="flex items-center gap-1.5 transition-all duration-300 ease-in-out hover:text-gray-700">
                    <i className="fas fa-clock w-4"></i>
                    {formatDate(addedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 transition-all duration-300 ease-in-out hover:bg-blue-200">
                    <i className={`fas fa-tag w-3 mr-1`}></i>
                    {getChineseTypeName(type)}
                  </span>
                </div>
              </div>

              <div 
                className={`flex items-center gap-2 transition-all duration-300 ease-in-out transform ${
                  isHovered 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-4'
                }`}
              >
                <button
                  onClick={handleVisitUrl}
                  className="p-2.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110"
                  title="访问链接"
                >
                  <i className="fas fa-external-link-alt text-lg"></i>
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110"
                  title="复制链接"
                >
                  <i className="fas fa-copy text-lg"></i>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110 disabled:opacity-50"
                  title="删除"
                >
                  <i className="fas fa-trash-alt text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showConfirm && (
        <ConfirmDialog
          title="确认删除"
          message="确定要删除这个资源吗？此操作无法撤销。"
          confirmText="删除"
          cancelText="取消"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isLoading={isDeleting}
        />
      )}

      {/* 复制成功提示 */}
      {showCopySuccess && (
        <div className="fixed top-4 right-4 px-4 py-2 bg-green-500 text-white rounded-md shadow-lg z-[9999] animate-dialog-enter">
          <div className="flex items-center gap-2">
            <i className="fas fa-check-circle"></i>
            <span>已复制链接</span>
          </div>
        </div>
      )}
    </>
  );
}