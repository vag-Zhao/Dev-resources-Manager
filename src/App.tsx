import { useState, useEffect, useRef } from 'react';
// 这些组件在 App.tsx 中实际使用，但 TypeScript 检测不到
// import Sidebar from './components/Sidebar';
// import ResourceList from './components/ResourceList';
import { ResourceData, DevType, DEV_TYPES, ResourceItem, DevTypeInfo, getAllDevTypes, addCustomDevType, deleteCustomDevType } from './types';
import { getBackgroundImage } from './utils/unsplash';
import ResourceCard from './components/ResourceCard';
import AddResourceForm from './components/AddResourceForm';
import AddDevTypeForm from './components/AddDevTypeForm';

function App() {
  const [selectedDevType, setSelectedDevType] = useState<DevType | null>(null);
  const [currentResourceType, setCurrentResourceType] = useState<string | null>(null);
  const [resourceData, setResourceData] = useState<ResourceData>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);
  const [devTypes, setDevTypes] = useState<DevTypeInfo[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageAuthor, setImageAuthor] = useState<{ name: string; link: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<DevTypeInfo | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [activeNotification, setActiveNotification] = useState<React.ReactNode | null>(null);
  const [isNotificationExiting, setIsNotificationExiting] = useState(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // 添加按钮点击扩散效果处理函数
  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    
    // 移除之前的所有 ripple 元素
    const oldRipples = button.getElementsByClassName('ripple-effect');
    while (oldRipples.length > 0) {
      oldRipples[0].remove();
    }
    
    // 创建新的 ripple 元素
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    // 设置 ripple 的位置和大小
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    
    // 计算点击位置相对于按钮的坐标
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    // 添加 ripple 到按钮
    button.appendChild(ripple);
    
    // 添加动画类
    setTimeout(() => {
      ripple.classList.add('ripple-animate');
    }, 10);
    
    // 动画结束后移除 ripple
    setTimeout(() => {
      ripple.remove();
    }, 800);
  };

  // 从本地存储加载数据并获取背景图片
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载资源数据
        const savedData = localStorage.getItem('resourceData');
        if (savedData) {
          setResourceData(JSON.parse(savedData));
        }

        // 加载开发类型（包括自定义类型）
        setDevTypes(getAllDevTypes());

        // 获取背景图片
        const bgImage = await getBackgroundImage({
          query: 'minimal pattern light',
          orientation: 'landscape',
          collections: '317099,4932215,8961198'
        });
        
        if (bgImage) {
          setBackgroundImage(bgImage.url);
          setImageAuthor({
            name: bgImage.user.name,
            link: bgImage.user.link
          });
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 获取当前开发类型的资源类型选项
  const getResourceTypes = () => {
    if (!selectedDevType) return [];
    // 从所有类型（包括自定义类型）中查找
    const allTypes = getAllDevTypes();
    const devTypeInfo = allTypes.find(type => type.id === selectedDevType);
    return devTypeInfo?.resourceTypes || [];
  };

  // 获取过滤后的资源列表
  const getFilteredResources = () => {
    try {
      if (!selectedDevType || !resourceData[selectedDevType]) return [];
      const devResources = resourceData[selectedDevType];
      
      if (!currentResourceType) {
        // 如果没有选择资源类型，显示所有资源
        const allResources: ResourceItem[] = [];
        Object.entries(devResources).forEach(([resourceType, resources]) => {
          if (Array.isArray(resources)) {
            resources.forEach((resource) => {
              if (resource && typeof resource === 'object') {
                allResources.push({
                  ...resource,
                  type: resource.type || resourceType // 确保 type 字段存在
                });
              }
            });
          }
        });
        return allResources;
      }
      
      // 显示选中资源类型的资源
      if (!devResources[currentResourceType]) return [];
      return devResources[currentResourceType].map(resource => ({
        ...resource,
        type: resource.type || currentResourceType // 确保 type 字段存在
      }));
    } catch (error) {
      console.error('Error filtering resources:', error);
      return [];
    }
  };

  // 添加新资源
  const addResource = (devType: string, resourceType: string, url: string, title: string) => {
    try {
      setResourceData(prevData => {
        const newData = { ...prevData };
        
        if (!newData[devType]) {
          newData[devType] = {};
        }
        
        if (!newData[devType][resourceType]) {
          newData[devType][resourceType] = [];
        }
        
        const newResource: ResourceItem = {
          url,
          title,
          addedAt: new Date().toISOString(),
          type: resourceType // 确保设置 type 字段
        };
        
        newData[devType][resourceType].push(newResource);
        
        // 保存到 localStorage
        localStorage.setItem('resourceData', JSON.stringify(newData));
        
        return newData;
      });
    } catch (error) {
      console.error('Error adding resource:', error);
      alert('添加资源失败，请重试');
    }
  };

  // 删除资源
  const deleteResource = (devType: string, resourceType: string, index: number) => {
    try {
      setResourceData(prevData => {
        const newData = { ...prevData };
        
        if (newData[devType]?.[resourceType]) {
            newData[devType][resourceType].splice(index, 1);
            
            // 清理空数组
            if (newData[devType][resourceType].length === 0) {
              delete newData[devType][resourceType];
            }
            
            // 清理空对象
            if (Object.keys(newData[devType]).length === 0) {
              delete newData[devType];
            }
            
            // 保存到 localStorage
            localStorage.setItem('resourceData', JSON.stringify(newData));
        }
        
        return newData;
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('删除资源失败，请重试');
    }
  };

  // 编辑资源
  const editResource = (devType: string, resourceType: string, resource: ResourceItem, editedData: { title: string; url: string }) => {
    try {
      setResourceData(prevData => {
        const newData = { ...prevData };
        
        if (newData[devType]?.[resourceType]) {
          const index = newData[devType][resourceType].findIndex(
            (item: ResourceItem) => 
              item.url === resource.url && 
              item.title === resource.title && 
              item.addedAt === resource.addedAt
          );
          
          if (index !== -1) {
            newData[devType][resourceType][index] = {
              ...newData[devType][resourceType][index],
              ...editedData
            };
            
            // 保存到 localStorage
            localStorage.setItem('resourceData', JSON.stringify(newData));
          }
        }
        
        return newData;
      });
    } catch (error) {
      console.error('Error editing resource:', error);
      alert('编辑资源失败，请重试');
    }
  };

  // 处理添加自定义类型
  const handleAddDevType = async (newType: DevTypeInfo) => {
    try {
      const updatedTypes = addCustomDevType(newType);
      setDevTypes(updatedTypes);
      setSelectedDevType(newType.id);
      setCurrentResourceType(null);
      setShowAddTypeForm(false);
      showNotification(
        <div className="flex items-center space-x-2 text-green-600">
          <i className="fas fa-check-circle"></i>
          <span>类型添加成功！</span>
        </div>
      );
    } catch (error) {
      console.error('Error adding custom dev type:', error);
      showNotification(
        <div className="flex items-center space-x-2 text-red-600">
          <i className="fas fa-exclamation-circle"></i>
          <span>添加类型失败，请重试</span>
        </div>
      );
    }
  };

  // 处理长按开始
  const handlePressStart = (type: DevTypeInfo) => {
    if (type.id === 'home') return; // 防止删除首页按钮
    
    const timer = setTimeout(() => {
      setTypeToDelete(type);
      setShowDeleteConfirm(true);
    }, 800); // 800ms 长按触发
    
    setPressTimer(timer);
  };

  // 处理长按结束
  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // 处理删除类型
  const handleDeleteType = (type: DevTypeInfo) => {
    try {
      // 只能删除自定义类型，预定义类型不能删除
      if (DEV_TYPES.some(t => t.id === type.id)) {
        showNotification(
          <div className="flex items-center space-x-2 text-yellow-600">
            <i className="fas fa-exclamation-triangle"></i>
            <span>预定义类型无法删除</span>
          </div>
        );
        setShowDeleteConfirm(false);
        setTypeToDelete(null);
        return;
      }
      
      // 使用 deleteCustomDevType 函数删除自定义类型
      const updatedTypes = deleteCustomDevType(type.id);
      
      // 更新状态
      setDevTypes(updatedTypes);
      
      // 如果删除的是当前选中的类型，清除选择
      if (selectedDevType === type.id) {
        setSelectedDevType(null);
        setCurrentResourceType(null);
      }
      
      // 清除该类型下的所有资源
      setResourceData(prev => {
        const newData = { ...prev };
        delete newData[type.id];
        localStorage.setItem('resourceData', JSON.stringify(newData));
        return newData;
      });
      
      // 关闭确认对话框
      setShowDeleteConfirm(false);
      setTypeToDelete(null);
      
      // 显示成功通知
      showNotification(
        <div className="flex items-center space-x-2 text-green-600">
          <i className="fas fa-check-circle"></i>
          <span>类型删除成功</span>
        </div>
      );
    } catch (error) {
      console.error('Error deleting type:', error);
      showNotification(
        <div className="flex items-center space-x-2 text-red-600">
          <i className="fas fa-exclamation-circle"></i>
          <span>删除类型失败，请重试</span>
        </div>
      );
    }
  };

  // 导出数据
  const handleExport = () => {
    try {
      const exportData = {
        resourceData,
        devTypes: devTypes.filter(type => type.id !== 'home'),
        exportDate: new Date().toISOString(),
        version: '0.1.0' // 添加版本号以便后续兼容性处理
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `dev-resources-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 显示成功通知
      showNotification(
        <div className="flex items-center space-x-2 text-green-600">
          <i className="fas fa-check-circle"></i>
          <span>数据导出成功！</span>
        </div>
      );
    } catch (error) {
      console.error('Export failed:', error);
      showNotification(
        <div className="flex items-center space-x-2 text-red-600">
          <i className="fas fa-exclamation-circle"></i>
          <span>导出失败，请重试</span>
        </div>
      );
    }
  };

  // 导入数据
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          // 验证数据结构
          if (!importedData.resourceData || !importedData.devTypes) {
            throw new Error('无效的数据格式');
          }

          // 验证版本兼容性
          if (importedData.version && importedData.version !== '0.1.0') {
            showNotification(
              <div className="flex items-center space-x-2 text-yellow-600">
                <i className="fas fa-exclamation-triangle"></i>
                <span>数据版本不同，可能会有兼容性问题</span>
              </div>
            );
          }

          // 合并数据而不是直接替换
          setResourceData(prevData => ({
            ...prevData,
            ...importedData.resourceData
          }));
          localStorage.setItem('resourceData', JSON.stringify({
            ...resourceData,
            ...importedData.resourceData
          }));
          
          // 合并开发类型
          const newDevTypes = [...DEV_TYPES];
          importedData.devTypes.forEach((importedType: DevTypeInfo) => {
            if (!newDevTypes.some(t => t.id === importedType.id)) {
              newDevTypes.push(importedType);
            }
          });
          setDevTypes(newDevTypes);
          localStorage.setItem('devTypes', JSON.stringify(newDevTypes));
          
          setShowExportDialog(false);
          showNotification(
            <div className="flex items-center space-x-2 text-green-600">
              <i className="fas fa-check-circle"></i>
              <span>数据导入成功！</span>
            </div>
          );
        } catch (error) {
          console.error('Import parsing failed:', error);
          showNotification(
            <div className="flex items-center space-x-2 text-red-600">
              <i className="fas fa-exclamation-circle"></i>
              <span>导入失败：数据格式不正确</span>
            </div>
          );
        }
      };

      reader.onerror = () => {
        showNotification(
          <div className="flex items-center space-x-2 text-red-600">
            <i className="fas fa-exclamation-circle"></i>
            <span>文件读取失败，请重试</span>
          </div>
        );
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Import failed:', error);
      showNotification(
        <div className="flex items-center space-x-2 text-red-600">
          <i className="fas fa-exclamation-circle"></i>
          <span>导入失败，请重试</span>
        </div>
      );
    }
  };

  // 显示通知
  const showNotification = (content: React.ReactNode) => {
    // 如果有正在显示的通知，先清除它
    if (activeNotification) {
      setIsNotificationExiting(true);
      setTimeout(() => {
        setActiveNotification(content);
        setIsNotificationExiting(false);
        startNotificationTimer();
      }, 300);
    } else {
      setActiveNotification(content);
      startNotificationTimer();
    }
  };

  const startNotificationTimer = () => {
    // 清除之前的定时器
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }

    // 设置新的定时器
    notificationTimerRef.current = setTimeout(() => {
      setIsNotificationExiting(true);
      setTimeout(() => {
        setActiveNotification(null);
        setIsNotificationExiting(false);
      }, 300);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  // 标题栏按钮点击处理
  const handleExportClick = () => {
    setShowExportDialog(true);
  };

  const handleThemeClick = () => {
    showNotification(
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <i className="fas fa-palette text-purple-500"></i>
          <span className="font-medium">主题设置</span>
        </div>
        <div className="text-sm text-gray-600">
          <p>自定义界面主题，包括：</p>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>背景图片样式</li>
            <li>界面配色方案</li>
            <li>卡片展示效果</li>
          </ul>
        </div>
      </div>
    );
  };

  const handleHelpClick = () => {
    showNotification(
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <i className="fas fa-lightbulb text-yellow-500"></i>
          <span className="font-medium">使用帮助</span>
        </div>
        <div className="text-sm text-gray-600">
          <p>快速上手指南：</p>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>点击右上角"添加资源"按钮添加新资源</li>
            <li>使用左侧栏管理资源分类</li>
            <li>资源卡片支持快速编辑和删除</li>
          </ul>
        </div>
      </div>
    );
  };

  const handleAboutClick = () => {
    showNotification(
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <i className="fas fa-info-circle text-green-500"></i>
          <span className="font-medium">关于项目</span>
        </div>
        <div className="text-sm text-gray-600">
          <p>开发资源网址管理器 v0.1.0</p>
          <p className="mt-1">基于 React + TypeScript + Tailwind CSS 开发的现代化资源管理工具</p>
          <div className="mt-2 flex items-center space-x-3">
            <a href="https://github.com/vag-Zhao" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 flex items-center space-x-1">
              <i className="fab fa-github"></i>
              <span>GitHub</span>
            </a>
            <a href="mailto:zgs3344521@gmail.com" className="text-blue-500 hover:text-blue-600 flex items-center space-x-1">
              <i className="fas fa-bug"></i>
              <span>反馈问题</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="min-h-screen relative bg-gradient-to-br from-blue-50/90 via-purple-50/90 to-pink-50/90"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>

        {/* Unsplash 归属信息 */}
        {imageAuthor && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg z-20">
            Photo by{' '}
            <a
              href={`${imageAuthor.link}?utm_source=dev_resource_manager&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {imageAuthor.name}
            </a>
            {' '}on{' '}
            <a
              href="https://unsplash.com/?utm_source=dev_resource_manager&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Unsplash
            </a>
          </div>
        )}

        {/* 内容区域 */}
        <div className="relative z-10">
          <div className="container mx-auto px-4">
            {/* 固定标题栏 */}
            <header className="fixed top-0 left-0 right-0 z-20">
              <div className="bg-gradient-to-r from-white/50 via-white/60 to-white/50 shadow-[0_4px_20px_rgb(31,38,135,0.1)] backdrop-blur-xl border-b border-white/20">
                <div className="container mx-auto px-4">
                  <div className="flex items-center h-[4.5rem]">
                    <div className="relative group">
                      {/* 光晕效果 */}
                      <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-md opacity-25 group-hover:opacity-40 transition-all duration-1000 group-hover:duration-200 animate-pulse"></div>
                      
                      {/* 装饰元素 */}
                      <div className="absolute -left-8 -top-4 w-5 h-5 bg-blue-500/20 rounded-full blur-sm animate-float"></div>
                      <div className="absolute -right-6 -bottom-3 w-4 h-4 bg-purple-500/20 rounded-full blur-sm animate-float-delayed"></div>
                      
                      {/* 标题内容 */}
                      <div className="relative flex items-center space-x-4">
                        <i className="fas fa-code-branch text-2xl bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent transform transition-transform group-hover:rotate-180 duration-700"></i>
                        <div className="flex flex-col items-start space-y-1">
                          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 tracking-wide">
                            开发资源网址管理器
                          </h1>
                          <div className="text-xs text-gray-500 font-medium tracking-wider">
                            DEV RESOURCE MANAGER
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 可以在这里添加其他顶部导航元素 */}
                    <div className="flex-1"></div>
                    
                    {/* 右侧功能按钮组 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportClick}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/50 hover:bg-white/70 text-gray-600 transition-all duration-300 hover:shadow-md group"
                        title="数据管理"
                      >
                        <i className="fas fa-database text-lg bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300"></i>
                      </button>

                      <button
                        onClick={handleThemeClick}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/50 hover:bg-white/70 text-gray-600 transition-all duration-300 hover:shadow-md group"
                        title="主题设置"
                      >
                        <i className="fas fa-palette text-lg bg-gradient-to-br from-purple-500 to-pink-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300"></i>
                      </button>

                      <button
                        onClick={handleHelpClick}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/50 hover:bg-white/70 text-gray-600 transition-all duration-300 hover:shadow-md group"
                        title="使用帮助"
                      >
                        <i className="fas fa-lightbulb text-lg bg-gradient-to-br from-yellow-500 to-orange-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300"></i>
                      </button>

                      <button
                        onClick={handleAboutClick}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/50 hover:bg-white/70 text-gray-600 transition-all duration-300 hover:shadow-md group"
                        title="关于项目"
                      >
                        <i className="fas fa-info-circle text-lg bg-gradient-to-br from-green-500 to-teal-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* 主要内容区域 */}
            <div className="pt-24 pb-8">
              <div className="flex flex-col lg:flex-row relative max-w-[2000px] mx-auto">
                {/* 侧边栏 */}
                <div className="w-full lg:w-[min(20vw,320px)] flex-shrink-0">
                  <div className="lg:fixed lg:w-[min(20vw,320px)] bg-white/70 backdrop-blur-lg rounded-2xl p-4 shadow-lg transition-all hover:shadow-xl">
                    <nav className="space-y-2">
                      {/* README 跳转按钮 */}
                      <button
                        onClick={(e) => {
                          handleButtonClick(e);
                          setSelectedDevType(null);
                          setCurrentResourceType(null);
                        }}
                        className="relative overflow-hidden w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex items-center space-x-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 text-[0.95rem]"
                      >
                        <i className="fas fa-book-open w-5"></i>
                        <span>回到主页</span>
                      </button>

                      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 space-y-2">
                        {devTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={(e) => {
                              handleButtonClick(e);
                              setSelectedDevType(type.id);
                              setCurrentResourceType(null);
                            }}
                            onMouseDown={() => handlePressStart(type)}
                            onMouseUp={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            onTouchStart={() => handlePressStart(type)}
                            onTouchEnd={handlePressEnd}
                            className={`relative overflow-hidden w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex items-center space-x-3 hover:bg-blue-50/50 text-[0.95rem] ${
                              selectedDevType === type.id
                                ? 'bg-blue-100/50 text-blue-600 shadow-md'
                                : 'text-gray-600 hover:text-blue-600'
                            }`}
                          >
                            <i className={`fas ${type.icon} w-5`}></i>
                            <span>{type.name}</span>
                          </button>
                        ))}

                        {/* 添加类型按钮 */}
                        <button
                          onClick={(e) => {
                            handleButtonClick(e);
                            setShowAddTypeForm(true);
                          }}
                          className="relative overflow-hidden w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex items-center space-x-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 text-[0.95rem]"
                        >
                          <i className="fas fa-plus w-5"></i>
                          <span>添加类型</span>
                        </button>
                      </div>
                    </nav>
                  </div>
                </div>

                {/* 主内容区 */}
                <div className="flex-1 lg:pl-6 mt-4 lg:mt-0">
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-5 shadow-lg transition-all hover:shadow-xl">
                    {selectedDevType ? (
                      <div className="space-y-5">
                        <div className="flex justify-between items-center animate-title">
                          <h2 className="text-xl font-semibold text-gray-800">
                            {getAllDevTypes().find(t => t.id === selectedDevType)?.name || '资源列表'}
                          </h2>
                          <button
                            onClick={() => setShowAddForm(true)}
                            className="px-3 py-1.5 bg-blue-500/90 hover:bg-blue-600/90 text-white rounded-lg shadow transition-all duration-500 ease-in-out transform hover:scale-[1.02] hover:shadow-lg flex items-center space-x-2 active:scale-95 text-[0.95rem]"
                          >
                            <i className="fas fa-plus transition-transform duration-500 group-hover:rotate-90"></i>
                            <span className="transition-all duration-500">添加资源</span>
                          </button>
                        </div>

                        {/* 资源类型标签 */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {getResourceTypes().map((type, index) => (
                            <button
                              key={type.id}
                              onClick={() => setCurrentResourceType(currentResourceType === type.id ? null : type.id)}
                              className={`px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center space-x-2 animate-list-item text-[0.95rem] ${
                                currentResourceType === type.id
                                  ? 'bg-blue-100/70 text-blue-600 shadow-md'
                                  : 'bg-gray-100/50 text-gray-600 hover:bg-blue-50/50 hover:text-blue-600'
                              }`}
                              style={{
                                animationDelay: `${index * 50}ms`
                              }}
                            >
                              <i className={`fas ${type.icon}`}></i>
                              <span>{type.name}</span>
                            </button>
                          ))}
                        </div>

                        {/* 资源卡片列表 - 移除动画效果 */}
                        <div className="space-y-4">
                          {getFilteredResources().map((resource, index) => (
                            <div
                              key={`${resource.url}-${index}`}
                              className="transform transition-all duration-300 hover:scale-[1.01]"
                            >
                              <ResourceCard
                                {...resource}
                                onDelete={() => {
                                  if (selectedDevType && resource.type) {
                                    deleteResource(selectedDevType, resource.type, index);
                                  }
                                }}
                                onEdit={(editedData) => {
                                  if (selectedDevType && resource.type) {
                                    editResource(selectedDevType, resource.type, resource, editedData);
                                  }
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
                        <div className="flex items-center space-x-3 text-gray-600">
                          <i className="fas fa-book text-2xl text-blue-500"></i>
                          <h2 className="text-xl font-medium">开发资源网址管理器</h2>
                        </div>
                        
                        <div className="w-full max-w-4xl space-y-8 animate-slide-up">
                          {/* 项目简介 */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <i className="fas fa-info-circle text-2xl text-blue-500"></i>
                              <h3 className="text-lg font-semibold text-gray-800">项目简介</h3>
                            </div>
                            <div className="space-y-4 text-gray-600">
                              <p className="leading-relaxed">
                                这是一个基于 React + TypeScript + Tailwind CSS 开发的现代化资源管理工具，专为开发者设计。它提供了直观的界面和强大的功能，帮助你高效地组织和管理各类开发资源。
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-sm">React 18</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-sm">TypeScript 5</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-sm">Tailwind CSS 3</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-sm">Vite</span>
                              </div>
                            </div>
                          </div>

                          {/* 快速开始 */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <i className="fas fa-play text-2xl text-green-500"></i>
                              <h3 className="text-lg font-semibold text-gray-800">快速开始</h3>
                            </div>
                            <div className="space-y-4">
                              <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-white">
                                <div className="space-y-2">
                                  <p># 安装依赖</p>
                                  <p className="text-gray-400">npm install</p>
                                  <p># 启动开发服务器</p>
                                  <p className="text-gray-400">npm run dev</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 项目架构 */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <i className="fas fa-layer-group text-2xl text-purple-500"></i>
                              <h3 className="text-lg font-semibold text-gray-800">项目架构</h3>
                            </div>
                            <div className="space-y-4">
                              <div className="bg-white/50 rounded-lg p-4 font-mono text-sm">
                                <pre className="text-gray-600">
{`src/
├── components/       # 组件目录
│   ├── ResourceCard     # 资源卡片组件
│   ├── AddResourceForm  # 添加资源表单
│   └── AddDevTypeForm   # 添加类型表单
├── types/           # TypeScript 类型定义
├── utils/          # 工具函数
│   └── unsplash.ts    # Unsplash API 集成
├── hooks/          # 自定义 Hooks
├── App.tsx         # 主应用组件
└── main.tsx        # 应用入口`}
                                </pre>
                              </div>
                            </div>
                          </div>

                          {/* 核心功能实现 */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <i className="fas fa-code text-2xl text-indigo-500"></i>
                              <h3 className="text-lg font-semibold text-gray-800">核心功能实现</h3>
                            </div>
                            <div className="space-y-4 text-gray-600">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium">状态管理</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>使用 React Hooks 管理应用状态</li>
                                    <li>localStorage 实现数据持久化</li>
                                    <li>自定义 Hooks 封装业务逻辑</li>
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium">UI 实现</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>Tailwind CSS 实现响应式设计</li>
                                    <li>CSS Grid 实现布局系统</li>
                                    <li>自定义动画和过渡效果</li>
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium">性能优化</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>组件懒加载</li>
                                    <li>列表虚拟化</li>
                                    <li>图片资源缓存</li>
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium">用户体验</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>流畅的动画效果</li>
                                    <li>直观的操作反馈</li>
                                    <li>优雅的错误处理</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 使用说明 */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <i className="fas fa-book-reader text-2xl text-yellow-500"></i>
                              <h3 className="text-lg font-semibold text-gray-800">使用说明</h3>
                            </div>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <h4 className="font-medium flex items-center space-x-2">
                                    <i className="fas fa-folder-plus text-blue-500"></i>
                                    <span>资源管理</span>
                                  </h4>
                                  <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-start space-x-2">
                                      <i className="fas fa-check text-green-500 mt-1"></i>
                                      <span>点击右上角"添加资源"按钮创建新资源</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                      <i className="fas fa-check text-green-500 mt-1"></i>
                                      <span>单击资源卡片进入编辑模式</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                      <i className="fas fa-check text-green-500 mt-1"></i>
                                      <span>使用资源卡片上的快捷按钮进行操作</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="font-medium flex items-center space-x-2">
                                    <i className="fas fa-tags text-purple-500"></i>
                                    <span>类型管理</span>
                                  </h4>
                                  <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-start space-x-2">
                                      <i className="fas fa-check text-green-500 mt-1"></i>+
                                      <span>点击左侧"添加类型"创建新的资源类型</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                      <i className="fas fa-check text-green-500 mt-1"></i>
                                      <span>长按类型按钮可以删除该类型</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                      <i className="fas fa-check text-green-500 mt-1"></i>
                                      <span>点击类型标签筛选特定类型的资源</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 开发计划 */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <i className="fas fa-tasks text-2xl text-pink-500"></i>
                              <h3 className="text-lg font-semibold text-gray-800">开发计划</h3>
                            </div>
                            <div className="space-y-2 text-gray-600">
                              <div className="flex items-center space-x-2">
                                <i className="far fa-square text-gray-400"></i>
                                <span>支持导入/导出数据功能</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <i className="far fa-square text-gray-400"></i>
                                <span>添加资源分享功能</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <i className="far fa-square text-gray-400"></i>
                                <span>支持更多自定义主题</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <i className="far fa-square text-gray-400"></i>
                                <span>添加资源标签系统</span>
                              </div>
                            </div>
                          </div>

                          {/* 贡献指南 */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <i className="fas fa-hands-helping text-2xl text-green-500"></i>
                              <h3 className="text-lg font-semibold text-gray-800">贡献指南</h3>
                            </div>
                            <div className="prose prose-sm text-gray-600">
                              <p>欢迎贡献代码或提出建议！请遵循以下步骤：</p>
                              <ol className="list-decimal list-inside space-y-2 mt-2">
                                <li>Fork 本仓库</li>
                                <li>创建特性分支</li>
                                <li>提交变更</li>
                                <li>推送到分支</li>
                                <li>创建 Pull Request</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 通知区域 */}
        {activeNotification && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={isNotificationExiting ? 'notification-out' : 'notification-in'}>
              <div className="bg-white/70 backdrop-blur-lg rounded-xl p-4 shadow-lg transition-all hover:shadow-xl border border-gray-100/50">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 text-gray-700">{activeNotification}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 添加资源表单 */}
      {showAddForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center hide-scrollbar">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddForm(false)}></div>
          <div className="relative bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl z-10 w-full max-w-2xl m-4 animate-dialog-enter overflow-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">添加新资源</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <AddResourceForm
              onAdd={(devType, resourceType, url, title) => {
                addResource(devType, resourceType, url, title);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
              initialDevType={selectedDevType || undefined}
            />
          </div>
        </div>
      )}

      {/* 添加类型表单 */}
      {showAddTypeForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center hide-scrollbar">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddTypeForm(false)}></div>
          <div className="relative bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl z-10 w-full max-w-2xl m-4 animate-dialog-enter overflow-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">添加新类型</h2>
              <button
                onClick={() => setShowAddTypeForm(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <AddDevTypeForm
              onAdd={(newType) => {
                handleAddDevType(newType);
                setShowAddTypeForm(false);
              }}
              onCancel={() => setShowAddTypeForm(false)}
            />
          </div>
        </div>
      )}

      {/* 导入/导出对话框 */}
      {showExportDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center hide-scrollbar">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExportDialog(false)}></div>
          <div className="relative bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl z-10 w-full max-w-2xl m-4 animate-dialog-enter overflow-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">数据管理</h2>
              <button
                onClick={() => setShowExportDialog(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-6 hide-scrollbar">
              {/* 导出部分 */}
              <div className="p-4 bg-blue-50/50 rounded-xl space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-download text-blue-600 text-lg"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">导出数据</h3>
                    <p className="text-sm text-gray-600">将当前的所有资源数据导出为备份文件</p>
                  </div>
                </div>
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2.5 bg-blue-500/90 hover:bg-blue-600/90 text-white rounded-xl shadow transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2 text-sm"
                >
                  <i className="fas fa-download"></i>
                  <span>导出为 JSON 文件</span>
                </button>
              </div>

              {/* 导入部分 */}
              <div className="p-4 bg-green-50/50 rounded-xl space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-upload text-green-600 text-lg"></i>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">导入数据</h3>
                    <p className="text-sm text-gray-600">从备份文件中恢复资源数据</p>
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 text-sm text-gray-600 space-y-2">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                    <div>
                      <p className="text-gray-700">导入说明：</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>支持从之前导出的 JSON 文件导入</li>
                        <li>导入数据会与现有数据智能合并</li>
                        <li>重复的资源会被自动处理</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <label
                  htmlFor="import-file"
                  className="w-full px-4 py-2.5 bg-green-500/90 hover:bg-green-600/90 text-white rounded-xl shadow transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <i className="fas fa-upload"></i>
                  <span>选择文件导入</span>
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主题设置对话框 */}
      {showThemeDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center hide-scrollbar">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowThemeDialog(false)}></div>
          <div className="relative bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl z-10 w-full max-w-2xl m-4 animate-dialog-enter overflow-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">主题设置</h2>
              <button
                onClick={() => setShowThemeDialog(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4 hide-scrollbar">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-palette text-purple-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">自定义主题</h3>
                  <p className="text-sm text-gray-600">选择您喜欢的主题颜色</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {/* 主题选项 */}
                <button
                  onClick={() => setShowThemeDialog(false)}
                  className="w-full h-12 rounded-lg bg-white shadow-md flex items-center justify-center text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  <i className="fas fa-sun text-lg"></i>
                </button>
                <button
                  onClick={() => setShowThemeDialog(false)}
                  className="w-full h-12 rounded-lg bg-gray-800 shadow-md flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                >
                  <i className="fas fa-moon text-lg"></i>
                </button>
                <button
                  onClick={() => setShowThemeDialog(false)}
                  className="w-full h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md flex items-center justify-center text-white hover:from-blue-600 hover:to-purple-700 transition-colors"
                >
                  <i className="fas fa-paint-brush text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用帮助对话框 */}
      {showHelpDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center hide-scrollbar">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHelpDialog(false)}></div>
          <div className="relative bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl z-10 w-full max-w-2xl m-4 animate-dialog-enter overflow-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">使用帮助</h2>
              <button
                onClick={() => setShowHelpDialog(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4 hide-scrollbar">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-lightbulb text-yellow-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">快速上手</h3>
                  <p className="text-sm text-gray-600">了解如何使用本应用</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <i className="fas fa-check text-green-500 mt-1"></i>
                  <span>点击左侧栏选择开发类型</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 关于项目对话框 */}
      {showAboutDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center hide-scrollbar">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAboutDialog(false)}></div>
          <div className="relative bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl z-10 w-full max-w-2xl m-4 animate-dialog-enter overflow-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">关于项目</h2>
              <button
                onClick={() => setShowAboutDialog(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4 hide-scrollbar">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-info-circle text-green-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">项目信息</h3>
                  <p className="text-sm text-gray-600">了解本项目的详细信息</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <i className="fas fa-code-branch text-lg text-blue-500"></i>
                  <span>版本号：1.0.0</span>
                </div>
                <div className="flex items-start space-x-2">
                  <i className="fas fa-code text-lg text-purple-500"></i>
                  <span>技术栈：React 18 + TypeScript + Tailwind CSS</span>
                </div>
                <div className="flex items-start space-x-2">
                  <i className="fab fa-github text-lg text-gray-700"></i>
                  <a
                    href="https://github.com/vag-Zhao"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    GitHub 仓库
                  </a>
                </div>
                <div className="flex items-start space-x-2">
                  <i className="fas fa-bug text-lg text-red-500"></i>
                  <a
                    href="mailto:zgs3344521@gmail.com"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    反馈问题
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && typeToDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center hide-scrollbar">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="relative bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl z-10 w-full max-w-2xl m-4 animate-dialog-enter overflow-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">删除确认</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4 hide-scrollbar">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-600 text-lg"></i>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">确认删除</h3>
                  <p className="text-sm text-gray-600">您确定要删除此类型吗？</p>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg shadow transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteType(typeToDelete)}
                  className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;