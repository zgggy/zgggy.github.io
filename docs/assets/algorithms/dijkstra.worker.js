// Dijkstra算法计算 Worker

// 处理消息
self.onmessage = function(e) {
    const { action, data } = e.data;
    
    switch (action) {
        case 'runDijkstra':
            runDijkstra(data);
            break;
        case 'buildConnections':
            buildConnections(data);
            break;
    }
};

// 构建连接关系 - 保证连通性
function buildConnections(data) {
    const { nodes, nodeCount } = data;
    const edges = [];
    
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
                Math.pow(nodes[i].x - nodes[j].x, 2) +
                Math.pow(nodes[i].y - nodes[j].y, 2)
            );
            allDistances.push({ from: i, to: j, distance: dist });
        }
    }

    // 按距离排序
    allDistances.sort((a, b) => a.distance - b.distance);

    // 第一阶段：使用Kruskal算法先生成一棵生成树，保证图的连通性
    for (const dist of allDistances) {
        if (union(dist.from, dist.to)) {
            edges.push({
                from: dist.from,
                to: dist.to,
                cost: dist.distance
            });
            // 当边数达到n-1时，生成树完成
            if (edges.length === nodeCount - 1) break;
        }
    }

    // 第二阶段：为每个节点再添加一个最近的可连接节点（连接数小于2的）
    const connectionCount = new Array(nodeCount).fill(0);
    for (const edge of edges) {
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
            const exists = edges.some(e =>
                (e.from === dist.from && e.to === dist.to) ||
                (e.from === dist.to && e.to === dist.from)
            );
            if (!exists) {
                edges.push({
                    from: dist.from,
                    to: dist.to,
                    cost: dist.distance
                });
                connectionCount[dist.from]++;
                connectionCount[dist.to]++;
            }
        }
    }

    self.postMessage({
        action: 'buildConnectionsResult',
        data: edges
    });
}

// 运行Dijkstra算法
function runDijkstra(data) {
    const { nodes, edges, startNode, endNode, nodeCount } = data;
    const distances = new Array(nodeCount).fill(Infinity);
    const previous = new Array(nodeCount).fill(null);
    const visited = new Array(nodeCount).fill(false);

    distances[startNode] = 0;

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

        if (currentNode === -1 || currentNode === endNode) break;

        visited[currentNode] = true;

        // 遍历所有与当前节点相连的边
        for (let edge of edges) {
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
    const shortestPath = [];
    let current = endNode;
    while (previous[current] !== null) {
        shortestPath.unshift(current);
        current = previous[current];
    }
    if (current === startNode) {
        shortestPath.unshift(startNode);
    }

    self.postMessage({
        action: 'runDijkstraResult',
        data: shortestPath
    });
}
