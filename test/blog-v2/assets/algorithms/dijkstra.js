// 路网Dijkstra算法可视化模块
class DijkstraVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // 配置参数
        this.nodes = []; // 节点集合
        this.edges = []; // 边集合
        this.startNode = null; // 起点
        this.endNode = null; // 终点
        this.shortestPath = []; // 最短路径

        // 鼠标交互
        this.mousePos = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.draggedNode = null;

        // 节点浮动
        this.floatTargets = [];
        this.floatSpeeds = [];

        // Web Worker
        this.worker = null;
        this.initWorker();

        // 颜色配置
        this.nodeColor = this.getRandomColor(); // 随机颜色（非红绿）
        this.startColor = '#FF0000'; // 红色起点
        this.endColor = '#00FF00'; // 绿色终点
        this.pathColor = '#2196F3'; // 蓝色路径

        // 初始化
        this.initGraph();
        this.setupEventListeners();
        this.startAnimation();
    }

    // 初始化 Web Worker
    initWorker() {
        try {
            this.worker = new Worker('/test/blog-v2/assets/algorithms/dijkstra.worker.js');
            this.worker.onmessage = (e) => {
                const { action, data } = e.data;
                switch (action) {
                    case 'buildConnectionsResult':
                        this.edges = data;
                        this.runDijkstra();
                        break;
                    case 'runDijkstraResult':
                        this.shortestPath = data;
                        break;
                }
            };
            this.worker.onerror = (error) => {
                console.error('Worker error:', error);
                // 降级到主线程计算
                this.worker = null;
            };
        } catch (error) {
            console.error('Worker initialization error:', error);
            this.worker = null;
        }
    }

    // 获取随机颜色（排除红色和绿色）
    getRandomColor() {
        const colors = [
            '#FF9800', '#9C27B0', '#00BCD4', '#FFC107',
            '#795548', '#607D8B', '#E91E63', '#3F51B5',
            '#009688', '#CDDC39', '#FF5722', '#673AB7',
            '#03A9F4', '#8BC34A', '#FF4081'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 初始化随机图
    initGraph() {
        const nodeCount = 20; // 至少20个节点

        // 生成随机节点
        for (let i = 0; i < nodeCount; i++) {
            const x = Math.random() * (this.width - 60) + 30;
            const y = Math.random() * (this.height - 60) + 30;
            this.nodes.push({
                id: i,
                x: x,
                y: y
            });

            // 初始化浮动目标和速度
            this.floatTargets.push({
                x: Math.random() * (this.width - 60) + 30,
                y: Math.random() * (this.height - 60) + 30
            });
            this.floatSpeeds.push({
                x: (Math.random() - 0.5) * 0.1, // 减小浮动速度
                y: (Math.random() - 0.5) * 0.1
            });
        }

        // 构建连接关系
        this.buildConnections();

        // 随机选择起点和终点
        this.startNode = Math.floor(Math.random() * nodeCount);
        let endNode;
        do {
            endNode = Math.floor(Math.random() * nodeCount);
        } while (endNode === this.startNode);
        this.endNode = endNode;

        // 运行Dijkstra算法
        this.runDijkstra();
    }

    // 构建连接关系 - 保证连通性
    buildConnections() {
        const nodeCount = this.nodes.length;

        // 清空边
        this.edges = [];

        if (this.worker) {
            // 使用 Web Worker 计算
            this.worker.postMessage({
                action: 'buildConnections',
                data: {
                    nodes: this.nodes,
                    nodeCount: nodeCount
                }
            });
        } else {
            // 主线程降级计算
            this.buildConnectionsSync();
        }
    }

    // 主线程同步构建连接关系
    buildConnectionsSync() {
        const nodeCount = this.nodes.length;

        // 使用Union-Find数据结构来保证连通性
        const parent = [];
        const rank = [];
        for (let i = 0; i < nodeCount; i++) {
            parent[i] = i;
            rank[i] = 0;
        }

        const find = (x) => {
            if (parent[x] !== x) {
                parent[x] = find(parent[x]);
            }
            return parent[x];
        };

        const union = (x, y) => {
            const px = find(x);
            const py = find(y);
            if (px === py) return false;
            if (rank[px] < rank[py]) {
                parent[px] = py;
            } else if (rank[px] > rank[py]) {
                parent[py] = px;
            } else {
                parent[py] = px;
                rank[px]++;
            }
            return true;
        };

        // 计算所有节点对之间的距离
        const allDistances = [];
        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                const dist = Math.sqrt(
                    Math.pow(this.nodes[i].x - this.nodes[j].x, 2) +
                    Math.pow(this.nodes[i].y - this.nodes[j].y, 2)
                );
                allDistances.push({ from: i, to: j, distance: dist });
            }
        }

        // 按距离排序
        allDistances.sort((a, b) => a.distance - b.distance);

        // 第一阶段：使用Kruskal算法先生成一棵生成树，保证图的连通性
        for (const dist of allDistances) {
            if (union(dist.from, dist.to)) {
                this.edges.push({
                    from: dist.from,
                    to: dist.to,
                    cost: dist.distance
                });
                // 当边数达到n-1时，生成树完成
                if (this.edges.length === nodeCount - 1) break;
            }
        }

        // 第二阶段：为每个节点再添加一个最近的可连接节点（连接数小于2的）
        const connectionCount = new Array(nodeCount).fill(0);
        for (const edge of this.edges) {
            connectionCount[edge.from]++;
            connectionCount[edge.to]++;
        }

        // 按距离排序所有边
        for (const dist of allDistances) {
            // 检查是否所有节点连接数都>=2
            if (connectionCount.every(c => c >= 2)) break;

            // 如果两边连接数都小于2，添加这条边
            if (connectionCount[dist.from] < 2 && connectionCount[dist.to] < 2) {
                // 检查边是否已存在
                const exists = this.edges.some(e =>
                    (e.from === dist.from && e.to === dist.to) ||
                    (e.from === dist.to && e.to === dist.from)
                );
                if (!exists) {
                    this.edges.push({
                        from: dist.from,
                        to: dist.to,
                        cost: dist.distance
                    });
                    connectionCount[dist.from]++;
                    connectionCount[dist.to]++;
                }
            }
        }

        // 计算完成后运行Dijkstra
        this.runDijkstra();
    }

    // 运行Dijkstra算法
    runDijkstra() {
        if (this.startNode === null || this.endNode === null) return;

        if (this.worker) {
            // 使用 Web Worker 计算
            this.worker.postMessage({
                action: 'runDijkstra',
                data: {
                    nodes: this.nodes,
                    edges: this.edges,
                    startNode: this.startNode,
                    endNode: this.endNode,
                    nodeCount: this.nodes.length
                }
            });
        } else {
            // 主线程降级计算
            this.runDijkstraSync();
        }
    }

    // 主线程同步运行Dijkstra算法
    runDijkstraSync() {
        if (this.startNode === null || this.endNode === null) return;

        const nodeCount = this.nodes.length;
        const distances = new Array(nodeCount).fill(Infinity);
        const previous = new Array(nodeCount).fill(null);
        const visited = new Array(nodeCount).fill(false);

        distances[this.startNode] = 0;

        for (let i = 0; i < nodeCount; i++) {
            // 找到未访问节点中距离最小的
            let minDistance = Infinity;
            let currentNode = -1;

            for (let j = 0; j < nodeCount; j++) {
                if (!visited[j] && distances[j] < minDistance) {
                    minDistance = distances[j];
                    currentNode = j;
                }
            }

            if (currentNode === -1 || currentNode === this.endNode) break;

            visited[currentNode] = true;

            // 遍历所有与当前节点相连的边
            for (let edge of this.edges) {
                if (edge.from === currentNode || edge.to === currentNode) {
                    const neighborId = edge.from === currentNode ? edge.to : edge.from;
                    if (!visited[neighborId]) {
                        const newDistance = distances[currentNode] + edge.cost;
                        if (newDistance < distances[neighborId]) {
                            distances[neighborId] = newDistance;
                            previous[neighborId] = currentNode;
                        }
                    }
                }
            }
        }

        // 构建最短路径
        this.shortestPath = [];
        let current = this.endNode;
        while (previous[current] !== null) {
            this.shortestPath.unshift(current);
            current = previous[current];
        }
        if (current === this.startNode) {
            this.shortestPath.unshift(this.startNode);
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }

    // 处理鼠标按下事件 - 左键拖动，右键设置终点
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.mousePos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };

        // 检查是否点击到节点
        for (let node of this.nodes) {
            const distance = Math.sqrt(
                Math.pow(node.x - this.mousePos.x, 2) +
                Math.pow(node.y - this.mousePos.y, 2)
            );
            if (distance < 18) { // 增大点击半径
                if (e.button === 0) {
                    // 左键开始拖动
                    this.isDragging = true;
                    this.draggedNode = node;
                    this.dragOffset = {
                        x: this.mousePos.x - node.x,
                        y: this.mousePos.y - node.y
                    };
                } else if (e.button === 2) {
                    // 右键设置为终点
                    this.endNode = node.id;
                    this.runDijkstra();
                }
                return;
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

        // 拖动节点
        if (this.isDragging && this.draggedNode) {
            this.draggedNode.x = this.mousePos.x - this.dragOffset.x;
            this.draggedNode.y = this.mousePos.y - this.dragOffset.y;

            // 重新构建连接关系
            this.buildConnections();

            // 重新运行Dijkstra算法
            this.runDijkstra();
        }
    }

    // 处理鼠标释放事件
    handleMouseUp(e) {
        this.isDragging = false;
        this.draggedNode = null;
    }

    // 处理双击事件 - 设置起点
    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        for (let node of this.nodes) {
            const distance = Math.sqrt(
                Math.pow(node.x - x, 2) +
                Math.pow(node.y - y, 2)
            );
            if (distance < 18) {
                this.startNode = node.id;
                this.runDijkstra();
                break;
            }
        }
    }

    // 处理右键点击事件 - 设置终点
    handleRightClick(e) {
        e.preventDefault();
    }

    // 绘制
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 绘制所有边的淡色版本（不显示具体连接）
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        this.ctx.lineWidth = 1;
        for (let edge of this.edges) {
            const node1 = this.nodes[edge.from];
            const node2 = this.nodes[edge.to];

            this.ctx.beginPath();
            this.ctx.moveTo(node1.x, node1.y);
            this.ctx.lineTo(node2.x, node2.y);
            this.ctx.stroke();
        }

        // 绘制非拖动节点（除了起点和终点）
        for (let node of this.nodes) {
            // 跳过正在拖动的节点和起终点（最后绘制）
            if (this.isDragging && this.draggedNode && this.draggedNode.id === node.id) {
                continue;
            }
            if (node.id === this.startNode || node.id === this.endNode) {
                continue;
            }

            // 设置节点颜色和大小
            let radius = 12; // 1.5倍

            // 绘制节点（无边框）
            this.ctx.fillStyle = this.nodeColor;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 只绘制最短路径的边（高亮）- 放在普通节点之后，确保覆盖
        if (this.shortestPath.length > 1) {
            this.ctx.strokeStyle = this.pathColor;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.ctx.beginPath();
            this.ctx.moveTo(
                this.nodes[this.shortestPath[0]].x,
                this.nodes[this.shortestPath[0]].y
            );

            for (let i = 1; i < this.shortestPath.length; i++) {
                this.ctx.lineTo(
                    this.nodes[this.shortestPath[i]].x,
                    this.nodes[this.shortestPath[i]].y
                );
            }
            this.ctx.stroke();
        }

        // 绘制起点和终点（确保在最短路径之上）
        for (let node of this.nodes) {
            if (node.id === this.startNode || node.id === this.endNode) {
                // 设置节点颜色和大小
                let radius = 12; // 1.5倍
                let fillColor = node.id === this.startNode ? this.startColor : this.endColor;

                // 绘制节点（无边框）
                this.ctx.fillStyle = fillColor;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // 最后绘制正在拖动的节点（确保在最上方）
        if (this.isDragging && this.draggedNode) {
            let radius = 12; // 1.5倍
            let fillColor;
            if (this.draggedNode.id === this.startNode) {
                fillColor = this.startColor;
            } else if (this.draggedNode.id === this.endNode) {
                fillColor = this.endColor;
            } else {
                fillColor = this.nodeColor;
            }

            // 绘制节点（无边框）
            this.ctx.fillStyle = fillColor;
            this.ctx.beginPath();
            this.ctx.arc(this.draggedNode.x, this.draggedNode.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // 更新节点浮动
    updateFloating() {
        for (let i = 0; i < this.nodes.length; i++) {
            // 如果节点正在被拖动，跳过浮动
            if (this.isDragging && this.draggedNode && this.draggedNode.id === i) {
                continue;
            }

            const node = this.nodes[i];
            const target = this.floatTargets[i];
            const speed = this.floatSpeeds[i];

            // 计算到目标的距离
            const dx = target.x - node.x;
            const dy = target.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                // 接近目标，重新生成目标
                this.floatTargets[i] = {
                    x: Math.random() * (this.width - 60) + 30,
                    y: Math.random() * (this.height - 60) + 30
                };
                this.floatSpeeds[i] = {
                    x: (Math.random() - 0.5) * 0.1, // 减小浮动速度
                    y: (Math.random() - 0.5) * 0.1
                };
            } else {
                // 向目标移动（减小速度）
                node.x += (dx / distance) * 0.2;
                node.y += (dy / distance) * 0.2;

                // 确保节点在画布内
                node.x = Math.max(30, Math.min(this.width - 30, node.x));
                node.y = Math.max(30, Math.min(this.height - 30, node.y));
            }
        }

        // 重新构建连接关系
        this.buildConnections();

        // 重新运行Dijkstra算法
        this.runDijkstra();
    }

    // 随机更新起点和终点
    randomizeStartEnd() {
        const nodeCount = this.nodes.length;
        let newStart, newEnd;

        do {
            newStart = Math.floor(Math.random() * nodeCount);
            newEnd = Math.floor(Math.random() * nodeCount);
        } while (newStart === newEnd);

        this.startNode = newStart;
        this.endNode = newEnd;
        this.runDijkstra();
    }

    // 开始动画
    startAnimation() {
        const animate = () => {
            this.updateFloating();
            this.draw();
            requestAnimationFrame(animate);
        };
        animate();

        // 每1秒随机更新起点和终点
        setInterval(() => {
            this.randomizeStartEnd();
        }, 1000);
    }
}
