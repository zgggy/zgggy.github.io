// 路径跟随控制可视化模块
class PathFollowingVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // 配置参数
        this.path = [];
        this.vehicle = {
            x: 0,
            y: 0,
            heading: 0,
            speed: 1.5,
            length: 20,
            width: 12
        };

        // 纯跟踪参数
        this.purePursuit = {
            lookaheadDistance: 25
        };

        // 鼠标交互
        this.mousePos = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragPointIndex = -1;

        // 颜色配置
        this.pathColor = '#2196F3';
        this.vehicleColor = '#FF9800';
        this.lookaheadColor = '#4CAF50';

        // 浮动参数
        this.floatOffset = []; // 每个控制点的浮动偏移
        this.floatSpeed = []; // 每个控制点的浮动速度
        this.floatTime = 0;

        // 初始化
        this.initPath();
        this.setupEventListeners();
        this.startAnimation();
    }

    // 初始化路径
    initPath() {
        // 控制点 - 调整到canvas内部，距离边界至少20像素
        this.controlPoints = [
            { x: this.width / 2, y: this.height / 2 - 70, isDragging: false },
            { x: this.width / 2 + 70, y: this.height / 2, isDragging: false },
            { x: this.width / 2, y: this.height / 2 + 70, isDragging: false },
            { x: this.width / 2 - 70, y: this.height / 2, isDragging: false }
        ];

        // 初始化浮动参数
        this.floatOffset = [];
        this.floatSpeed = [];
        for (let i = 0; i < this.controlPoints.length; i++) {
            this.floatOffset.push({ x: 0, y: 0 });
            this.floatSpeed.push({
                x: (Math.random() - 0.5) * 0.5,
                y: (Math.random() - 0.5) * 0.5
            });
        }

        // 生成Catmull-Rom样条路径
        this.updatePath();
        
        // 将车辆放置在路径起点
        this.vehicle.x = this.path[0].x;
        this.vehicle.y = this.path[0].y;
        const nextPoint = this.path[1];
        this.vehicle.heading = Math.atan2(nextPoint.y - this.path[0].y, nextPoint.x - this.path[0].x);
    }

    // Catmull-Rom样条计算
    catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        return {
            x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        };
    }

    // 更新路径 - 使用浮动后的实际位置
    updatePath() {
        this.path = [];
        const n = this.controlPoints.length;
        const pointsPerSegment = 50;
        
        for (let i = 0; i < n; i++) {
            const p0 = this.getControlPointPosition((i - 1 + n) % n);
            const p1 = this.getControlPointPosition(i);
            const p2 = this.getControlPointPosition((i + 1) % n);
            const p3 = this.getControlPointPosition((i + 2) % n);
            
            for (let j = 0; j < pointsPerSegment; j++) {
                const t = j / pointsPerSegment;
                const point = this.catmullRom(p0, p1, p2, p3, t);
                this.path.push(point);
            }
        }
        
        // 闭合路径
        this.path.push({ ...this.path[0] });
    }

    // 更新浮动
    updateFloat() {
        this.floatTime += 0.016; // 假设16ms更新一次
        
        for (let i = 0; i < this.controlPoints.length; i++) {
            // 使用正弦函数实现平滑的上下左右浮动
            const floatAmplitude = 15; // 浮动幅度增大
            
            // 确保速度不会太小
            const speedX = this.floatSpeed[i].x || 0.5;
            const speedY = this.floatSpeed[i].y || 0.5;
            
            // 不同的相位偏移使每个点浮动不同步
            const phaseX = i * Math.PI / 2;
            const phaseY = i * Math.PI / 2 + Math.PI / 4;
            
            this.floatOffset[i].x = Math.sin(this.floatTime * speedX * 2 + phaseX) * floatAmplitude;
            this.floatOffset[i].y = Math.cos(this.floatTime * speedY * 2 + phaseY) * floatAmplitude;
        }
        
        // 更新路径以反映浮动
        this.updatePath();
    }

    // 获取控制点实际位置（考虑浮动）
    getControlPointPosition(index) {
        const cp = this.controlPoints[index];
        return {
            x: cp.x + this.floatOffset[index].x,
            y: cp.y + this.floatOffset[index].y
        };
    }

    // 找到预瞄点
    findLookaheadPoint(currentIndex) {
        const lookaheadDistSq = this.purePursuit.lookaheadDistance * this.purePursuit.lookaheadDistance;
        const pathLen = this.path.length;
        
        const searchStart = currentIndex;
        const searchEnd = Math.min(currentIndex + 50, pathLen - 1);
        
        for (let i = searchStart; i < searchEnd; i++) {
            const point = this.path[i];
            const dx = point.x - this.vehicle.x;
            const dy = point.y - this.vehicle.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq >= lookaheadDistSq) {
                return { point, index: i };
            }
        }
        
        for (let i = 0; i < currentIndex; i++) {
            const point = this.path[i];
            const dx = point.x - this.vehicle.x;
            const dy = point.y - this.vehicle.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq >= lookaheadDistSq) {
                return { point, index: i };
            }
        }
        
        return { point: this.path[pathLen - 1], index: pathLen - 1 };
    }

    // 找到车辆在路径上的最近点索引
    findClosestPathIndex() {
        let minDist = Infinity;
        let closestIndex = 0;
        
        for (let i = 0; i < this.path.length; i++) {
            const point = this.path[i];
            const dx = point.x - this.vehicle.x;
            const dy = point.y - this.vehicle.y;
            const dist = dx*dx + dy*dy;
            
            if (dist < minDist) {
                minDist = dist;
                closestIndex = i;
            }
        }
        
        return closestIndex;
    }

    // 更新车辆状态
    updateVehicle() {
        const closestIndex = this.findClosestPathIndex();
        const { point: lookaheadPoint, index: lookaheadIndex } = this.findLookaheadPoint(closestIndex);
        
        const dx = lookaheadPoint.x - this.vehicle.x;
        const dy = lookaheadPoint.y - this.vehicle.y;
        
        const targetAngle = Math.atan2(dy, dx);
        
        let angleDiff = targetAngle - this.vehicle.heading;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const steeringGain = 0.25;
        let steering = angleDiff * steeringGain;
        
        const maxSteering = 0.25;
        steering = Math.max(-maxSteering, Math.min(maxSteering, steering));
        
        this.vehicle.heading += steering;
        
        while (this.vehicle.heading > Math.PI) this.vehicle.heading -= 2 * Math.PI;
        while (this.vehicle.heading < -Math.PI) this.vehicle.heading += 2 * Math.PI;
        
        this.vehicle.x += Math.cos(this.vehicle.heading) * this.vehicle.speed;
        this.vehicle.y += Math.sin(this.vehicle.heading) * this.vehicle.speed;
        
        const startPoint = this.path[0];
        const distToStart = Math.sqrt(
            Math.pow(this.vehicle.x - startPoint.x, 2) + 
            Math.pow(this.vehicle.y - startPoint.y, 2)
        );
        
        if (distToStart < 10 && lookaheadIndex > this.path.length * 0.9) {
            this.vehicle.x = startPoint.x;
            this.vehicle.y = startPoint.y;
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }

    // 处理鼠标按下事件
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.mousePos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };

        for (let i = 0; i < this.controlPoints.length; i++) {
            const pos = this.getControlPointPosition(i);
            const distance = Math.sqrt(
                Math.pow(pos.x - this.mousePos.x, 2) +
                Math.pow(pos.y - this.mousePos.y, 2)
            );
            if (distance < 15) {
                this.controlPoints[i].isDragging = true;
                this.isDragging = true;
                this.dragPointIndex = i;
                break;
            }
        }
    }

    // 处理鼠标移动事件
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.mousePos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };

        if (this.isDragging && this.dragPointIndex >= 0) {
            const controlPoint = this.controlPoints[this.dragPointIndex];
            controlPoint.x = this.mousePos.x;
            controlPoint.y = this.mousePos.y;
            this.updatePath();
        }
    }

    // 处理鼠标释放事件
    handleMouseUp(e) {
        this.isDragging = false;
        this.dragPointIndex = -1;
        
        for (let point of this.controlPoints) {
            point.isDragging = false;
        }
    }

    // 处理双击事件 - 新增控制点
    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const clickPos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };

        // 直接使用双击位置作为新控制点位置
        this.controlPoints.push({
            x: clickPos.x,
            y: clickPos.y,
            isDragging: false
        });

        // 添加新控制点的浮动参数
        this.floatOffset.push({ x: 0, y: 0 });
        this.floatSpeed.push({
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5
        });

        this.sortControlPoints();
        this.updatePath();
    }

    // 按环顺序排序控制点
    sortControlPoints() {
        if (this.controlPoints.length <= 1) return;
        
        let centerX = 0, centerY = 0;
        for (const p of this.controlPoints) {
            centerX += p.x;
            centerY += p.y;
        }
        centerX /= this.controlPoints.length;
        centerY /= this.controlPoints.length;
        
        this.controlPoints.sort((a, b) => {
            const angleA = Math.atan2(a.y - centerY, a.x - centerX);
            const angleB = Math.atan2(b.y - centerY, b.x - centerX);
            return angleA - angleB;
        });
    }

    // 绘制
    draw() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 绘制路径
        this.ctx.strokeStyle = this.pathColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        for (let i = 1; i < this.path.length; i++) {
            this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        this.ctx.stroke();

        // 绘制控制点
        for (let i = 0; i < this.controlPoints.length; i++) {
            const pos = this.getControlPointPosition(i);
            
            // 白色填充，蓝色边框
            this.ctx.fillStyle = '#ffffff';
            this.ctx.strokeStyle = this.pathColor;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }

        // 绘制预瞄点
        const closestIndex = this.findClosestPathIndex();
        const { point: lookaheadPoint } = this.findLookaheadPoint(closestIndex);
        this.ctx.fillStyle = this.lookaheadColor;
        this.ctx.beginPath();
        this.ctx.arc(lookaheadPoint.x, lookaheadPoint.y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制预瞄线
        this.ctx.strokeStyle = this.lookaheadColor;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.vehicle.x, this.vehicle.y);
        this.ctx.lineTo(lookaheadPoint.x, lookaheadPoint.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 绘制车辆
        this.ctx.save();
        this.ctx.translate(this.vehicle.x, this.vehicle.y);
        this.ctx.rotate(this.vehicle.heading);
        
        this.ctx.fillStyle = this.vehicleColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.vehicle.length / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    // 开始动画
    startAnimation() {
        const animate = () => {
            this.updateFloat();
            this.updateVehicle();
            this.draw();
            requestAnimationFrame(animate);
        };
        animate();
    }
}
