// 目标聚类可视化模块 - DBSCAN算法
class ClusteringVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // 配置参数
        this.points = []; // 点集合
        this.clusters = []; // 聚类结果
        this.noise = []; // 噪声点
        
        // DBSCAN参数 - 调整以减少噪声点
        this.eps = 40; // 增大半径
        this.minPts = 2; // 减少最小点数
        
        // 鼠标交互
        this.mousePos = { x: -1000, y: -1000 }; // 初始位置在画布外
        this.mouseRange = 50; // 鼠标影响范围
        
        // 颜色配置
        this.colors = [
            '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
            '#f44336', '#795548', '#607D8B', '#E91E63',
            '#00BCD4', '#FFC107', '#8BC34A', '#3F51B5'
        ];
        
        // 初始化
        this.initPoints();
        this.setupEventListeners();
        this.startAnimation();
    }
    
    // 初始化随机点
    initPoints() {
        const pointCount = 50;
        for (let i = 0; i < pointCount; i++) {
            // 生成随机点
            const x = Math.random() * (this.width - 40) + 20;
            const y = Math.random() * (this.height - 40) + 20;
            this.points.push({ x, y, cluster: -1 });
        }
        this.runDBSCAN();
    }
    
    // 设置事件监听器
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    }
    
    // 处理鼠标移动
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        // 计算鼠标在canvas中的实际坐标，考虑canvas的缩放
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.mousePos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
        // 实时更新聚类，添加动画效果
        this.runDBSCAN();
    }
    
    // 处理点击事件 - 添加点
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        // 计算点击在canvas中的实际坐标，考虑canvas的缩放
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // 添加新点
        this.points.push({ x, y, cluster: -1 });
        this.runDBSCAN();
    }
    
    // 处理双击事件 - 删除点
    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        // 计算点击在canvas中的实际坐标，考虑canvas的缩放
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // 查找并删除点击位置的点
        for (let i = this.points.length - 1; i >= 0; i--) {
            const point = this.points[i];
            const distance = Math.sqrt(
                Math.pow(point.x - x, 2) + 
                Math.pow(point.y - y, 2)
            );
            if (distance < 10) {
                this.points.splice(i, 1);
                this.runDBSCAN();
                break;
            }
        }
    }
    
    // 处理鼠标离开事件
    handleMouseLeave(e) {
        // 将鼠标位置设置在画布外，这样所有点都会恢复到原始大小
        this.mousePos = { x: -1000, y: -1000 };
    }
    
    // 处理右键点击事件 - 删除点
    handleRightClick(e) {
        // 阻止右键菜单的默认行为
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        // 计算点击在canvas中的实际坐标，考虑canvas的缩放
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // 查找并删除点击位置的点
        for (let i = this.points.length - 1; i >= 0; i--) {
            const point = this.points[i];
            const distance = Math.sqrt(
                Math.pow(point.x - x, 2) + 
                Math.pow(point.y - y, 2)
            );
            if (distance < 10) {
                this.points.splice(i, 1);
                this.runDBSCAN();
                break;
            }
        }
    }
    
    // 运行DBSCAN算法
    runDBSCAN() {
        // 重置聚类
        for (let point of this.points) {
            point.cluster = -1; // -1 表示未分配
        }
        
        this.clusters = [];
        this.noise = [];
        
        let clusterId = 0;
        
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            if (point.cluster !== -1) continue; // 已分配
            
            const neighbors = this.getNeighbors(point);
            if (neighbors.length < this.minPts) {
                // 标记为噪声
                this.noise.push(point);
            } else {
                // 开始新聚类
                this.expandCluster(point, neighbors, clusterId);
                this.clusters.push({ id: clusterId, points: [] });
                clusterId++;
            }
        }
        
        // 为每个聚类收集点
        for (let point of this.points) {
            if (point.cluster !== -1) {
                if (this.clusters[point.cluster]) {
                    this.clusters[point.cluster].points.push(point);
                }
            }
        }
    }
    
    // 获取点的邻居
    getNeighbors(point) {
        const neighbors = [];
        for (let otherPoint of this.points) {
            if (point === otherPoint) continue;
            const distance = Math.sqrt(
                Math.pow(point.x - otherPoint.x, 2) + 
                Math.pow(point.y - otherPoint.y, 2)
            );
            if (distance <= this.eps) {
                neighbors.push(otherPoint);
            }
        }
        return neighbors;
    }
    
    // 扩展聚类
    expandCluster(point, neighbors, clusterId) {
        point.cluster = clusterId;
        
        let queue = [...neighbors];
        while (queue.length > 0) {
            const currentPoint = queue.shift();
            if (currentPoint.cluster === -1) {
                currentPoint.cluster = clusterId;
                const currentNeighbors = this.getNeighbors(currentPoint);
                if (currentNeighbors.length >= this.minPts) {
                    queue = [...queue, ...currentNeighbors];
                }
            }
        }
    }
    
    // 绘制
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制背景网格
        this.drawGrid();
        
        // 绘制噪声点
        this.ctx.fillStyle = '#cccccc';
        this.ctx.strokeStyle = '#999999';
        for (let point of this.noise) {
            // 检查是否在鼠标范围内
            const distance = Math.sqrt(
                Math.pow(point.x - this.mousePos.x, 2) + 
                Math.pow(point.y - this.mousePos.y, 2)
            );
            if (distance < this.mouseRange) {
                // 鼠标范围内的噪声点 - 放大但保持颜色
                this.drawPoint(point, 8, true);
            } else {
                // 普通噪声点
                this.drawPoint(point, 4, false);
            }
        }
        
        // 绘制聚类点
        for (let i = 0; i < this.clusters.length; i++) {
            const color = this.colors[i % this.colors.length];
            
            for (let point of this.points) {
                if (point.cluster === i) {
                    // 检查是否在鼠标范围内
                    const distance = Math.sqrt(
                        Math.pow(point.x - this.mousePos.x, 2) + 
                        Math.pow(point.y - this.mousePos.y, 2)
                    );
                    if (distance < this.mouseRange) {
                        // 鼠标范围内的聚类点 - 放大但保持颜色
                        this.ctx.fillStyle = color;
                        this.ctx.strokeStyle = this.darkenColor(color, 0.3);
                        this.drawPoint(point, 10, true);
                    } else {
                        // 普通聚类点
                        this.ctx.fillStyle = color;
                        this.ctx.strokeStyle = this.darkenColor(color, 0.3);
                        this.drawPoint(point, 6, false);
                    }
                }
            }
        }
    }
    
    // 绘制点
    drawPoint(point, size, isHovered) {
        // 添加动画效果 - 点的大小和透明度变化
        // 计算目标大小和当前大小的插值
        if (!point.currentSize) {
            point.currentSize = size;
        }
        // 平滑过渡到目标大小
        point.currentSize += (size - point.currentSize) * 0.2;
        
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, point.currentSize, 0, Math.PI * 2);
        this.ctx.fill();
        if (!isHovered) {
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        } else {
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    // 绘制网格
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;
        
        // 垂直线
        for (let x = 0; x <= this.width; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y <= this.height; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    // 颜色变暗
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        const newR = Math.max(0, Math.floor(r * (1 - factor)));
        const newG = Math.max(0, Math.floor(g * (1 - factor)));
        const newB = Math.max(0, Math.floor(b * (1 - factor)));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    // 开始动画
    startAnimation() {
        const self = this;
        function animate() {
            self.draw();
            requestAnimationFrame(animate);
        }
        animate();
    }
}

