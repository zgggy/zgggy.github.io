// 旅行商路径可视化模块
class TravelingSalesmanVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.baseWidth = canvas.width;
        this.baseHeight = canvas.height;
        this.width = this.baseWidth;
        this.height = this.baseHeight;

        this.nodes = [];
        this.startNode = null;
        this.endNode = null;
        this.shortestPath = [];
        this.pointRadius = 5;

        this.mousePos = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.draggedNode = null;

        this.floatTargets = [];
        this.floatSpeeds = [];
        this.routeUpdateInterval = 1500;
        this.lastRouteUpdateTime = 0;
        this.handleResize = () => this.resizeCanvas();

        // 连接线亮度：key="i-j" → 0(最浅) ~ 1(最深)
        this._edgeBrightness = new Map();

        this.resizeCanvas();
        this.initGraph();
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
        if (!prevWidth || !prevHeight || !this.nodes.length) return;

        const scaleX = this.width / prevWidth;
        const scaleY = this.height / prevHeight;

        for (const node of this.nodes) {
            node.x *= scaleX;
            node.y *= scaleY;
        }

        for (const target of this.floatTargets) {
            target.x *= scaleX;
            target.y *= scaleY;
        }

        this.updateRoute();
    }

    initGraph() {
        const nodeCount = 20;
        for (let i = 0; i < nodeCount; i++) {
            const x = Math.random() * (this.width - 60) + 30;
            const y = Math.random() * (this.height - 60) + 30;
            this.nodes.push({ id: i, x, y });
            this.floatTargets.push({
                x: Math.random() * (this.width - 60) + 30,
                y: Math.random() * (this.height - 60) + 30
            });
            this.floatSpeeds.push({
                x: (Math.random() - 0.5) * 0.1,
                y: (Math.random() - 0.5) * 0.1
            });
        }
        this.updateRoute();
    }

    distanceBetweenNodes(nodeA, nodeB) {
        return Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
    }

    getRouteLength(route) {
        let total = 0;
        for (let i = 1; i < route.length; i++) {
            total += this.distanceBetweenNodes(this.nodes[route[i - 1]], this.nodes[route[i]]);
        }
        return total;
    }

    findStartNode() {
        if (this.nodes.length === 0) {
            return null;
        }

        const sorted = [...this.nodes].sort((a, b) => {
            const diff = (a.x + a.y) - (b.x + b.y);
            if (diff !== 0) return diff;
            if (a.x !== b.x) return a.x - b.x;
            return a.y - b.y;
        });

        return sorted[0].id;
    }

    buildNearestNeighborRoute(startNode) {
        const remaining = this.nodes
            .filter((node) => node.id !== startNode)
            .map((node) => node.id);

        const route = [startNode];
        let currentId = startNode;

        while (remaining.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = Infinity;

            for (let i = 0; i < remaining.length; i++) {
                const candidateId = remaining[i];
                const distance = this.distanceBetweenNodes(this.nodes[currentId], this.nodes[candidateId]);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }

            currentId = remaining.splice(nearestIndex, 1)[0];
            route.push(currentId);
        }

        route.push(startNode);
        return route;
    }

    optimizeRouteWithTwoOpt(route) {
        if (route.length < 4) return route;

        let improved = true;
        let bestRoute = route.slice();

        while (improved) {
            improved = false;
            for (let i = 1; i < bestRoute.length - 2; i++) {
                for (let j = i + 1; j < bestRoute.length - 1; j++) {
                    const candidate = bestRoute
                        .slice(0, i)
                        .concat(bestRoute.slice(i, j + 1).reverse(), bestRoute.slice(j + 1));

                    if (this.getRouteLength(candidate) + 0.01 < this.getRouteLength(bestRoute)) {
                        bestRoute = candidate;
                        improved = true;
                    }
                }
            }
        }

        return bestRoute;
    }

    solveTravelingPath() {
        if (this.nodes.length === 0) return [];
        if (this.nodes.length === 1) {
            this.startNode = this.nodes[0].id;
            this.endNode = this.nodes[0].id;
            return [this.nodes[0].id];
        }

        const startNode = this.findStartNode();
        this.startNode = startNode;
        this.endNode = startNode;

        const seedRoute = this.buildNearestNeighborRoute(startNode);
        return this.optimizeRouteWithTwoOpt(seedRoute);
    }

    updateRoute() {
        this.shortestPath = this.solveTravelingPath();
        // 标记最短路径上的边
        this._routeEdges = new Set();
        for (let i = 1; i < this.shortestPath.length; i++) {
            const a = this.shortestPath[i - 1];
            const b = this.shortestPath[i];
            this._routeEdges.add(a < b ? a + '-' + b : b + '-' + a);
        }
    }

    _edgeKey(i, j) {
        return i < j ? i + '-' + j : j + '-' + i;
    }

    tickEdgeBrightness() {
        const lerpUp = 0.01;
        const lerpDown = 0.04;
        const n = this.nodes.length;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const key = this._edgeKey(i, j);
                const current = this._edgeBrightness.get(key) || 0;
                const target = this._routeEdges && this._routeEdges.has(key) ? 1 : 0;
                const lerp = target > current ? lerpUp : lerpDown;
                this._edgeBrightness.set(key, current + (target - current) * lerp);
            }
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
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

    handleMouseDown(e) {
        if (e.button !== 0) return;

        this.mousePos = this.getCanvasPoint(e);
        for (const node of this.nodes) {
            if (Math.hypot(node.x - this.mousePos.x, node.y - this.mousePos.y) >= 18) continue;
            this.isDragging = true;
            this.draggedNode = node;
            this.dragOffset = {
                x: this.mousePos.x - node.x,
                y: this.mousePos.y - node.y
            };
            break;
        }
    }

    handleMouseMove(e) {
        this.mousePos = this.getCanvasPoint(e);
        if (!this.isDragging || !this.draggedNode) return;

        this.draggedNode.x = this.mousePos.x - this.dragOffset.x;
        this.draggedNode.y = this.mousePos.y - this.dragOffset.y;
        this.draggedNode.x = Math.max(24, Math.min(this.width - 24, this.draggedNode.x));
        this.draggedNode.y = Math.max(24, Math.min(this.height - 24, this.draggedNode.y));
        const now = performance.now();
        if (now - this.lastRouteUpdateTime >= this.routeUpdateInterval) {
            this.updateRoute();
            this.lastRouteUpdateTime = now;
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.draggedNode = null;
    }

    handleDoubleClick(e) {
        const point = this.getCanvasPoint(e);
        const newId = this.nodes.length;
        this.nodes.push({ id: newId, x: point.x, y: point.y });
        this.floatTargets.push({
            x: Math.random() * (this.width - 60) + 30,
            y: Math.random() * (this.height - 60) + 30
        });
        this.floatSpeeds.push({
            x: (Math.random() - 0.5) * 0.1,
            y: (Math.random() - 0.5) * 0.1
        });
        this.updateRoute();
    }

    handleRightClick(e) {
        e.preventDefault();
        const point = this.getCanvasPoint(e);

        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            if (Math.hypot(node.x - point.x, node.y - point.y) > 16) continue;

            this.nodes.splice(i, 1);
            this.floatTargets.splice(i, 1);
            this.floatSpeeds.splice(i, 1);
            for (let j = 0; j < this.nodes.length; j++) {
                this.nodes[j].id = j;
            }
            this.updateRoute();
            break;
        }
    }

    drawEdges() {
        const n = this.nodes.length;
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = this.pointRadius * 2;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const brightness = this._edgeBrightness.get(this._edgeKey(i, j)) || 0;
                if (brightness < 0.01) continue;
                const a = this.getDisplayNode(i);
                const b = this.getDisplayNode(j);
                const alpha = 0.06 + brightness * 0.6;
                const lightness = Math.round(88 - brightness * 40);
                this.ctx.strokeStyle = `hsl(0, 0%, ${lightness}%)`;
                this.ctx.globalAlpha = alpha;
                this.ctx.beginPath();
                this.ctx.moveTo(a.x, a.y);
                this.ctx.lineTo(b.x, b.y);
                this.ctx.stroke();
            }
        }
        this.ctx.globalAlpha = 1;
    }

    draw() {
        const c = window.getAlgoColors ? window.getAlgoColors() : { bg: '#f7f7f7', text: '#999999' };
        this.ctx.fillStyle = c.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawEdges();

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.getDisplayNode(i);
            this.ctx.fillStyle = c.text;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.pointRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    updateFloating() {
        const path = this.shortestPath;
        const pathLen = path.length;

        for (let i = 0; i < this.nodes.length; i++) {
            if (this.isDragging && this.draggedNode && this.draggedNode.id === i) continue;

            const node = this.nodes[i];
            const oldX = node.x;
            const oldY = node.y;
            const target = this.floatTargets[i];
            const dx = target.x - node.x;
            const dy = target.y - node.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 5) {
                this.floatTargets[i] = {
                    x: Math.random() * (this.width - 60) + 30,
                    y: Math.random() * (this.height - 60) + 30
                };
                this.floatSpeeds[i] = {
                    x: (Math.random() - 0.5) * 0.1,
                    y: (Math.random() - 0.5) * 0.1
                };
                continue;
            }

            node.x += (dx / distance) * 0.2;
            node.y += (dy / distance) * 0.2;
            node.x += (Math.random() - 0.5) * 0.3;
            node.y += (Math.random() - 0.5) * 0.3;

            // 检查移动后是否导致路线边交叉
            if (pathLen >= 4 && this._causesCrossing(i)) {
                node.x = oldX;
                node.y = oldY;
            }
        }

        // 节点间斥力，防止聚集
        const repulseRadius = 50;
        const repulseStrength = 0.8;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const a = this.nodes[i];
                const b = this.nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);
                if (dist >= repulseRadius || dist < 0.1) continue;
                const force = repulseStrength * (1 - dist / repulseRadius);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                if (!(this.isDragging && this.draggedNode && this.draggedNode.id === i)) {
                    const ox = a.x, oy = a.y;
                    a.x += fx; a.y += fy;
                    if (this._causesCrossing(i)) { a.x = ox; a.y = oy; }
                }
                if (!(this.isDragging && this.draggedNode && this.draggedNode.id === j)) {
                    const ox = b.x, oy = b.y;
                    b.x -= fx; b.y -= fy;
                    if (this._causesCrossing(j)) { b.x = ox; b.y = oy; }
                }
            }
        }

        // 边界排斥力（软约束，防止节点卡在边界上）
        const bMargin = 24;
        const bForce = 1.5;
        for (const node of this.nodes) {
            if (node.x < bMargin)        node.x += bForce * (bMargin - node.x) / bMargin;
            if (node.x > this.width - bMargin)  node.x -= bForce * (node.x - (this.width - bMargin)) / bMargin;
            if (node.y < bMargin)        node.y += bForce * (bMargin - node.y) / bMargin;
            if (node.y > this.height - bMargin) node.y -= bForce * (node.y - (this.height - bMargin)) / bMargin;
            // 安全兜底
            node.x = Math.max(1, Math.min(this.width - 1, node.x));
            node.y = Math.max(1, Math.min(this.height - 1, node.y));
        }
    }

    _causesCrossing(nodeId) {
        const path = this.shortestPath;
        const n = path.length;
        if (n < 4) return false;

        const idx = path.indexOf(nodeId);
        if (idx < 0) return false;

        // path 末尾是起点重复，idx=0 时前驱应是 path[n-2]（真正的前一个节点）
        const prevIdx = idx === 0 ? n - 2 : idx - 1;
        const nextIdx = idx + 1;
        const prevNode = this.nodes[path[prevIdx]];
        const nextNode = this.nodes[path[nextIdx]];
        const curNode = this.nodes[nodeId];

        const edges = [
            [curNode.x, curNode.y, prevNode.x, prevNode.y],
            [curNode.x, curNode.y, nextNode.x, nextNode.y]
        ];

        // 检查 nodeId 的两条路线边是否和其他路线边交叉
        for (let k = 0; k < n - 1; k++) {
            const a = path[k], b = path[k + 1];
            if (a === nodeId || b === nodeId) continue;
            const ax = this.nodes[a].x, ay = this.nodes[a].y;
            const bx = this.nodes[b].x, by = this.nodes[b].y;
            for (const [ex1, ey1, ex2, ey2] of edges) {
                if (this._segmentsIntersect(ex1, ey1, ex2, ey2, ax, ay, bx, by)) return true;
            }
        }

        return false;
    }

    _segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const d1 = this._cross(x3, y3, x4, y4, x1, y1, x3, y3);
        const d2 = this._cross(x3, y3, x4, y4, x2, y2, x3, y3);
        const d3 = this._cross(x1, y1, x2, y2, x3, y3, x1, y1);
        const d4 = this._cross(x1, y1, x2, y2, x4, y4, x1, y1);
        if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
            ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
        return false;
    }

    _cross(ax, ay, bx, by, cx, cy, dx, dy) {
        return (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    }

    tickPositionSmoothing() {
        if (!this._displayNodes) {
            this._displayNodes = this.nodes.map(n => ({ x: n.x, y: n.y }));
            return;
        }

        // 同步长度（节点增删时）
        while (this._displayNodes.length < this.nodes.length) {
            const n = this.nodes[this._displayNodes.length];
            this._displayNodes.push({ x: n.x, y: n.y });
        }
        this._displayNodes.length = this.nodes.length;

        const lerp = 0.18;
        for (let i = 0; i < this.nodes.length; i++) {
            this._displayNodes[i].x += (this.nodes[i].x - this._displayNodes[i].x) * lerp;
            this._displayNodes[i].y += (this.nodes[i].y - this._displayNodes[i].y) * lerp;
        }
    }

    getDisplayNode(i) {
        if (this._displayNodes && this._displayNodes[i]) return this._displayNodes[i];
        return this.nodes[i];
    }

    startAnimation() {
        const animate = (currentTime) => {
            if (this._paused) { requestAnimationFrame(animate); return; }
            this.updateFloating();
            this.tickPositionSmoothing();
            this.tickEdgeBrightness();
            if (currentTime - this.lastRouteUpdateTime >= this.routeUpdateInterval) {
                this.updateRoute();
                this.lastRouteUpdateTime = currentTime;
            }
            this.draw();
            requestAnimationFrame(animate);
        };
        animate(0);
    }
}

window.__registerAlgorithmVisualizer?.({
    id: 'tsp',
    mount: (canvas) => new TravelingSalesmanVisualizer(canvas)
});
