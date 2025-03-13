// 注意：您需要在 .env 文件中设置您的 Unsplash Access Key
const UNSPLASH_API_URL = 'https://api.unsplash.com';

interface UnsplashPhoto {
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    download_location: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  id: string;
}

interface UnsplashOptions {
  query?: string;
  collections?: string;
  width?: number;
  height?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
}

function convertOptionsToParams(options: Record<string, any>): Record<string, string> {
  const params: Record<string, string> = {};
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params[key] = String(value);
    }
  });
  
  return params;
}

// 缓存key
const CACHE_KEY = 'unsplash_background_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

interface BackgroundImageResult {
  url: string;
  user: {
    name: string;
    link: string;
  };
}

interface CacheData {
  data: BackgroundImageResult;
  timestamp: number;
}

// 检查缓存是否有效
function isValidCache(cache: any): boolean {
  return (
    cache &&
    cache.timestamp &&
    Date.now() - cache.timestamp < CACHE_EXPIRY &&
    cache.data &&
    cache.data.url &&
    cache.data.user
  );
}

// 从缓存获取图片
function getCachedImage(): BackgroundImageResult | null {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      const parsedCache = JSON.parse(cache) as CacheData;
      if (isValidCache(parsedCache)) {
        return parsedCache.data;
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

// 缓存图片
function cacheImage(data: BackgroundImageResult): void {
  try {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching image:', error);
  }
}

// 记录下载
async function trackDownload(downloadLocation: string): Promise<void> {
  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID 3JygWzcuDIfTggNP_IuZnZgvO0w2VFABTl_bscl9O0Q`,
      },
    });
  } catch (error) {
    console.error('Error tracking download:', error);
  }
}

// 默认背景图片列表
const DEFAULT_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1557683311-eac922347aa1',
  'https://images.unsplash.com/photo-1557683316-973673baf926',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85'
];

/**
 * 获取背景图片
 * @param options 其他选项
 * @returns 背景图片URL
 */
export async function getBackgroundImage(options: UnsplashOptions = {}): Promise<BackgroundImageResult | null> {
  try {
    // 首先检查缓存
    const cachedImage = getCachedImage();
    if (cachedImage) {
      return cachedImage;
    }

    // 构建 API 请求参数
    const params = new URLSearchParams({
      client_id: '3JygWzcuDIfTggNP_IuZnZgvO0w2VFABTl_bscl9O0Q',
      ...(options.query && { query: options.query }),
      ...(options.orientation && { orientation: options.orientation }),
      ...(options.collections && { collections: options.collections }),
    });

    // 获取随机图片
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?${params.toString()}`,
      {
        headers: {
          Authorization: `Client-ID 3JygWzcuDIfTggNP_IuZnZgvO0w2VFABTl_bscl9O0Q`,
          'Accept-Version': 'v1',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image from Unsplash');
    }

    const image: UnsplashPhoto = await response.json();

    // 记录下载
    await trackDownload(image.links.download_location);

    // 构建返回结果
    const result: BackgroundImageResult = {
      url: image.urls.regular,
      user: {
        name: image.user.name,
        link: image.user.links.html
      }
    };

    // 缓存结果
    cacheImage(result);

    return result;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    
    // 如果 API 调用失败，返回默认背景之一
    const randomIndex = Math.floor(Math.random() * DEFAULT_BACKGROUNDS.length);
    return {
      url: DEFAULT_BACKGROUNDS[randomIndex],
      user: {
        name: 'Unsplash',
        link: 'https://unsplash.com'
      }
    };
  }
}

/**
 * 获取随机图片集合
 * @param count 图片数量
 * @param options 其他选项
 * @returns 图片URL数组
 */
export async function getRandomImages(count: number = 30, options: UnsplashOptions = {}) {
  try {
    const params = new URLSearchParams({
      client_id: '3JygWzcuDIfTggNP_IuZnZgvO0w2VFABTl_bscl9O0Q',
      count: count.toString(),
      orientation: options.orientation || 'landscape',
      ...(options.query ? { query: options.query } : {}),
      ...(options.collections ? { collections: options.collections } : {})
    });

    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?${params.toString()}`,
      {
        headers: {
          'Accept-Version': 'v1',
          'Authorization': `Client-ID 3JygWzcuDIfTggNP_IuZnZgvO0w2VFABTl_bscl9O0Q`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }

    const data: UnsplashPhoto[] = await response.json();
    return data.map(photo => photo.urls.regular);
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}

/**
 * 获取特定主题的Unsplash图片
 * @param category 图片类别
 * @param options 其他选项
 * @returns 图片URL
 */
export async function getUnsplashImageByCategory(
  category: string,
  options: UnsplashOptions = {}
): Promise<string> {
  try {
    const API_KEY = '3JygWzcuDIfTggNP_IuZnZgvO0w2VFABTl_bscl9O0Q';
    if (!API_KEY) {
      console.warn('Unsplash Access Key is not set. Using fallback image service.');
      return getFallbackImage(category);
    }

    const params = new URLSearchParams(
      convertOptionsToParams({
        query: category,
        client_id: API_KEY,
        ...options
      })
    );

    const response = await fetch(
      `https://api.unsplash.com/photos/random?${params.toString()}`,
      {
        headers: {
          'Accept-Version': 'v1',
          'Authorization': `Client-ID 3JygWzcuDIfTggNP_IuZnZgvO0w2VFABTl_bscl9O0Q`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image from Unsplash');
    }

    const data: UnsplashPhoto = await response.json();
    
    // 记录下载位置（Unsplash 要求）
    trackDownload(data.links.download_location).catch(console.error);
    
    return data.urls.regular;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    return getFallbackImage(category);
  }
}

/**
 * 获取备用图片（当 Unsplash API 不可用时）
 * @param query 搜索关键词
 * @returns 备用图片URL
 */
function getFallbackImage(query: string): string {
  // 使用 Lorem Picsum 作为备用服务
  return `https://picsum.photos/seed/${encodeURIComponent(query)}/800/600`;
} 