// 资源项接口
export interface ResourceItem {
  url: string;
  title: string;
  addedAt: string;
  type: string;
  imageUrl?: string;
}

// 资源类型映射
export interface ResourceTypeMap {
  [resourceType: string]: ResourceItem[];
}

// 开发类型映射
export interface ResourceData {
  [devType: string]: ResourceTypeMap;
}

// 资源类型定义
export interface ResourceType {
  id: string;
  name: string;
  icon: string;
}

// 开发类型定义
export interface DevTypeInfo {
  id: DevType;
  name: string;
  icon: string;
  resourceTypes: ResourceType[];
}

export type DevType = string;

// 通用素材类型
export const COMMON_RESOURCE_TYPES = [
  { id: 'fonts', name: '字体资源', icon: 'fa-font' },
  { id: 'images', name: '图片素材', icon: 'fa-images' },
  { id: 'icons', name: '图标资源', icon: 'fa-icons' },
  { id: 'music', name: '音频素材', icon: 'fa-music' },
  { id: 'videos', name: '视频素材', icon: 'fa-video' },
  { id: 'colors', name: '配色方案', icon: 'fa-palette' },
  { id: 'animations', name: '动画资源', icon: 'fa-film' },
  { id: 'other', name: '其他素材', icon: 'fa-shapes' }
];

// 开发相关资源类型
export const DEV_RESOURCE_TYPES = [
  { id: 'libraries', name: '开发库', icon: 'fa-book' },
  { id: 'frameworks', name: '框架', icon: 'fa-layer-group' },
  { id: 'tools', name: '开发工具', icon: 'fa-wrench' },
  { id: 'tutorials', name: '教程文档', icon: 'fa-book-open' },
  { id: 'apis', name: 'API文档', icon: 'fa-plug' },
  { id: 'rules', name: '开发规则', icon: 'fa-list-check' },
  { id: 'templates', name: '项目模板', icon: 'fa-copy' },
  { id: 'packages', name: '依赖包', icon: 'fa-box' },
  { id: 'other', name: '其他资源', icon: 'fa-circle-plus' }
];

// 预定义的开发类型
export const DEV_TYPES: DevTypeInfo[] = [
  {
    id: 'common',
    name: '通用素材',
    icon: 'fa-shapes',
    resourceTypes: [
      { id: 'fonts', name: '字体资源', icon: 'fa-font' },
      { id: 'images', name: '图片素材', icon: 'fa-images' },
      { id: 'icons', name: '图标资源', icon: 'fa-icons' },
      { id: 'music', name: '音频素材', icon: 'fa-music' },
      { id: 'videos', name: '视频素材', icon: 'fa-video' },
      { id: 'colors', name: '配色方案', icon: 'fa-palette' },
      { id: 'animations', name: '动画资源', icon: 'fa-film' },
    ]
  },
  {
    id: 'frontend',
    name: '前端开发',
    icon: 'fa-code',
    resourceTypes: [
      { id: 'libraries', name: '开发库', icon: 'fa-book' },
      { id: 'frameworks', name: '框架', icon: 'fa-layer-group' },
      { id: 'tools', name: '开发工具', icon: 'fa-tools' },
      { id: 'tutorials', name: '教程文档', icon: 'fa-book-reader' },
    ]
  },
  {
    id: 'backend',
    name: '后端开发',
    icon: 'fa-server',
    resourceTypes: [
      { id: 'libraries', name: '开发库', icon: 'fa-book' },
      { id: 'frameworks', name: '框架', icon: 'fa-layer-group' },
      { id: 'tools', name: '开发工具', icon: 'fa-tools' },
      { id: 'apis', name: 'API文档', icon: 'fa-file-code' },
    ]
  },
  {
    id: 'mobile',
    name: '移动开发',
    icon: 'fa-mobile-alt',
    resourceTypes: [
      { id: 'libraries', name: '开发库', icon: 'fa-book' },
      { id: 'frameworks', name: '框架', icon: 'fa-layer-group' },
      { id: 'tools', name: '开发工具', icon: 'fa-tools' },
      { id: 'tutorials', name: '教程文档', icon: 'fa-book-reader' },
    ]
  },
  {
    id: 'desktop',
    name: '桌面开发',
    icon: 'fa-desktop',
    resourceTypes: [
      { id: 'libraries', name: '开发库', icon: 'fa-book' },
      { id: 'frameworks', name: '框架', icon: 'fa-layer-group' },
      { id: 'tools', name: '开发工具', icon: 'fa-tools' },
      { id: 'tutorials', name: '教程文档', icon: 'fa-book-reader' },
    ]
  }
];

// 自定义类型存储键名
export const CUSTOM_DEV_TYPES_KEY = 'customDevTypes';

// 获取所有开发类型（包括预定义和自定义）
export function getAllDevTypes(): DevTypeInfo[] {
  try {
    const savedCustomTypes = localStorage.getItem(CUSTOM_DEV_TYPES_KEY);
    const customTypes = savedCustomTypes ? JSON.parse(savedCustomTypes) : [];
    return [...DEV_TYPES, ...customTypes];
  } catch (error) {
    console.error('Error loading custom dev types:', error);
    return DEV_TYPES;
  }
}

// 添加自定义开发类型
export function addCustomDevType(newType: DevTypeInfo): DevTypeInfo[] {
  try {
    const currentTypes = getAllDevTypes();
    // 检查 ID 是否已存在
    if (currentTypes.some(type => type.id === newType.id)) {
      throw new Error('类型ID已存在');
    }
    
    const savedCustomTypes = localStorage.getItem(CUSTOM_DEV_TYPES_KEY);
    const customTypes = savedCustomTypes ? JSON.parse(savedCustomTypes) : [];
    
    // 添加新类型
    customTypes.push(newType);
    localStorage.setItem(CUSTOM_DEV_TYPES_KEY, JSON.stringify(customTypes));
    
    return [...DEV_TYPES, ...customTypes];
  } catch (error) {
    console.error('Error adding custom dev type:', error);
    throw error;
  }
}

// 删除自定义开发类型
export function deleteCustomDevType(typeId: string): DevTypeInfo[] {
  try {
    const savedCustomTypes = localStorage.getItem(CUSTOM_DEV_TYPES_KEY);
    let customTypes = savedCustomTypes ? JSON.parse(savedCustomTypes) : [];
    
    // 过滤掉要删除的类型
    customTypes = customTypes.filter((type: DevTypeInfo) => type.id !== typeId);
    localStorage.setItem(CUSTOM_DEV_TYPES_KEY, JSON.stringify(customTypes));
    
    return [...DEV_TYPES, ...customTypes];
  } catch (error) {
    console.error('Error deleting custom dev type:', error);
    throw error;
  }
} 