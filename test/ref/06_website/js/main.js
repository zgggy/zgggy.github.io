document.addEventListener('DOMContentLoaded', async function() {
    initLogoClick();
    initFooterClick();
    initNavigationModals();
    initCategoryFilter();
    initDocModal();
    initScrollAnimations();
    initHorizontalScroll();
    
    // 按需加载算法模块并初始化可视化
    await loadAlgorithmModules();
});

// 按需加载算法模块
async function loadAlgorithmModules() {
    try {
        // 预加载资源
        resourceLoader.preload([
            { type: 'script', url: 'js/dijkstra.worker.js' }
        ]);

        // 加载并初始化可视化
        await initRandomVisualizations();

        console.log('算法模块加载完成');
    } catch (error) {
        console.error('算法模块加载失败:', error);
        // 降级方案：直接初始化
        initRandomVisualizations();
    }
}

// Logo 点击返回顶部
function initLogoClick() {
    const logo = document.getElementById('logo');
    if (!logo) return;
    
    logo.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 初始化页尾点击事件
function initFooterClick() {
    const companyLogo = document.getElementById('company-logo');
    const productLogo = document.getElementById('product-logo');
    
    // 点击公司名返回顶部
    if (companyLogo) {
        companyLogo.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // 点击产品名返回顶部
    if (productLogo) {
        productLogo.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// 初始化导航弹窗
function initNavigationModals() {
    const navLinks = {
        'what-is': '什么是',
        'about-us': '关于我们',
        'login': '登录',
        'terms': '条款',
        'privacy': '隐私'
    };

    Object.entries(navLinks).forEach(([id, title]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', function() {
                showModal(title, ModalContent.nav[title]);
            });
        }
    });

    document.getElementById('modalClose').addEventListener('click', closeModal);

    document.getElementById('docModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// 初始化规划界面
function initSimulationCanvas() {
    const canvas = document.getElementById('simulationCanvas');
    if (!canvas) return;
    
    // 确保canvas尺寸正确
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    
    // 创建PathPlanner实例
    const planner = new PathPlanner(canvas);
    
    // 启动动画循环
    planner.startAnimation();
}

// 绘制坐标轴系统（无文字）
function drawCoordinateSystem(ctx, canvas) {
    const padding = 40;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    
    // 绘制坐标轴
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    
    // X轴 (s)
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Y轴 (l)
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // 绘制刻度（无数字）
    ctx.lineWidth = 1;
    const xStep = width / 10;
    const yStep = height / 10;
    
    // X轴刻度
    for (let i = 0; i <= 10; i++) {
        const x = padding + i * xStep;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - padding);
        ctx.lineTo(x, canvas.height - padding + 5);
        ctx.stroke();
    }
    
    // Y轴刻度
    for (let i = 0; i <= 10; i++) {
        const y = canvas.height - padding - i * yStep;
        ctx.beginPath();
        ctx.moveTo(padding - 5, y);
        ctx.lineTo(padding, y);
        ctx.stroke();
    }
}

// 绘制障碍物（从外侧挤压边界）
function drawObstacles(ctx, canvas) {
    const padding = 40;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    
    // 绘制矩形障碍物
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    
    // 障碍物从外侧挤压边界
    const obstacleX = padding + width * 0.35;
    const obstacleY = padding + height * 0.1;
    const obstacleWidth = width * 0.3;
    const obstacleHeight = height * 0.8;
    
    ctx.fillRect(obstacleX, obstacleY, obstacleWidth, obstacleHeight);
    ctx.strokeRect(obstacleX, obstacleY, obstacleWidth, obstacleHeight);
}

// 绘制边界（被障碍物挤压）
function drawBounds(ctx, canvas) {
    const padding = 40;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    
    // 绘制上下边界
    ctx.strokeStyle = '#057dbc';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // 上边界 (upper bound) - 被障碍物挤压
    ctx.beginPath();
    ctx.moveTo(padding, padding + height * 0.2);
    ctx.lineTo(padding + width * 0.35, padding + height * 0.2);
    // 被障碍物挤压
    ctx.lineTo(padding + width * 0.35, padding + height * 0.1);
    ctx.lineTo(padding + width * 0.65, padding + height * 0.1);
    // 恢复正常
    ctx.lineTo(padding + width, padding + height * 0.2);
    ctx.stroke();
    
    // 下边界 (lower bound) - 被障碍物挤压
    ctx.beginPath();
    ctx.moveTo(padding, padding + height * 0.8);
    ctx.lineTo(padding + width * 0.35, padding + height * 0.8);
    // 被障碍物挤压
    ctx.lineTo(padding + width * 0.35, padding + height * 0.9);
    ctx.lineTo(padding + width * 0.65, padding + height * 0.9);
    // 恢复正常
    ctx.lineTo(padding + width, padding + height * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);
}

// 绘制自车
function drawEgoVehicle(ctx, canvas) {
    const padding = 40;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    
    // 自车位置
    const carX = padding + width * 0.2;
    const carY = padding + height * 0.5;
    
    // 绘制车box
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(carX - 15, carY - 8, 30, 16);
    
    // 绘制车头
    ctx.beginPath();
    ctx.moveTo(carX + 15, carY - 8);
    ctx.lineTo(carX + 20, carY);
    ctx.lineTo(carX + 15, carY + 8);
    ctx.closePath();
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    
    // 绘制车轮
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(carX - 10, carY - 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + 10, carY - 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX - 10, carY + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + 10, carY + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    return carX;
}

// 绘制轨迹（从车底下向右延伸，速度从低到高再到低）
function drawTrajectory(ctx, canvas, carX) {
    const padding = 40;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    
    // 绘制主轨迹线
    ctx.strokeStyle = '#057dbc';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(carX, padding + height * 0.5);
    
    // 生成平滑轨迹
    for (let i = 0; i <= width - (carX - padding); i += 10) {
        const x = carX + i;
        const t = i / (width - (carX - padding));
        // 轨迹在障碍物处绕行
        let y;
        if (t > 0.15 && t < 0.45) {
            // 绕过障碍物
            const offset = Math.sin((t - 0.15) / 0.3 * Math.PI) * height * 0.25;
            y = padding + height * 0.5 + offset;
        } else {
            // 正常轨迹
            y = padding + height * 0.5 + Math.sin(t * 2 * Math.PI) * height * 0.05;
        }
        ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    
    // 绘制速度变化（从低到高再到低）
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= width - (carX - padding); i += 5) {
        const x = carX + i;
        const t = i / (width - (carX - padding));
        
        // 速度从低到高再到低
        let speed;
        if (t < 0.3) {
            // 加速
            speed = t / 0.3;
        } else if (t < 0.7) {
            // 减速
            speed = 1 - (t - 0.3) / 0.4;
        } else {
            // 再次加速
            speed = (t - 0.7) / 0.3;
        }
        
        // 根据速度设置线的高度
        const lineHeight = speed * 10;
        
        // 速度颜色变化
        const alpha = 0.5 + speed * 0.5;
        ctx.strokeStyle = `rgba(5, 125, 188, ${alpha})`;
        
        // 计算当前点的y坐标
        let y;
        if (t > 0.15 && t < 0.45) {
            const offset = Math.sin((t - 0.15) / 0.3 * Math.PI) * height * 0.25;
            y = padding + height * 0.5 + offset;
        } else {
            y = padding + height * 0.5 + Math.sin(t * 2 * Math.PI) * height * 0.05;
        }
        
        // 绘制速度线
        ctx.beginPath();
        ctx.moveTo(x, y - lineHeight / 2);
        ctx.lineTo(x, y + lineHeight / 2);
        ctx.stroke();
    }
}

// 初始化分类筛选
function initCategoryFilter() {
    const categoryItems = document.querySelectorAll('.category-item');
    const docItems = document.querySelectorAll('.doc-item');
    
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有激活状态
            categoryItems.forEach(i => i.classList.remove('active'));
            // 添加当前激活状态
            this.classList.add('active');
            
            const category = this.dataset.category;
            
            // 筛选文档
            docItems.forEach(doc => {
                if (category === 'all' || doc.dataset.category === category) {
                    doc.style.display = 'block';
                } else {
                    doc.style.display = 'none';
                }
            });
        });
    });
}

// 初始化文档模态框
function initDocModal() {
    const docItems = document.querySelectorAll('.doc-item');

    docItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.doc-item-title').textContent;
            const content = ModalContent.doc[title] || '<p>文档内容正在更新中...</p>';
            showModal(title, content);
        });
    });
}

// 初始化滚动动画
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.section-left, .section-center, .section-right, .scroll-item, .doc-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// 初始化横向滚动（真正的循环滚动）
function initHorizontalScroll() {
    const scrollContainer = document.querySelector('.scroll-container');
    if (!scrollContainer) return;
    
    let scrollItems = document.querySelectorAll('.scroll-item');
    if (scrollItems.length === 0) return;
    
    let scrollPosition = 0;
    const scrollSpeed = 0.3; // 降低滚动速度
    let isPaused = false; // 暂停标志
    
    function animateScroll() {
        if (!isPaused) {
            scrollPosition += scrollSpeed;

            // 当第一个元素完全移出左侧时，将其移动到末尾
            scrollItems = document.querySelectorAll('.scroll-item');
            if (scrollItems.length > 0) {
                const itemWidth = scrollItems[0].offsetWidth;
                if (scrollPosition >= itemWidth) {
                    const firstItem = scrollItems[0];
                    scrollContainer.appendChild(firstItem);
                    scrollPosition -= itemWidth;
                }
            }

            scrollContainer.scrollLeft = scrollPosition;
        }
        requestAnimationFrame(animateScroll);
    }
    
    // 鼠标悬停在容器上时暂停滚动
    scrollContainer.addEventListener('mouseenter', () => {
        isPaused = true;
    });
    
    scrollContainer.addEventListener('mouseleave', () => {
        isPaused = false;
    });
    
    // 阻止鼠标滚轮的默认行为（避免上下滚动页面）
    scrollContainer.addEventListener('wheel', (event) => {
        event.preventDefault();
    });
    
    // 鼠标悬停在卡片上时放大内容
    scrollItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'scale(1.1)';
            item.style.zIndex = '10';
            item.style.transition = 'transform 0.2s ease, z-index 0s';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'scale(1)';
            item.style.zIndex = '1';
            item.style.transition = 'transform 0.2s ease, z-index 0.2s';
        });

        // 点击卡片弹出详情
        item.addEventListener('click', () => {
            const title = item.querySelector('.scroll-item-title')?.textContent || '场景详情';
            const content = ModalContent.scroll[title] || '<p>详细描述内容</p>';
            showModal(title, content);
        });
    });

    // 启动动画
    animateScroll();
}

// 初始化聚类画布
function initClusteringCanvas() {
    const canvas = document.getElementById('clusteringCanvas');
    if (!canvas) return;
    
    // 确保canvas尺寸正确
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    
    // 创建ClusteringVisualizer实例
    const clustering = new ClusteringVisualizer(canvas);
}

// 初始化Dijkstra画布
function initDijkstraCanvas() {
    const canvas = document.getElementById('dijkstraCanvas');
    if (!canvas) return;
    
    // 确保canvas尺寸正确
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    
    // 创建DijkstraVisualizer实例
    const dijkstra = new DijkstraVisualizer(canvas);
}

// 初始化路径跟随画布
function initPathFollowingCanvas() {
    const canvas = document.getElementById('pathFollowingCanvas');
    if (!canvas) return;
    
    // 确保canvas尺寸正确
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    
    // 创建PathFollowingVisualizer实例
    window.currentPathFollowing = new PathFollowingVisualizer(canvas);
}

// 保存当前显示的可视化类型和实例（页面加载时随机选择一次）
let currentVisualizations = null;
let visualizationInstances = {};

// 随机显示两种可视化
async function initRandomVisualizations() {
    // 只有首次加载时才随机选择，resize时保持不变
    if (!currentVisualizations) {
        const visualizations = ['path', 'clustering', 'dijkstra', 'pathFollowing'];
        // 随机选择两种可视化
        const selected = [];
        while (selected.length < 2) {
            const randomIndex = Math.floor(Math.random() * visualizations.length);
            const visualization = visualizations[randomIndex];
            if (!selected.includes(visualization)) {
                selected.push(visualization);
            }
        }
        currentVisualizations = selected;
    }

    // 清空右侧区域
    const sectionRight = document.querySelector('.section-right');
    sectionRight.innerHTML = '';

    // 添加选中的可视化
    currentVisualizations.forEach((visualization, index) => {
        const container = document.createElement('div');
        container.className = index === 0 ? 'section-right-top' : 'section-right-bottom';

        if (visualization === 'path') {
            container.innerHTML = '<canvas class="simulation-canvas" id="simulationCanvas" width="400" height="200"></canvas>';
        } else if (visualization === 'clustering') {
            container.innerHTML = '<canvas class="clustering-canvas" id="clusteringCanvas" width="400" height="200"></canvas>';
        } else if (visualization === 'dijkstra') {
            container.innerHTML = '<canvas class="dijkstra-canvas" id="dijkstraCanvas" width="400" height="200"></canvas>';
        } else if (visualization === 'pathFollowing') {
            container.innerHTML = '<canvas class="path-following-canvas" id="pathFollowingCanvas" width="400" height="200"></canvas>';
        }

        sectionRight.appendChild(container);
    });

    // 初始化选中的可视化并保存实例
    visualizationInstances = {};
    
    // 按需加载并初始化可视化
    if (currentVisualizations.includes('path')) {
        await resourceLoader.loadScript('js/path_planner.js');
        initSimulationCanvas();
        visualizationInstances.path = window.currentPathPlanner;
    }
    if (currentVisualizations.includes('clustering')) {
        await resourceLoader.loadScript('js/clustering.js');
        initClusteringCanvas();
        visualizationInstances.clustering = window.currentClustering;
    }
    if (currentVisualizations.includes('dijkstra')) {
        await resourceLoader.loadScript('js/dijkstra.js');
        initDijkstraCanvas();
        visualizationInstances.dijkstra = window.currentDijkstra;
    }
    if (currentVisualizations.includes('pathFollowing')) {
        await resourceLoader.loadScript('js/path_following.js');
        initPathFollowingCanvas();
        visualizationInstances.pathFollowing = window.currentPathFollowing;
    }
}

// 响应式处理
window.addEventListener('resize', function() {
    // resize时不重新创建实例，只更新canvas尺寸
    if (!currentVisualizations) return;

    // 更新每个可视化实例的canvas尺寸
    if (visualizationInstances.path && visualizationInstances.path.canvas) {
        visualizationInstances.path.canvas.width = 400;
        visualizationInstances.path.canvas.height = 200;
        visualizationInstances.path.width = 400;
        visualizationInstances.path.height = 200;
    }
    if (visualizationInstances.clustering && visualizationInstances.clustering.canvas) {
        visualizationInstances.clustering.canvas.width = 400;
        visualizationInstances.clustering.canvas.height = 200;
        visualizationInstances.clustering.width = 400;
        visualizationInstances.clustering.height = 200;
    }
    if (visualizationInstances.dijkstra && visualizationInstances.dijkstra.canvas) {
        visualizationInstances.dijkstra.canvas.width = 400;
        visualizationInstances.dijkstra.canvas.height = 200;
        visualizationInstances.dijkstra.width = 400;
        visualizationInstances.dijkstra.height = 200;
    }
    if (visualizationInstances.pathFollowing && visualizationInstances.pathFollowing.canvas) {
        visualizationInstances.pathFollowing.canvas.width = 400;
        visualizationInstances.pathFollowing.canvas.height = 200;
        visualizationInstances.pathFollowing.width = 400;
        visualizationInstances.pathFollowing.height = 200;
    }
});

console.log('starletto website initialized successfully');
