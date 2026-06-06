// 资源加载器 - 实现按需加载和预加载
class ResourceLoader {
    constructor() {
        this.loaded = new Map();
        this.loading = new Map();
        this.queue = [];
    }

    // 加载脚本
    loadScript(url) {
        return new Promise((resolve, reject) => {
            // 已经加载过
            if (this.loaded.has(url)) {
                resolve(this.loaded.get(url));
                return;
            }

            // 正在加载中
            if (this.loading.has(url)) {
                this.loading.get(url).push({ resolve, reject });
                return;
            }

            // 开始加载
            this.loading.set(url, [{ resolve, reject }]);

            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => {
                const result = true;
                this.loaded.set(url, result);
                
                // 通知所有等待的Promise
                const callbacks = this.loading.get(url);
                callbacks.forEach(({ resolve }) => resolve(result));
                
                this.loading.delete(url);
            };
            script.onerror = (error) => {
                // 通知所有等待的Promise
                const callbacks = this.loading.get(url);
                callbacks.forEach(({ reject }) => reject(error));
                
                this.loading.delete(url);
            };
            document.head.appendChild(script);
        });
    }

    // 加载图片
    loadImage(url) {
        return new Promise((resolve, reject) => {
            // 已经加载过
            if (this.loaded.has(url)) {
                resolve(this.loaded.get(url));
                return;
            }

            // 正在加载中
            if (this.loading.has(url)) {
                this.loading.get(url).push({ resolve, reject });
                return;
            }

            // 开始加载
            this.loading.set(url, [{ resolve, reject }]);

            const img = new Image();
            img.src = url;
            img.onload = () => {
                this.loaded.set(url, img);
                
                // 通知所有等待的Promise
                const callbacks = this.loading.get(url);
                callbacks.forEach(({ resolve }) => resolve(img));
                
                this.loading.delete(url);
            };
            img.onerror = (error) => {
                // 通知所有等待的Promise
                const callbacks = this.loading.get(url);
                callbacks.forEach(({ reject }) => reject(error));
                
                this.loading.delete(url);
            };
        });
    }

    // 加载多个资源
    loadMultiple(resources) {
        const promises = resources.map(resource => {
            if (resource.type === 'script') {
                return this.loadScript(resource.url);
            } else if (resource.type === 'image') {
                return this.loadImage(resource.url);
            }
            return Promise.resolve();
        });
        return Promise.all(promises);
    }

    // 预加载资源
    preload(resources) {
        resources.forEach(resource => {
            if (resource.type === 'script') {
                this.loadScript(resource.url).catch(() => {
                    // 预加载失败不影响主流程
                });
            } else if (resource.type === 'image') {
                this.loadImage(resource.url).catch(() => {
                    // 预加载失败不影响主流程
                });
            }
        });
    }

    // 检查资源是否已加载
    isLoaded(url) {
        return this.loaded.has(url);
    }

    // 清除已加载的资源
    clear(url) {
        if (url) {
            this.loaded.delete(url);
        } else {
            this.loaded.clear();
        }
    }
}

// 全局实例
const resourceLoader = new ResourceLoader();
