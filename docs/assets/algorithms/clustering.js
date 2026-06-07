// 目标聚类可视化模块 - DBSCAN算法
class ClusteringVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.baseWidth = canvas.width;
        this.baseHeight = canvas.height;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        
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
        this.handleResize = () => this.resizeCanvas();
        
        // 初始化
        this.resizeCanvas();
        this.initPoints();
        this.setupEventListeners();
        this.startAnimation();
        window.addEventListener('resize', this.handleResize, { passive: true });
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.round(rect.width || this.baseWidth));
        const nextHeight = Math.max(1, Math.round(rect.height || this.baseHeight));
        const prevWidth = this.width || nextWidth;
        const prevHeight = this.height || nextHeight;
        const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

        this.canvas.width = Math.round(nextWidth * dpr);
        this.canvas.height = Math.round(nextHeight * dpr);
        this.width = nextWidth;
        this.height = nextHeight;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.imageSmoothingEnabled = true;

        if (prevWidth !== nextWidth || prevHeight !== nextHeight) {
            this.scaleSceneForResize(prevWidth, prevHeight);
        }
    }

    scaleSceneForResize(prevWidth, prevHeight) {
        if (!prevWidth || !prevHeight || !this.points.length) return;

        const scaleX = this.width / prevWidth;
        const scaleY = this.height / prevHeight;
        for (const point of this.points) {
            point.x *= scaleX;
            point.y *= scaleY;
        }
        this.mousePos.x *= scaleX;
        this.mousePos.y *= scaleY;
        this.runDBSCAN();
    }

    getCanvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
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
        this.mousePos = this.getCanvasPoint(e);
        // 实时更新聚类，添加动画效果
        this.runDBSCAN();
    }
    
    // 处理点击事件 - 添加点
    handleClick(e) {
        const { x, y } = this.getCanvasPoint(e);
        
        // 添加新点
        this.points.push({ x, y, cluster: -1 });
        this.runDBSCAN();
    }
    
    // 处理双击事件 - 删除点
    handleDoubleClick(e) {
        const { x, y } = this.getCanvasPoint(e);
        
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
        const { x, y } = this.getCanvasPoint(e);
        
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
        this.ctx.fillStyle = '#f7f7f7';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 绘制噪声点
        for (let point of this.noise) {
            const distance = Math.sqrt(
                Math.pow(point.x - this.mousePos.x, 2) + 
                Math.pow(point.y - this.mousePos.y, 2)
            );
            if (distance < this.mouseRange) {
                this.drawPoint(point, 8, 'noise');
            } else {
                this.drawPoint(point, 4, 'noise');
            }
        }
        
        // 绘制聚类点
        for (let i = 0; i < this.clusters.length; i++) {
            for (let point of this.points) {
                if (point.cluster === i) {
                    const distance = Math.sqrt(
                        Math.pow(point.x - this.mousePos.x, 2) + 
                        Math.pow(point.y - this.mousePos.y, 2)
                    );
                    if (distance < this.mouseRange) {
                        this.drawPoint(point, 10, i);
                    } else {
                        this.drawPoint(point, 6, i);
                    }
                }
            }
        }
    }
    
    // 绘制点
    drawPoint(point, size, clusterType) {
        if (!point.currentSize) {
            point.currentSize = size;
        }
        point.currentSize += (size - point.currentSize) * 0.2;

        const visual = this.getClusterVisual(clusterType);
        this.traceClusterShape(point.x, point.y, point.currentSize, clusterType);

        if (visual.hollow) {
            this.ctx.strokeStyle = visual.stroke;
            this.ctx.lineWidth = Math.max(1.5, point.currentSize * 0.35);
            this.ctx.stroke();
            return;
        }

        this.ctx.fillStyle = visual.fill;
        this.ctx.fill();
    }

    getClusterVisual(clusterType) {
        if (clusterType === 'noise') {
            return {
                hollow: false,
                fill: '#cfcfcf',
                stroke: '#9d9d9d'
            };
        }

        const hollow = clusterType % 2 === 1;
        return {
            hollow,
            fill: '#6a6a6a',
            stroke: '#6a6a6a'
        };
    }

    traceClusterShape(x, y, radius, clusterType) {
        if (clusterType === 'noise') {
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            return;
        }

        const normalizedType = clusterType % 5;

        if (normalizedType === 0) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            return;
        }

        if (normalizedType === 2) {
            this.traceRoundedRect(x, y, radius * 1.9, radius * 1.9, radius * 0.45);
            return;
        }

        const sides = normalizedType === 1 ? 3 : normalizedType === 3 ? 5 : 6;
        this.traceRoundedPolygon(x, y, radius * 1.2, sides, radius * 0.32, -Math.PI / 2);
    }

    traceRoundedRect(centerX, centerY, width, height, radius) {
        const x = centerX - width / 2;
        const y = centerY - height / 2;
        const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

        this.ctx.beginPath();
        this.ctx.moveTo(x + safeRadius, y);
        this.ctx.lineTo(x + width - safeRadius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
        this.ctx.lineTo(x + width, y + height - safeRadius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
        this.ctx.lineTo(x + safeRadius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
        this.ctx.lineTo(x, y + safeRadius);
        this.ctx.quadraticCurveTo(x, y, x + safeRadius, y);
        this.ctx.closePath();
    }

    traceRoundedPolygon(centerX, centerY, radius, sides, cornerRadius, rotation = 0) {
        const vertices = [];
        for (let i = 0; i < sides; i++) {
            const angle = rotation + (Math.PI * 2 * i) / sides;
            vertices.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }

        const maxCornerRadius = radius * 0.45;
        const safeCornerRadius = Math.max(0, Math.min(cornerRadius, maxCornerRadius));

        this.ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const prev = vertices[(i - 1 + sides) % sides];
            const current = vertices[i];
            const next = vertices[(i + 1) % sides];

            const prevDx = prev.x - current.x;
            const prevDy = prev.y - current.y;
            const nextDx = next.x - current.x;
            const nextDy = next.y - current.y;
            const prevLength = Math.hypot(prevDx, prevDy) || 1;
            const nextLength = Math.hypot(nextDx, nextDy) || 1;

            const startX = current.x + (prevDx / prevLength) * safeCornerRadius;
            const startY = current.y + (prevDy / prevLength) * safeCornerRadius;
            const endX = current.x + (nextDx / nextLength) * safeCornerRadius;
            const endY = current.y + (nextDy / nextLength) * safeCornerRadius;

            if (i === 0) {
                this.ctx.moveTo(startX, startY);
            } else {
                this.ctx.lineTo(startX, startY);
            }
            this.ctx.quadraticCurveTo(current.x, current.y, endX, endY);
        }
        this.ctx.closePath();
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

window.__registerAlgorithmVisualizer?.({
    id: 'clustering',
    mount: (canvas) => new ClusteringVisualizer(canvas)
});
