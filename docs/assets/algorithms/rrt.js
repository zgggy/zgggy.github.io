// RRT 快速随机探索树可视化模块
class RRTVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.baseWidth = canvas.width;
        this.baseHeight = canvas.height;
        this.width = this.baseWidth;
        this.height = this.baseHeight;

        // RRT 参数
        this.stepSize = 18;
        this.goalBias = 0.08;
        this.maxIterationsPerFrame = 2;
        this._cellSize = 6;

        // 状态
        this.nodes = [];
        this.edges = [];
        this.obstacles = [];
        this.start = null;
        this.goal = null;
        this.path = [];
        this.found = false;
        this.resetTimer = null;
        this.growing = true;

        // 显示用平滑位置
        this._displayNodes = [];
        this._displayPath = [];

        this.handleResize = () => this.resizeCanvas();
        this.resizeCanvas();

        this.initScene();
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
        if (!prevWidth || !prevHeight) return;
        const sx = this.width / prevWidth;
        const sy = this.height / prevHeight;

        for (const obs of this.obstacles) { obs.x *= sx; obs.y *= sy; obs.w *= sx; obs.h *= sy; }
        if (this.start) { this.start.x *= sx; this.start.y *= sy; }
        if (this.goal) { this.goal.x *= sx; this.goal.y *= sy; }
        for (const n of this.nodes) { n.x *= sx; n.y *= sy; }
        for (const d of this._displayNodes) { d.x *= sx; d.y *= sy; }
        for (const p of this.path) { p.x *= sx; p.y *= sy; }
        for (const d of this._displayPath) { d.x *= sx; d.y *= sy; }
    }

    // --- 场景生成 ---

    initScene() {
        this.generateStartGoal();
        this.generateMaze();
        this.resetTree();
    }

    snapToGrid(v) {
        const cs = this._cellSize;
        return Math.round(v / cs) * cs;
    }

    generateStartGoal() {
        const margin = 30;
        const minDist = this.width * 0.6;
        for (let attempts = 0; attempts < 200; attempts++) {
            const s = { x: margin + Math.random() * (this.width - 2 * margin), y: margin + Math.random() * (this.height - 2 * margin) };
            const g = { x: margin + Math.random() * (this.width - 2 * margin), y: margin + Math.random() * (this.height - 2 * margin) };
            if (Math.hypot(s.x - g.x, s.y - g.y) >= minDist) {
                this.start = { x: this.snapToGrid(s.x), y: this.snapToGrid(s.y) };
                this.goal = { x: this.snapToGrid(g.x), y: this.snapToGrid(g.y) };
                return;
            }
        }
        this.start = { x: this.snapToGrid(margin), y: this.snapToGrid(this.height / 2) };
        this.goal = { x: this.snapToGrid(this.width - margin), y: this.snapToGrid(this.height / 2) };
    }

    generateMaze() {
        this.obstacles = [];
        const wallThickness = this._cellSize;
        const margin = 8;
        this._divide(margin, margin, this.width - 2 * margin, this.height - 2 * margin, wallThickness, this._chooseOrientation(this.width - 2 * margin, this.height - 2 * margin));
    }

    _chooseOrientation(w, h) {
        if (w < h) return 'horizontal';
        if (h < w) return 'vertical';
        return Math.random() < 0.5 ? 'horizontal' : 'vertical';
    }

    _divide(x, y, w, h, wall, orientation) {
        if (w < wall * 6 || h < wall * 6) return;

        const horizontal = orientation === 'horizontal';

        const wx = horizontal ? x : x + (wall * 2) + Math.random() * (w - wall * 4);
        const wy = horizontal ? y + (wall * 2) + Math.random() * (h - wall * 4) : y;
        const ww = horizontal ? w : wall;
        const wh = horizontal ? wall : h;

        const gapLen = wall * 4;
        let gx, gy;
        if (horizontal) {
            gx = wx + Math.random() * Math.max(0, ww - gapLen);
            gy = wy;
        } else {
            gx = wx;
            gy = wy + Math.random() * Math.max(0, wh - gapLen);
        }

        if (horizontal) {
            if (gx - wx > wall) this._addWallSafe(wx, wy, gx - wx, wh);
            const rightStart = gx + gapLen;
            if (wx + ww - rightStart > wall) this._addWallSafe(rightStart, wy, wx + ww - rightStart, wh);
        } else {
            if (gy - wy > wall) this._addWallSafe(wx, wy, ww, gy - wy);
            const bottomStart = gy + gapLen;
            if (wy + wh - bottomStart > wall) this._addWallSafe(wx, bottomStart, ww, wy + wh - bottomStart);
        }

        if (horizontal) {
            this._divide(x, y, w, wy - y, wall, this._chooseOrientation(w, wy - y));
            this._divide(x, wy + wh, w, y + h - wy - wh, wall, this._chooseOrientation(w, y + h - wy - wh));
        } else {
            this._divide(x, y, wx - x, h, wall, this._chooseOrientation(wx - x, h));
            this._divide(wx + ww, y, x + w - wx - ww, h, wall, this._chooseOrientation(x + w - wx - ww, h));
        }
    }

    _addWallSafe(x, y, w, h) {
        const safe = 20;
        const sx = this.start.x, sy = this.start.y;
        const gx = this.goal.x, gy = this.goal.y;
        if (this._rectsOverlap(x, y, w, h, sx - safe, sy - safe, safe * 2, safe * 2)) return;
        if (this._rectsOverlap(x, y, w, h, gx - safe, gy - safe, safe * 2, safe * 2)) return;
        this.obstacles.push({ x, y, w, h });
    }

    _rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    resetTree() {
        this.nodes = [{ x: this.start.x, y: this.start.y, parent: -1 }];
        this.edges = [];
        this.path = [];
        this.found = false;
        this.growing = true;
        this._displayNodes = [{ x: this.start.x, y: this.start.y }];
        this._displayPath = [];
        if (this.resetTimer) { clearTimeout(this.resetTimer); this.resetTimer = null; }
    }

    // --- RRT 核心 ---

    pointInObstacle(px, py, obs) {
        return px >= obs.x && px <= obs.x + obs.w && py >= obs.y && py <= obs.y + obs.h;
    }

    segmentIntersectsObstacle(x1, y1, x2, y2, obs) {
        const steps = Math.max(3, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 5));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            if (this.pointInObstacle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, obs)) return true;
        }
        return false;
    }

    pathClear(x1, y1, x2, y2) {
        for (const obs of this.obstacles) {
            if (this.segmentIntersectsObstacle(x1, y1, x2, y2, obs)) return false;
        }
        return true;
    }

    findNearest(px, py) {
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < this.nodes.length; i++) {
            const d = Math.hypot(this.nodes[i].x - px, this.nodes[i].y - py);
            if (d < bestDist) { bestDist = d; best = i; }
        }
        return best;
    }

    growStep() {
        if (!this.growing) return;

        let rx, ry;
        if (Math.random() < this.goalBias) {
            rx = this.goal.x;
            ry = this.goal.y;
        } else {
            rx = Math.random() * this.width;
            ry = Math.random() * this.height;
        }

        const nearIdx = this.findNearest(rx, ry);
        const near = this.nodes[nearIdx];
        const dx = rx - near.x;
        const dy = ry - near.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) return;

        const step = Math.min(this.stepSize, dist);
        const nx = near.x + (dx / dist) * step;
        const ny = near.y + (dy / dist) * step;

        if (nx < 0 || nx > this.width || ny < 0 || ny > this.height) return;
        if (!this.pathClear(near.x, near.y, nx, ny)) return;

        const newIdx = this.nodes.length;
        this.nodes.push({ x: nx, y: ny, parent: nearIdx });
        this.edges.push({ from: nearIdx, to: newIdx });
        this._displayNodes.push({ x: near.x, y: near.y });

        if (Math.hypot(nx - this.goal.x, ny - this.goal.y) <= this.stepSize) {
            const goalIdx = this.nodes.length;
            this.nodes.push({ x: this.goal.x, y: this.goal.y, parent: newIdx });
            this.edges.push({ from: newIdx, to: goalIdx });
            this._displayNodes.push({ x: nx, y: ny });

            this.found = true;
            this.growing = false;
            this.buildPath(goalIdx);

            this.resetTimer = setTimeout(() => {
                this.initScene();
            }, 1000);
        }
    }

    buildPath(goalIdx) {
        this.path = [];
        let idx = goalIdx;
        while (idx >= 0 && idx < this.nodes.length) {
            this.path.unshift({ x: this.nodes[idx].x, y: this.nodes[idx].y });
            idx = this.nodes[idx].parent;
        }
        this._displayPath = this.path.map(p => ({ x: p.x, y: p.y }));
    }

    // --- 插值平滑 ---

    tickSmoothing() {
        while (this._displayNodes.length < this.nodes.length) {
            const n = this.nodes[this._displayNodes.length];
            const parent = n.parent >= 0 ? this._displayNodes[n.parent] : n;
            this._displayNodes.push({ x: parent.x, y: parent.y });
        }

        const lerp = 0.25;
        for (let i = 0; i < this.nodes.length; i++) {
            this._displayNodes[i].x += (this.nodes[i].x - this._displayNodes[i].x) * lerp;
            this._displayNodes[i].y += (this.nodes[i].y - this._displayNodes[i].y) * lerp;
        }

        while (this._displayPath.length < this.path.length) {
            this._displayPath.push({ ...this.path[this._displayPath.length] });
        }
        for (let i = 0; i < this.path.length; i++) {
            this._displayPath[i].x += (this.path[i].x - this._displayPath[i].x) * lerp;
            this._displayPath[i].y += (this.path[i].y - this._displayPath[i].y) * lerp;
        }
    }

    getNode(i) {
        return (this._displayNodes[i] || this.nodes[i]);
    }

    // --- 绘制 ---

    draw() {
        const ctx = this.ctx;
        const cs = this._cellSize;
        const c = window.getAlgoColors ? window.getAlgoColors() : { bg: '#f7f7f7', line: '#d0d0d0', muted: '#c8c8c8', text: '#aaaaaa', accent: '#333333' };
        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // 迷宫墙（纯矩形）
        ctx.fillStyle = c.muted;
        for (const obs of this.obstacles) {
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }

        // 树边
        ctx.strokeStyle = c.line;
        ctx.lineWidth = 1.2;
        for (const edge of this.edges) {
            const a = this.getNode(edge.from);
            const b = this.getNode(edge.to);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        // 最终路径
        const pathColor = c.accent;
        if (this._displayPath.length > 1) {
            ctx.strokeStyle = pathColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this._displayPath[0].x, this._displayPath[0].y);
            for (let i = 1; i < this._displayPath.length; i++) {
                ctx.lineTo(this._displayPath[i].x, this._displayPath[i].y);
            }
            ctx.stroke();
        }

        // 起点（网格对齐正方形，浅灰/连上后深灰）
        const markerSize = cs * 2;
        ctx.fillStyle = this.found ? pathColor : c.line;
        ctx.fillRect(this.start.x - markerSize / 2, this.start.y - markerSize / 2, markerSize, markerSize);

        // 终点
        ctx.fillStyle = this.found ? pathColor : c.line;
        ctx.fillRect(this.goal.x - markerSize / 2, this.goal.y - markerSize / 2, markerSize, markerSize);

        // 树节点
        ctx.fillStyle = c.text;
        for (let i = 1; i < this.nodes.length; i++) {
            const n = this.getNode(i);
            ctx.beginPath();
            ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- 动画 ---

    startAnimation() {
        let lastTime = 0;
        const growInterval = 40;
        const self = this;

        function animate(currentTime) {
            if (self._paused) { requestAnimationFrame(animate); return; }
            if (self.growing && currentTime - lastTime >= growInterval) {
                for (let i = 0; i < self.maxIterationsPerFrame; i++) {
                    self.growStep();
                }
                lastTime = currentTime;
            }
            self.tickSmoothing();
            self.draw();
            requestAnimationFrame(animate);
        }

        animate(0);
    }
}

window.__registerAlgorithmVisualizer?.({
    id: 'rrt',
    mount: (canvas) => new RRTVisualizer(canvas)
});
