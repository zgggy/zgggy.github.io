// 性能监控器 - 实时监控页面性能
class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.memory = {};
        this.loadTime = performance.now();
        this.visible = false;
        this.createMonitorElement();
    }

    // 创建监控元素
    createMonitorElement() {
        this.monitorElement = document.createElement('div');
        this.monitorElement.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(this.monitorElement);

        // 添加切换显示的快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12') {
                this.toggleVisibility();
            }
        });
    }

    // 切换监控面板显示
    toggleVisibility() {
        this.visible = !this.visible;
        this.monitorElement.style.display = this.visible ? 'block' : 'none';
    }

    // 更新性能数据
    update() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
            
            // 记录内存使用
            if (performance.memory) {
                this.memory = {
                    used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
                    total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
                    limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
                };
            }
            
            // 更新显示
            if (this.visible) {
                this.updateDisplay();
            }
        }
    }

    // 更新显示
    updateDisplay() {
        const uptime = ((performance.now() - this.loadTime) / 1000).toFixed(1);
        this.monitorElement.innerHTML = `
            <div>FPS: ${this.fps}</div>
            <div>Uptime: ${uptime}s</div>
            ${this.memory.used ? `
            <div>Memory:</div>
            <div>  Used: ${this.memory.used} MB</div>
            <div>  Total: ${this.memory.total} MB</div>
            <div>  Limit: ${this.memory.limit} MB</div>
            ` : ''}
            <div>Press F12 to toggle</div>
        `;
    }

    // 获取性能统计
    getStats() {
        return {
            fps: this.fps,
            memory: this.memory,
            uptime: ((performance.now() - this.loadTime) / 1000).toFixed(1)
        };
    }

    // 开始监控
    start() {
        const animate = () => {
            this.update();
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// 全局实例
const performanceMonitor = new PerformanceMonitor();

// 页面加载完成后开始监控
window.addEventListener('DOMContentLoaded', () => {
    performanceMonitor.start();
});
