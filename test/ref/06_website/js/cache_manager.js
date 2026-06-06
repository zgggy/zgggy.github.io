// 缓存管理器 - 缓存算法计算结果和静态资源
class CacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.storageCache = null;
        this.initStorage();
    }

    // 初始化 localStorage
    initStorage() {
        try {
            if (typeof localStorage !== 'undefined') {
                this.storageCache = localStorage;
            }
        } catch (error) {
            console.warn('localStorage not available:', error);
        }
    }

    // 内存缓存
    setMemory(key, value, expiry = 300000) { // 默认 5 分钟过期
        this.memoryCache.set(key, {
            value: value,
            expiry: Date.now() + expiry,
            timestamp: Date.now()
        });
    }

    getMemory(key) {
        const item = this.memoryCache.get(key);
        if (!item) return null;

        // 检查是否过期
        if (Date.now() > item.expiry) {
            this.memoryCache.delete(key);
            return null;
        }

        return item.value;
    }

    deleteMemory(key) {
        this.memoryCache.delete(key);
    }

    clearMemory() {
        this.memoryCache.clear();
    }

    // 本地存储缓存
    setStorage(key, value, expiry = 86400000) { // 默认 1 天过期
        if (!this.storageCache) return false;

        try {
            const item = {
                value: value,
                expiry: Date.now() + expiry,
                timestamp: Date.now()
            };
            this.storageCache.setItem(key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.warn('Failed to set storage:', error);
            return false;
        }
    }

    getStorage(key) {
        if (!this.storageCache) return null;

        try {
            const itemStr = this.storageCache.getItem(key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            
            // 检查是否过期
            if (Date.now() > item.expiry) {
                this.storageCache.removeItem(key);
                return null;
            }

            return item.value;
        } catch (error) {
            console.warn('Failed to get storage:', error);
            return null;
        }
    }

    deleteStorage(key) {
        if (!this.storageCache) return false;

        try {
            this.storageCache.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Failed to delete storage:', error);
            return false;
        }
    }

    clearStorage() {
        if (!this.storageCache) return false;

        try {
            this.storageCache.clear();
            return true;
        } catch (error) {
            console.warn('Failed to clear storage:', error);
            return false;
        }
    }

    // 缓存算法计算结果
    cacheAlgorithmResult(algorithm, params, result) {
        const key = `algorithm_${algorithm}_${JSON.stringify(params)}`;
        this.setMemory(key, result, 60000); // 算法结果缓存 1 分钟
        this.setStorage(key, result, 3600000); // 本地存储缓存 1 小时
    }

    getAlgorithmResult(algorithm, params) {
        const key = `algorithm_${algorithm}_${JSON.stringify(params)}`;
        // 先从内存缓存获取
        let result = this.getMemory(key);
        if (result) return result;
        // 再从本地存储获取
        return this.getStorage(key);
    }

    // 缓存静态资源
    cacheResource(url, data) {
        const key = `resource_${url}`;
        this.setStorage(key, data, 86400000); // 静态资源缓存 1 天
    }

    getResource(url) {
        const key = `resource_${url}`;
        return this.getStorage(key);
    }

    // 清理过期缓存
    cleanup() {
        // 清理内存缓存
        const now = Date.now();
        for (const [key, item] of this.memoryCache.entries()) {
            if (now > item.expiry) {
                this.memoryCache.delete(key);
            }
        }

        // 清理本地存储
        if (this.storageCache) {
            try {
                for (let i = 0; i < this.storageCache.length; i++) {
                    const key = this.storageCache.key(i);
                    if (key) {
                        const itemStr = this.storageCache.getItem(key);
                        if (itemStr) {
                            try {
                                const item = JSON.parse(itemStr);
                                if (now > item.expiry) {
                                    this.storageCache.removeItem(key);
                                    i--; // 调整索引
                                }
                            } catch (error) {
                                // 无效的 JSON，删除
                                this.storageCache.removeItem(key);
                                i--; // 调整索引
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to cleanup storage:', error);
            }
        }
    }

    // 获取缓存统计
    getStats() {
        return {
            memoryCacheSize: this.memoryCache.size,
            storageCacheSize: this.storageCache ? this.storageCache.length : 0
        };
    }
}

// 全局实例
const cacheManager = new CacheManager();

// 定期清理过期缓存
setInterval(() => {
    cacheManager.cleanup();
}, 60000); // 每分钟清理一次
