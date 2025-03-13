// 从环境变量中获取 Unsplash Access Key
export const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';

// 如果没有设置 API Key，给出警告
if (!UNSPLASH_ACCESS_KEY) {
  console.warn('警告: Unsplash API Key 未设置。请在 .env 文件中设置 VITE_UNSPLASH_ACCESS_KEY');
} 