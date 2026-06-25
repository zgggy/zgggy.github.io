// 目标聚类可视化模块 - DBSCAN step-by-step 播放
const UNASSIGNED = -1;
const NOISE = -2;

class ClusteringVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.baseWidth = canvas.width;
        this.baseHeight = canvas.height;
        this.width = this.baseWidth;
        this.height = this.baseHeight;

        // 配置参数
        this.points = [];
        this.clusters = [];
        this.noise = [];

        // DBSCAN 参数
        this.eps = 40;
        this.minPts = 2;

        // 播放参数
        this.stepInterval = 180;
        this.completePause = 720;
        this.transitionDuration = 980;
        this.lastStepTime = 0;
        this.motionTime = 0;
        this.playState = 'pick-seed';
        this.currentPointIndex = 0;
        this.nextClusterId = 0;
        this.activeClusterId = -1;
        this.activePointIndex = -1;
        this.activeNeighborIndices = [];
        this.expansionQueue = [];
        this.queuedIndices = new Set();
        this.completeAt = 0;
        this.transitionStartAt = 0;
        this.transitionProgress = 0;
        this.activeNeighborSet = new Set();
        this.ripples = [];

        // 鼠标交互
        this.mousePos = { x: -1000, y: -1000 };
        this.mouseRange = 50;
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
        this.resetPlayback();
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

    createPoint(x, y) {
        return {
            x,
            y,
            fromX: x,
            fromY: y,
            targetX: x,
            targetY: y,
            cluster: UNASSIGNED,
            currentSize: 0,
            currentLight: 0,
            phase: Math.random() * Math.PI * 2,
            wobbleX: (Math.random() - 0.5) * 1.8,
            wobbleY: (Math.random() - 0.5) * 1.8
        };
    }

    clampPointToCanvas(x, y, padding = 20) {
        return {
            x: Math.max(padding, Math.min(this.width - padding, x)),
            y: Math.max(padding, Math.min(this.height - padding, y))
        };
    }

    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    sampleClusterOffset(spreadX, spreadY) {
        return {
            x: (Math.random() - 0.5) * spreadX + (Math.random() - 0.5) * spreadX * 0.35,
            y: (Math.random() - 0.5) * spreadY + (Math.random() - 0.5) * spreadY * 0.35
        };
    }

    createThreeClusterCenters() {
        const horizontalPadding = Math.max(70, this.width * 0.12);
        const verticalPadding = Math.max(58, this.height * 0.18);
        const left = {
            x: this.randomBetween(horizontalPadding, this.width * 0.34),
            y: this.randomBetween(verticalPadding, this.height - verticalPadding)
        };
        const center = {
            x: this.randomBetween(this.width * 0.4, this.width * 0.6),
            y: this.randomBetween(verticalPadding, this.height - verticalPadding)
        };
        const right = {
            x: this.randomBetween(this.width * 0.66, this.width - horizontalPadding),
            y: this.randomBetween(verticalPadding, this.height - verticalPadding)
        };
        return [left, center, right];
    }

    buildClusteredLayout(pointCount) {
        const safeCount = Math.max(9, pointCount || 0);
        const centers = this.createThreeClusterCenters();
        const layout = [];
        const baseCount = Math.floor(safeCount / 3);
        const remainder = safeCount % 3;
        const counts = [
            baseCount + (remainder > 0 ? 1 : 0),
            baseCount + (remainder > 1 ? 1 : 0),
            baseCount
        ];

        const spreadX = Math.max(28, Math.min(58, this.width * 0.12));
        const spreadY = Math.max(22, Math.min(48, this.height * 0.18));

        for (let clusterIndex = 0; clusterIndex < centers.length; clusterIndex++) {
            const center = centers[clusterIndex];
            for (let i = 0; i < counts[clusterIndex]; i++) {
                const offset = this.sampleClusterOffset(spreadX, spreadY);
                layout.push(this.clampPointToCanvas(center.x + offset.x, center.y + offset.y));
            }
        }

        return layout.slice(0, safeCount);
    }

    shuffleArray(items) {
        const next = items.slice();
        for (let i = next.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [next[i], next[j]] = [next[j], next[i]];
        }
        return next;
    }

    createClusterTargets(count, center) {
        const targets = [];
        const spreadX = Math.max(26, Math.min(62, this.width * 0.12));
        const spreadY = Math.max(20, Math.min(50, this.height * 0.18));

        for (let i = 0; i < count; i++) {
            const offset = this.sampleClusterOffset(spreadX, spreadY);
            targets.push(this.clampPointToCanvas(center.x + offset.x, center.y + offset.y));
        }

        return targets;
    }

    buildInterleavedTransitionLayout() {
        const safeCount = Math.max(9, this.points.length || 0);
        const centers = this.shuffleArray(this.createThreeClusterCenters());
        const baseCount = Math.floor(safeCount / 3);
        const remainder = safeCount % 3;
        const counts = [
            baseCount + (remainder > 0 ? 1 : 0),
            baseCount + (remainder > 1 ? 1 : 0),
            baseCount
        ];

        const targetBuckets = centers.map((center, index) =>
            this.shuffleArray(this.createClusterTargets(counts[index], center))
        );
        const bucketOrder = this.shuffleArray([0, 1, 2]);
        const orderedPoints = this.points
            .slice()
            .sort((left, right) => left.x - right.x || left.y - right.y);
        const nextTargets = new Map();

        for (let i = 0; i < orderedPoints.length; i++) {
            const point = orderedPoints[i];
            let bucketIndex = bucketOrder[i % bucketOrder.length];

            if (!targetBuckets[bucketIndex].length) {
                bucketIndex = targetBuckets.findIndex((bucket) => bucket.length);
            }

            const target = bucketIndex >= 0
                ? targetBuckets[bucketIndex].pop()
                : this.clampPointToCanvas(point.x, point.y);
            nextTargets.set(point, target);
        }

        return this.points.map((point) => nextTargets.get(point) || this.clampPointToCanvas(point.x, point.y));
    }

    applyLayout(pointsLayout) {
        for (let i = 0; i < pointsLayout.length; i++) {
            const next = pointsLayout[i];
            const point = this.points[i];
            if (!point || !next) continue;
            point.x = next.x;
            point.y = next.y;
            point.fromX = next.x;
            point.fromY = next.y;
            point.targetX = next.x;
            point.targetY = next.y;
        }
    }

    prepareTransitionToNewLayout() {
        const nextLayout = this.buildInterleavedTransitionLayout();
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            const next = nextLayout[i];
            if (!point || !next) continue;
            point.fromX = point.x;
            point.fromY = point.y;
            point.targetX = next.x;
            point.targetY = next.y;
            point.phase = Math.random() * Math.PI * 2;
            point.wobbleX = (Math.random() - 0.5) * 1.8;
            point.wobbleY = (Math.random() - 0.5) * 1.8;
        }
        this.transitionProgress = 0;
        this.transitionStartAt = performance.now();
        this.playState = 'transition';
        this.activePointIndex = -1;
        this.activeNeighborIndices = [];
        this.activeNeighborSet = new Set();
        this.expansionQueue = [];
        this.queuedIndices.clear();
    }

    updateTransition(now) {
        const elapsed = Math.max(0, now - this.transitionStartAt);
        const rawProgress = Math.min(1, elapsed / this.transitionDuration);
        const eased = 1 - Math.pow(1 - rawProgress, 3);
        this.transitionProgress = eased;

        for (const point of this.points) {
            point.x = point.fromX + (point.targetX - point.fromX) * eased;
            point.y = point.fromY + (point.targetY - point.fromY) * eased;
        }

        if (rawProgress >= 1) {
            for (const point of this.points) {
                point.x = point.targetX;
                point.y = point.targetY;
            }
            this.transitionProgress = 0;
            this.resetPlayback();
        }
    }

    // 初始化聚类点云
    initPoints() {
        const pointCount = 42;
        const layout = this.buildClusteredLayout(pointCount);
        for (let i = 0; i < layout.length; i++) {
            const point = layout[i];
            this.points.push(this.createPoint(point.x, point.y));
        }
        this.resetPlayback();
    }

    resetPointAssignments() {
        for (const point of this.points) {
            point.cluster = UNASSIGNED;
        }
        this.rebuildGroups();
    }

    resetPlayback() {
        this.resetPointAssignments();
        this.playState = 'pick-seed';
        this.currentPointIndex = 0;
        this.nextClusterId = 0;
        this.activeClusterId = -1;
        this.activePointIndex = -1;
        this.activeNeighborIndices = [];
        this.expansionQueue = [];
        this.queuedIndices = new Set();
        this.completeAt = 0;
        this.transitionStartAt = 0;
        this.transitionProgress = 0;
        this.activeNeighborSet = new Set();
        this.lastStepTime = 0;
    }

    rebuildGroups() {
        const clusterMap = new Map();
        this.noise = [];

        for (const point of this.points) {
            if (point.cluster === NOISE) {
                this.noise.push(point);
                continue;
            }
            if (point.cluster >= 0) {
                if (!clusterMap.has(point.cluster)) {
                    clusterMap.set(point.cluster, []);
                }
                clusterMap.get(point.cluster).push(point);
            }
        }

        this.clusters = Array.from(clusterMap.entries())
            .sort((left, right) => left[0] - right[0])
            .map(([id, points]) => ({ id, points }));
    }

    // 设置事件监听器
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    }

    // 处理鼠标移动
    handleMouseMove(e) {
        this.mousePos = this.getCanvasPoint(e);
    }

    // 处理点击事件 - 添加点
    handleClick(e) {
        const { x, y } = this.getCanvasPoint(e);
        this.points.push(this.createPoint(x, y));
        this.resetPlayback();
    }

    // 处理双击事件 - 删除点
    handleDoubleClick(e) {
        const { x, y } = this.getCanvasPoint(e);
        for (let i = this.points.length - 1; i >= 0; i--) {
            const point = this.points[i];
            const distance = Math.hypot(point.x - x, point.y - y);
            if (distance < 10) {
                this.points.splice(i, 1);
                this.resetPlayback();
                break;
            }
        }
    }

    // 处理鼠标离开事件
    handleMouseLeave() {
        this.mousePos = { x: -1000, y: -1000 };
    }

    // 处理右键点击事件 - 删除点
    handleRightClick(e) {
        e.preventDefault();
        const { x, y } = this.getCanvasPoint(e);
        for (let i = this.points.length - 1; i >= 0; i--) {
            const point = this.points[i];
            const distance = Math.hypot(point.x - x, point.y - y);
            if (distance < 10) {
                this.points.splice(i, 1);
                this.resetPlayback();
                break;
            }
        }
    }

    getNeighborsForIndex(pointIndex) {
        const point = this.points[pointIndex];
        const neighbors = [];
        if (!point) return neighbors;

        for (let i = 0; i < this.points.length; i++) {
            if (i === pointIndex) continue;
            const otherPoint = this.points[i];
            const distance = Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y);
            if (distance <= this.eps) {
                neighbors.push(i);
            }
        }
        return neighbors;
    }

    enqueueNeighbors(indices) {
        for (const index of indices) {
            const point = this.points[index];
            if (!point) continue;
            if (point.cluster >= 0) continue;
            if (this.queuedIndices.has(index)) continue;
            this.expansionQueue.push(index);
            this.queuedIndices.add(index);
        }
    }

    pickNextSeed() {
        while (this.currentPointIndex < this.points.length) {
            const point = this.points[this.currentPointIndex];
            if (point && point.cluster === UNASSIGNED) break;
            this.currentPointIndex += 1;
        }

        if (this.currentPointIndex >= this.points.length) {
            this.playState = 'complete';
            this.completeAt = performance.now() + this.completePause;
            this.activePointIndex = -1;
            this.activeNeighborIndices = [];
            this.activeNeighborSet = new Set();
            this.expansionQueue = [];
            this.queuedIndices.clear();
            return;
        }

        this.activePointIndex = this.currentPointIndex;
        this.activeNeighborIndices = this.getNeighborsForIndex(this.currentPointIndex);
        this.activeNeighborSet = new Set(this.activeNeighborIndices);
        this.spawnRipple(this.activePointIndex, 'seed');
        this.playState = 'inspect-seed';
    }

    inspectSeed() {
        const point = this.points[this.activePointIndex];
        if (!point) {
            this.playState = 'pick-seed';
            return;
        }

        if (this.activeNeighborIndices.length < this.minPts) {
            point.cluster = NOISE;
            this.rebuildGroups();
            this.currentPointIndex += 1;
            this.playState = 'pick-seed';
            return;
        }

        this.activeClusterId = this.nextClusterId;
        point.cluster = this.activeClusterId;
        this.expansionQueue = [];
        this.queuedIndices.clear();
        this.enqueueNeighbors(this.activeNeighborIndices);
        this.rebuildGroups();
        this.playState = 'expand-cluster';
    }

    expandClusterStep() {
        if (!this.expansionQueue.length) {
            this.nextClusterId += 1;
            this.currentPointIndex += 1;
            this.activeClusterId = -1;
            this.activePointIndex = -1;
            this.activeNeighborIndices = [];
            this.activeNeighborSet = new Set();
            this.playState = 'pick-seed';
            return;
        }

        const currentIndex = this.expansionQueue.shift();
        this.queuedIndices.delete(currentIndex);
        const point = this.points[currentIndex];
        if (!point) return;

        this.activePointIndex = currentIndex;
        this.activeNeighborIndices = this.getNeighborsForIndex(currentIndex);
        this.activeNeighborSet = new Set(this.activeNeighborIndices);
        this.spawnRipple(this.activePointIndex, 'expand');

        if (point.cluster === UNASSIGNED || point.cluster === NOISE) {
            point.cluster = this.activeClusterId;
        }

        if (this.activeNeighborIndices.length >= this.minPts) {
            this.enqueueNeighbors(this.activeNeighborIndices);
        }

        this.rebuildGroups();
    }

    advancePlayback(now) {
        if (this.playState === 'complete') {
            if (now >= this.completeAt) {
                this.prepareTransitionToNewLayout();
            }
            return;
        }

        if (this.playState === 'transition') {
            this.updateTransition(now);
            return;
        }

        if (this.playState === 'pick-seed') {
            this.pickNextSeed();
            return;
        }

        if (this.playState === 'inspect-seed') {
            this.inspectSeed();
            return;
        }

        if (this.playState === 'expand-cluster') {
            this.expandClusterStep();
        }
    }

    spawnRipple(pointIndex, kind) {
        const point = this.points[pointIndex];
        if (!point) return;
        this.ripples.push({
            x: point.x,
            y: point.y,
            bornAt: this.motionTime || performance.now(),
            kind: kind || 'expand'
        });
        if (this.ripples.length > 12) {
            this.ripples.splice(0, this.ripples.length - 12);
        }
    }

    updateRipples(now) {
        const duration = 640;
        this.ripples = this.ripples.filter((ripple) => now - ripple.bornAt <= duration);
    }

    getPointDisplayPosition(point, index) {
        if (this.playState === 'transition') {
            return { x: point.x, y: point.y };
        }
        const t = this.motionTime * 0.0018 + index * 0.17 + point.phase;
        return {
            x: point.x + Math.sin(t * 1.3) * point.wobbleX,
            y: point.y + Math.cos(t * 1.1) * point.wobbleY
        };
    }

    getPointEnergy(index, point) {
        const distanceToMouse = Math.hypot(point.x - this.mousePos.x, point.y - this.mousePos.y);
        const hovered = distanceToMouse < this.mouseRange;
        const isActive = index === this.activePointIndex;
        const isNeighbor = this.activeNeighborSet.has(index);
        const isQueued = this.queuedIndices.has(index);

        let energy = 0.35 + (Math.sin(this.motionTime * 0.002 + point.phase) + 1) * 0.12;
        if (point.cluster >= 0) energy += 0.18;
        if (point.cluster === NOISE) energy -= 0.04;
        if (this.playState === 'transition') energy += 0.08;
        if (hovered) energy += 0.15;
        if (isNeighbor) energy += 0.12;
        if (isQueued) energy += 0.08;
        if (isActive) energy += 0.35;
        return Math.max(0.16, Math.min(1.1, energy));
    }

    getPointLightTarget(index, point) {
        const isActive = index === this.activePointIndex;
        const isNeighbor = this.activeNeighborSet.has(index);
        const isQueued = this.queuedIndices.has(index);

        let target = 0.14;
        if (point.cluster >= 0) target = 0.28;
        if (point.cluster === NOISE) target = 0.1;
        if (isQueued) target = 0.42;
        if (isNeighbor) target = 0.62;
        if (isActive) target = 1;

        if (this.playState === 'transition') {
            target *= 1 - this.transitionProgress;
        }

        return Math.max(0, Math.min(1, target));
    }

    drawRipples() {
        const c = window.getAlgoColors ? window.getAlgoColors() : { line: '#d0d0d0', text: '#9d9d9d', bgAlt: '#fafafa' };
        const now = this.motionTime || performance.now();
        const duration = 640;

        this.ctx.save();
        for (const ripple of this.ripples) {
            const progress = Math.max(0, Math.min(1, (now - ripple.bornAt) / duration));
            const alpha = progress < 0.45
                ? progress / 0.45
                : Math.max(0, 1 - (progress - 0.45) / 0.55);
            if (alpha <= 0.001) continue;

            const radius = 8 + progress * (ripple.kind === 'seed' ? 92 : 118);
            this.ctx.globalAlpha = Math.min(1, alpha);
            this.ctx.fillStyle = ripple.kind === 'seed' ? (c.bgAlt || c.line) : (c.line || c.bgAlt || c.text);
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawActivePulse() {
        const c = window.getAlgoColors ? window.getAlgoColors() : { bgAlt: '#fafafa' };
        const point = this.points[this.activePointIndex];
        if (!point || this.playState === 'transition') return;

        const display = this.getPointDisplayPosition(point, this.activePointIndex);
        const pulse = 1 + 0.06 * Math.sin(this.motionTime * 0.003 + point.phase);
        const radius = 10 * pulse;

        this.ctx.save();
        this.ctx.fillStyle = c.bgAlt;
        this.ctx.globalAlpha = 0.55;
        this.ctx.beginPath();
        this.ctx.arc(display.x, display.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    getPointRenderType(point) {
        if (point.cluster === NOISE) return 'noise';
        if (point.cluster === UNASSIGNED) return 'unassigned';
        return point.cluster;
    }

    getPointTargetSize(index, point) {
        let size = point.cluster >= 0 ? 6 : 4;
        if (point.cluster === UNASSIGNED) size = 4;
        if (point.cluster === NOISE) size = 4.5;
        size += this.getPointEnergy(index, point) * 1.8;
        return size;
    }

    // 绘制
    draw() {
        const c = window.getAlgoColors ? window.getAlgoColors() : { bg: '#f7f7f7' };
        this.ctx.fillStyle = c.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawRipples();
        this.drawActivePulse();

        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            const clusterType = this.getPointRenderType(point);
            const size = this.getPointTargetSize(i, point);
            this.drawPoint(point, size, clusterType, i);
        }
    }

    // 绘制点
    drawPoint(point, size, clusterType, index) {
        const display = this.getPointDisplayPosition(point, index);
        const targetLight = this.getPointLightTarget(index, point);
        if (!point.currentSize) point.currentSize = size;
        if (typeof point.currentLight !== 'number') point.currentLight = 0;
        point.currentSize += (size - point.currentSize) * 0.24;
        point.currentLight += (targetLight - point.currentLight) * (this.playState === 'transition' ? 0.28 : 0.16);
        const visual = this.getClusterVisual(clusterType);

        if (this.playState === 'transition') {
            const idleVisual = this.getClusterVisual('unassigned');
            this.ctx.save();
            this.ctx.globalAlpha = idleVisual.alpha;
            this.ctx.beginPath();
            this.ctx.arc(display.x, display.y, point.currentSize, 0, Math.PI * 2);
            this.ctx.fillStyle = idleVisual.fill;
            this.ctx.fill();

            this.ctx.globalAlpha = Math.max(0, Math.min(1, point.currentLight * 0.92));
            this.ctx.beginPath();
            this.ctx.arc(display.x, display.y, point.currentSize + point.currentLight * 1.8, 0, Math.PI * 2);
            this.ctx.fillStyle = visual.fill;
            this.ctx.fill();
            this.ctx.restore();
            return;
        }

        this.ctx.save();
        this.ctx.globalAlpha = visual.alpha + point.currentLight * visual.lightBoost;
        this.ctx.beginPath();
        this.ctx.arc(display.x, display.y, point.currentSize + point.currentLight * 1.6, 0, Math.PI * 2);
        this.ctx.fillStyle = visual.fill;
        this.ctx.fill();
        this.ctx.restore();
    }

    getClusterVisual(clusterType) {
        const c = window.getAlgoColors ? window.getAlgoColors() : { muted: '#cfcfcf', text: '#9d9d9d', textDark: '#6a6a6a', bgAlt: '#fafafa' };
        if (clusterType === 'noise') {
            return {
                fill: c.muted,
                alpha: 0.72,
                lightBoost: 0.08
            };
        }

        if (clusterType === 'unassigned') {
            return {
                fill: c.bgAlt || c.muted,
                alpha: 0.88,
                lightBoost: 0.06
            };
        }

        return {
            fill: c.textDark,
            alpha: 0.82,
            lightBoost: 0.12
        };
    }

    // 开始动画
    startAnimation() {
        const animate = (now) => {
            if (this._paused) {
                requestAnimationFrame(animate);
                return;
            }

            this.motionTime = now;
            this.updateRipples(now);

            if (this.playState === 'transition') {
                this.updateTransition(now);
            } else if (!this.lastStepTime || now - this.lastStepTime >= this.stepInterval) {
                this.advancePlayback(now);
                this.lastStepTime = now;
            }

            this.draw();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}

window.__registerAlgorithmVisualizer?.({
    id: 'clustering',
    mount: (canvas) => new ClusteringVisualizer(canvas)
});
