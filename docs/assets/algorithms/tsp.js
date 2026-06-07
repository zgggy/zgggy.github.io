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
        this.pointRadius = 7.5;

        this.mousePos = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.draggedNode = null;

        this.floatTargets = [];
        this.floatSpeeds = [];
        this.routeUpdateInterval = 500;
        this.lastRouteUpdateTime = 0;
        this.handleResize = () => this.resizeCanvas();

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
        this.updateRoute();
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

    drawRoute() {
        if (this.shortestPath.length < 2) return;

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#fafafa';
        this.ctx.lineWidth = this.pointRadius * 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(this.nodes[this.shortestPath[0]].x, this.nodes[this.shortestPath[0]].y);
        for (let i = 1; i < this.shortestPath.length; i++) {
            this.ctx.lineTo(this.nodes[this.shortestPath[i]].x, this.nodes[this.shortestPath[i]].y);
        }
        this.ctx.stroke();
    }

    draw() {
        this.ctx.fillStyle = '#6f6f6f';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawRoute();

        for (const node of this.nodes) {
            this.ctx.fillStyle = '#fafafa';
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.pointRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    updateFloating() {
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.isDragging && this.draggedNode && this.draggedNode.id === i) continue;

            const node = this.nodes[i];
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
            node.x = Math.max(24, Math.min(this.width - 24, node.x));
            node.y = Math.max(24, Math.min(this.height - 24, node.y));
        }
    }

    startAnimation() {
        const animate = (currentTime) => {
            this.updateFloating();
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
