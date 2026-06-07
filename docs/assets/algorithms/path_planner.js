// 路径规划模块
class PathPlanner {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.baseWidth = canvas.width;
        this.baseHeight = canvas.height;
        this.width = this.baseWidth;
        this.height = this.baseHeight; // 使用canvas的实际高度
        
        // 配置参数
        this.padding = 20; // 减少padding，使显示更占满canvas
        this.gridSize = 5; // 增大网格密度（更密）
        this.carWidth = 20; // 2米宽
        this.carLength = 50; // 5米长
        this.obstacleSize = 20; // 2米的小正方形障碍物
        this.safetyMargin = 10; // 1米的挤压距离
        this.obstacleOccupancyMargin = 10; // 障碍物占据网格的额外空间（1米）
        
        // 坐标转换参数（像素到米）
        this.pixelToMeter = 10; // 10像素 = 1米
        this.meterToPixel = 10; // 1米 = 10像素
        
        // 浮动参数
        this.floatTime = 0;
        this.floatOffset = [];
        this.handleResize = () => this.resizeCanvas();

        this.resizeCanvas();
        
        // 初始化3个随机障碍物，在l=-2~+2附近，且s值不要太近
        this.obstacles = [];
        const centerY = this.height / 2;
        
        // 确保障碍物之间的最小距离（以像素为单位）
        const minDistance = this.obstacleSize * 2; // 至少两倍障碍物宽度
        const maxAttempts = 100; // 最大尝试次数，避免死循环
        
        // s方向的限制范围（单位：米）
        const sMinInit = 0;
        const sMaxInit = (this.width - this.obstacleSize) / this.meterToPixel;
        
        for (let i = 0; i < 3; i++) {
            let x, s;
            let validPosition = false;
            let attempts = 0;
            
            // 尝试生成有效的位置，确保与已有障碍物不重叠
            while (!validPosition && attempts < maxAttempts) {
                // s范围：sMinInit~+sMaxInit米，转换为像素（沿路径方向分布）
                s = sMinInit + Math.random() * (sMaxInit - sMinInit); // sMinInit to sMaxInit
                x = s * this.meterToPixel;
                
                // 检查与已有障碍物的距离
                validPosition = true;
                for (let existingObstacle of this.obstacles) {
                    const distance = Math.abs(x - existingObstacle.x);
                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                attempts++;
            }
            
            // 如果超过最大尝试次数，强制使用当前位置
            if (!validPosition) {
                // 直接在s轴上均匀分布
                const step = (sMaxInit - sMinInit) / 2;
                s = sMinInit + i * step; // sMinInit, sMinInit+step, sMinInit+2*step
                x = s * this.meterToPixel;
            }
            
            // l范围：-2~+2米，转换为像素（在中心线附近）
            const y = Math.random() * (this.height - this.obstacleSize);
            
            this.obstacles.push({
                x: x,
                y: y,
                width: this.obstacleSize,
                height: this.obstacleSize,
                dragging: false
            });
            
            // 初始化障碍物的浮动参数
            this.floatOffset.push({
                x: x, // 使用实际位置作为初始值
                y: y,
                targetX: null,
                targetY: null,
                reachedTarget: true, // 初始时标记为已到达，会在下一帧选择新目标
                speed: 0.3 + Math.random() * 0.5
            });
        }
        this.path = [];
        this.lastPath = [];
        
        // l的上下边界（米）
        this.lLowerBound = -4; // -4米
        this.lUpperBound = 4;  // 4米
        
        // 鼠标事件
        this.mousePos = { x: 0, y: 0 };
        this.draggingObstacle = null; // 记录当前拖动的障碍物
        this.setupEventListeners();
        
        // 初始化
        this.updatePath();
        this.startAnimation();
        window.addEventListener('resize', this.handleResize, { passive: true });
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const measuredWidth = rect.width;
        const measuredHeight = rect.height;
        const nextWidth = Math.max(1, Math.round(measuredWidth > 2 ? measuredWidth : this.baseWidth));
        const nextHeight = Math.max(1, Math.round(measuredHeight > 2 ? measuredHeight : this.baseHeight));
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
        if (!prevWidth || !prevHeight || !Array.isArray(this.obstacles) || !this.obstacles.length) return;

        const scaleX = this.width / prevWidth;
        const scaleY = this.height / prevHeight;

        for (const obstacle of this.obstacles) {
            obstacle.x *= scaleX;
            obstacle.y *= scaleY;
        }

        for (const offset of this.floatOffset) {
            offset.x *= scaleX;
            offset.y *= scaleY;
            if (typeof offset.targetX === 'number') offset.targetX *= scaleX;
            if (typeof offset.targetY === 'number') offset.targetY *= scaleY;
        }

        if (this.mousePos) {
            this.mousePos.x *= scaleX;
            this.mousePos.y *= scaleY;
        }
        this.updatePath();
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
    
    // 更新浮动 - 改为目标点移动方式（使用绝对位置）
    updateFloat() {
        const sMinPixel = 0;
        const sMaxPixel = this.width - this.obstacleSize;
        const lMinPixel = 0;
        const lMaxPixel = this.height - this.obstacleSize;
        
        for (let i = 0; i < this.obstacles.length; i++) {
            // 如果障碍物正在被拖动，跳过浮动
            if (this.obstacles[i].dragging) continue;
            
            // 如果没有目标点，或者已经到达目标点，选择新目标
            if (!this.floatOffset[i].targetX || this.floatOffset[i].reachedTarget) {
                // 随机选择目标位置（在grid范围内）
                this.floatOffset[i].targetX = sMinPixel + Math.random() * (sMaxPixel - sMinPixel);
                this.floatOffset[i].targetY = lMinPixel + Math.random() * (lMaxPixel - lMinPixel);
                this.floatOffset[i].reachedTarget = false;
                
                // 随机选择移动速度（很慢）
                this.floatOffset[i].speed = 0.1 + Math.random() * 0.2; // 0.1到0.3之间，很慢的速度
            }
            
            // 计算到目标位置的距离
            const dx = this.floatOffset[i].targetX - this.floatOffset[i].x;
            const dy = this.floatOffset[i].targetY - this.floatOffset[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果到达目标点附近，标记为已到达
            if (distance < 1) {
                this.floatOffset[i].reachedTarget = true;
            } else {
                // 缓慢移动向目标位置
                const moveSpeed = this.floatOffset[i].speed;
                this.floatOffset[i].x += (dx / distance) * moveSpeed;
                this.floatOffset[i].y += (dy / distance) * moveSpeed;
                
                // 确保位置在边界内
                this.floatOffset[i].x = Math.max(sMinPixel, Math.min(sMaxPixel, this.floatOffset[i].x));
                this.floatOffset[i].y = Math.max(lMinPixel, Math.min(lMaxPixel, this.floatOffset[i].y));
            }
        }
    }
    
    // 获取障碍物考虑浮动后的实际位置
    getObstaclePosition(index) {
        const obstacle = this.obstacles[index];
        const offset = this.floatOffset[index];
        // 直接使用浮动位置（绝对位置）
        return {
            x: offset ? offset.x : obstacle.x,
            y: offset ? offset.y : obstacle.y,
            width: obstacle.width,
            height: obstacle.height
        };
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }
    
    handleMouseDown(e) {
        this.mousePos = this.getCanvasPoint(e);
        
        // 检查是否点击到障碍物（使用浮动后的位置）
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.getObstaclePosition(i);
            if (this.isPointInRect(this.mousePos, obstacle)) {
                this.obstacles[i].dragging = true;
                this.draggingObstacle = this.obstacles[i];
                break;
            }
        }
    }
    
    handleMouseMove(e) {
        this.mousePos = this.getCanvasPoint(e);
        
        // 拖动障碍物
        for (let i = 0; i < this.obstacles.length; i++) {
            if (this.obstacles[i].dragging) {
                // 计算障碍物中心位置并吸附到网格
                let gridCenterX = Math.round(this.mousePos.x / this.gridSize) * this.gridSize;
                let gridCenterY = Math.round(this.mousePos.y / this.gridSize) * this.gridSize;

                // 更新浮动偏移中的位置
                this.floatOffset[i].x = gridCenterX - this.obstacles[i].width / 2;
                this.floatOffset[i].y = gridCenterY - this.obstacles[i].height / 2;

                // 确保障碍物在边界内
                const sMinPixel = 0;
                const sMaxPixel = this.width - this.obstacleSize;
                const lMinPixel = 0;
                const lMaxPixel = this.height - this.obstacleSize;

                this.floatOffset[i].x = Math.max(sMinPixel, Math.min(sMaxPixel, this.floatOffset[i].x));
                this.floatOffset[i].y = Math.max(lMinPixel, Math.min(lMaxPixel, this.floatOffset[i].y));

                // 更新路径
                this.updatePath();
                break;
            }
        }
    }
    
    handleMouseUp(e) {
        // 停止所有障碍物的拖动
        for (let i = 0; i < this.obstacles.length; i++) {
            this.obstacles[i].dragging = false;
            // 将拖拽后的可视位置写回障碍物本体，避免松手后回到旧位置或瞬移到(0,0)
            if (this.draggingObstacle === this.obstacles[i] && this.floatOffset[i]) {
                this.obstacles[i].x = this.floatOffset[i].x;
                this.obstacles[i].y = this.floatOffset[i].y;
                this.floatOffset[i].targetX = this.floatOffset[i].x;
                this.floatOffset[i].targetY = this.floatOffset[i].y;
                this.floatOffset[i].reachedTarget = true;
            }
        }
        this.draggingObstacle = null;
    }
    
    handleDoubleClick(e) {
        const { x: mouseX, y: mouseY } = this.getCanvasPoint(e);
        
        // 检查是否点击了障碍物
        let clickedObstacle = null;
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.getObstaclePosition(i);
            if (this.isPointInRect({ x: mouseX, y: mouseY }, obstacle)) {
                clickedObstacle = i;
                break;
            }
        }
        
        if (clickedObstacle !== null) {
            // 双击障碍物，删除该障碍物
            this.obstacles.splice(clickedObstacle, 1);
            this.floatOffset.splice(clickedObstacle, 1);
            this.updatePath();
        } else {
            // 双击网格，在双击的位置增加一个障碍物
            // 调整位置，使障碍物中心对齐网格
            const gridX = Math.round(mouseX / this.gridSize) * this.gridSize;
            const gridY = Math.round(mouseY / this.gridSize) * this.gridSize;
            
            // 确保障碍物在画布内
            const x = Math.max(0, Math.min(this.width - this.obstacleSize, gridX - this.obstacleSize / 2));
            const y = Math.max(0, Math.min(this.height - this.obstacleSize, gridY - this.obstacleSize / 2));
            
            // 添加新障碍物，2*2米的小正方形
            this.obstacles.push({ x, y, width: this.obstacleSize, height: this.obstacleSize, dragging: false });
            this.floatOffset.push({
                x,
                y,
                targetX: x,
                targetY: y,
                reachedTarget: true,
                speed: 0.1 + Math.random() * 0.2
            });
            this.updatePath();
        }
    }
    
    isPointInRect(point, rect) {
        return point.x >= rect.x && point.x <= rect.x + rect.width &&
               point.y >= rect.y && point.y <= rect.y + rect.height;
    }
    
    getBounds(s) {
        const centerY = this.height / 2;

        return { upperBound: 0, lowerBound: this.height, centerY };
    }
    
    generateGrid() {
        const grid = [];
        
        // 生成网格
        for (let x = this.padding; x < this.width - this.padding; x += this.gridSize) {
            const { upperBound, lowerBound } = this.getBounds(x);
            for (let y = upperBound; y < lowerBound; y += this.gridSize) {
                grid.push({ x, y });
            }
        }
        
        return grid;
    }
    
    dynamicProgramming() {
        const path = [];
        
        // 确保路径从0,0开始
        const startX = 0;
        
        // 生成网格
        const grid = this.generateGrid();
        
        // 初始化动态规划表
        const dp = [];
        const prev = [];
        
        for (let x = 0; x < grid.length; x++) {
            dp[x] = [];
            prev[x] = [];
            for (let y = 0; y < grid[x].length; y++) {
                dp[x][y] = Infinity;
                prev[x][y] = null;
            }
        }
        
        // 找到起点在网格中的位置
        const startY = Math.floor(grid[0].length / 2);
        dp[0][startY] = 0;
        
        // 动态规划
        for (let x = 0; x < grid.length - 1; x++) {
            for (let y = 0; y < grid[x].length; y++) {
                if (dp[x][y] === Infinity) continue;
                
                // 检查当前网格是否被障碍物占据
                if (!grid[x][y].passable) continue;
                
                // 尝试所有可能的下一步（上下左右，以及对角线）
                for (let dy = -2; dy <= 2; dy++) {
                    const newY = y + dy;
                    if (newY < 0 || newY >= grid[x + 1].length) continue;
                    
                    // 检查目标网格是否被障碍物占据
                    if (!grid[x + 1][newY].passable) continue;
                    
                    // 计算成本：距离中心线的距离 + 路径平滑度
                    const centerY = Math.floor(grid[x + 1].length / 2);
                    const distanceCost = Math.abs(newY - centerY) * 0.5; // 增加吸引中心线的权重
                    const smoothnessCost = Math.abs(dy) * 1;
                    const totalCost = dp[x][y] + distanceCost + smoothnessCost;
                    
                    if (totalCost < dp[x + 1][newY]) {
                        dp[x + 1][newY] = totalCost;
                        prev[x + 1][newY] = y;
                    }
                }
            }
        }
        
        // 回溯找到路径
        let currentY = startY;
        for (let x = grid.length - 1; x >= 0; x--) {
            if (x < grid.length - 1) {
                currentY = prev[x + 1][currentY];
            }
            
            // 转换网格坐标到像素坐标
            const pixelX = startX + x * this.gridSize;
            const { upperBound, lowerBound } = this.getBounds(pixelX);
            const pixelY = upperBound + currentY * this.gridSize;
            
            path.unshift({ x: pixelX, y: pixelY });
        }
        
        // 使用改进的平滑算法生成更平滑的曲线
        return this.smoothPath(path);
    }
    
    generateGrid() {
        const grid = [];
        
        // 确保路径从0,0开始
        const startX = 0;
        
        // 确保网格的范围包括s=smax的地方
        for (let x = startX; x <= this.width; x += this.gridSize) {
            const row = [];
            const { upperBound, lowerBound } = this.getBounds(x);
            
            // 计算当前x处的网格行数
            const numRows = Math.floor((lowerBound - upperBound) / this.gridSize) + 1;
            
            for (let y = 0; y < numRows; y++) {
                // 转换网格坐标到像素坐标
                const pixelY = upperBound + y * this.gridSize;
                const pixelX = x;
                
                // 检查是否被障碍物占据（包括额外的1米空间）
                let passable = true;
                for (let j = 0; j < this.obstacles.length; j++) {
                    // 获取考虑浮动后的障碍物位置
                    const obstacle = this.getObstaclePosition(j);
                    
                    // 创建包含额外空间的扩展障碍物边界
                    const extendedObstacle = {
                        x: obstacle.x - this.obstacleOccupancyMargin,
                        y: obstacle.y - this.obstacleOccupancyMargin,
                        width: obstacle.width + 2 * this.obstacleOccupancyMargin,
                        height: obstacle.height + 2 * this.obstacleOccupancyMargin
                    };
                    
                    if (this.isPointInRect({ x: pixelX, y: pixelY }, extendedObstacle)) {
                        passable = false;
                        break;
                    }
                }
                
                row.push({ passable });
            }
            
            grid.push(row);
        }
        
        return grid;
    }
    
    smoothPath(path) {
        if (path.length < 3) return path;
        
        // 使用二次移动平均平滑算法
        const smoothedPath = [];
        
        // 第一次移动平均
        const firstPass = [];
        const windowSize = 3;
        
        // 保持起点
        firstPass.push(path[0]);
        
        // 平滑中间点
        for (let i = 1; i < path.length - 1; i++) {
            let sumY = 0;
            let count = 0;
            
            // 计算窗口内的平均值
            for (let j = Math.max(0, i - windowSize + 1); j <= Math.min(path.length - 1, i + windowSize - 1); j++) {
                sumY += path[j].y;
                count++;
            }
            
            const x = path[i].x;
            const y = sumY / count;
            
            firstPass.push({ x, y });
        }
        
        // 保持终点
        firstPass.push(path[path.length - 1]);
        
        // 第二次移动平均，进一步平滑
        // 保持起点
        smoothedPath.push(firstPass[0]);
        
        // 平滑中间点
        for (let i = 1; i < firstPass.length - 1; i++) {
            let sumY = 0;
            let count = 0;
            
            // 计算窗口内的平均值
            for (let j = Math.max(0, i - windowSize + 1); j <= Math.min(firstPass.length - 1, i + windowSize - 1); j++) {
                sumY += firstPass[j].y;
                count++;
            }
            
            const x = firstPass[i].x;
            const y = sumY / count;
            
            smoothedPath.push({ x, y });
        }
        
        // 保持终点
        smoothedPath.push(firstPass[firstPass.length - 1]);
        
        // 最后再次检查所有点是否在边界内
        for (let i = 0; i < smoothedPath.length; i++) {
            const { x, y } = smoothedPath[i];
            const { upperBound, lowerBound } = this.getBounds(x);
            smoothedPath[i].y = Math.max(upperBound, Math.min(lowerBound, y));
        }
        
        return smoothedPath;
    }
    
    updatePath() {
        const newPath = this.dynamicProgramming();
        this.path = newPath;
        this.lastPath = [...newPath];
    }
    
    draw() {
        this.drawSplitBackground();
        this.drawObstacles();
    }
    
    getPlanningFrame() {
        const { upperBound, lowerBound, centerY } = this.getBounds(0);
        const endX = Math.floor(this.width / this.gridSize) * this.gridSize;
        return {
            startX: 0,
            endX,
            upperBound,
            lowerBound,
            centerY
        };
    }

    getDisplayPath() {
        if (this.path && this.path.length > 1) return this.path;
        const { centerY } = this.getPlanningFrame();
        return [
            { x: 0, y: centerY },
            { x: this.width, y: centerY }
        ];
    }

    getPathYAtX(x) {
        const path = this.getDisplayPath();
        if (path.length === 0) return this.height / 2;
        if (x <= path[0].x) return path[0].y;
        if (x >= path[path.length - 1].x) return path[path.length - 1].y;

        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const next = path[i];
            if (x > next.x) continue;

            const span = next.x - prev.x || 1;
            const t = (x - prev.x) / span;
            return prev.y + (next.y - prev.y) * t;
        }

        return path[path.length - 1].y;
    }

    traceRoundedRectPath(x, y, width, height, radius) {
        const ctx = this.ctx;
        const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
        ctx.beginPath();
        ctx.moveTo(x + safeRadius, y);
        ctx.lineTo(x + width - safeRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
        ctx.lineTo(x + width, y + height - safeRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
        ctx.lineTo(x + safeRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
        ctx.lineTo(x, y + safeRadius);
        ctx.quadraticCurveTo(x, y, x + safeRadius, y);
        ctx.closePath();
    }

    drawSplitBackground() {
        const path = this.getDisplayPath();
        const firstY = this.getPathYAtX(0);
        const lastY = this.getPathYAtX(this.width);

        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#9f9f9f';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        this.ctx.lineTo(0, firstY);
        this.ctx.lineTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.lineTo(this.width, lastY);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawGrid() {
        // 风格重做后不再显示道路网格。
    }
    
    drawCenterLine() {
        // 风格重做后，DP 结果本身就是分界线，不再额外绘制中心虚线。
    }
    
    drawBounds() {
        // 风格重做后不再显示道路边界线。
    }

    drawObstacles() {
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.getObstaclePosition(i);
            const centerX = obstacle.x + obstacle.width / 2;
            const centerY = obstacle.y + obstacle.height / 2;
            const pathY = this.getPathYAtX(centerX);
            const isAbovePath = centerY < pathY;

            this.ctx.fillStyle = isAbovePath ? '#666666' : '#f4f4f4';
            this.traceRoundedRectPath(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 7);
            this.ctx.fill();
        }
    }
    
    drawEgoVehicle() {
        const carX = this.padding;
        const carY = this.height / 2 - this.carWidth / 2;
        
        // 绘制车box（2米宽，5米长，朝右）
        // 不透明蓝色车子，边框深蓝
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.strokeStyle = '#057dbc';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(carX, carY, this.carLength, this.carWidth);
        this.ctx.strokeRect(carX, carY, this.carLength, this.carWidth);
    }
    
    drawPath() {
        // 分界仅用于切分背景，不再绘制可见线条。
    }
    
    startAnimation() {
        let lastTime = 0;
        const updateInterval = 2; // 500Hz
        const self = this;
        
        function animate(currentTime) {
            if (currentTime - lastTime >= updateInterval) {
                self.updateFloat();
                self.updatePath();
                self.draw();
                lastTime = currentTime;
            }
            requestAnimationFrame(animate);
        }
        
        animate(0);
    }
}

window.__registerAlgorithmVisualizer?.({
    id: 'path-planner',
    mount: (canvas) => new PathPlanner(canvas)
});
