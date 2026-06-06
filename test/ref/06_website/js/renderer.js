// Canvas 渲染器 - 优化绘制性能
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.layers = new Map();
        this.width = canvas.width;
        this.height = canvas.height;
        this.initLayers();
    }

    // 初始化图层
    initLayers() {
        // 静态图层 - 只绘制一次
        this.addLayer('static');
        // 动态图层 - 每帧更新
        this.addLayer('dynamic');
        // 覆盖图层 - 用于高亮和交互
        this.addLayer('overlay');
    }

    // 添加图层
    addLayer(name) {
        const layer = document.createElement('canvas');
        layer.width = this.width;
        layer.height = this.height;
        this.layers.set(name, layer.getContext('2d'));
    }

    // 清空图层
    clearLayer(name) {
        const ctx = this.layers.get(name);
        if (ctx) {
            ctx.clearRect(0, 0, this.width, this.height);
        }
    }

    // 清空所有图层
    clearAll() {
        this.layers.forEach((ctx) => {
            ctx.clearRect(0, 0, this.width, this.height);
        });
    }

    // 获取图层上下文
    getLayerContext(name) {
        return this.layers.get(name);
    }

    // 渲染所有图层
    render() {
        // 清空主画布
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 按顺序绘制图层
        const layerOrder = ['static', 'dynamic', 'overlay'];
        layerOrder.forEach((name) => {
            const layer = this.layers.get(name);
            if (layer) {
                this.ctx.drawImage(layer.canvas, 0, 0);
            }
        });
    }

    // 批量绘制圆形
    batchDrawCircles(circles, layerName = 'dynamic') {
        const ctx = this.layers.get(layerName);
        if (!ctx) return;

        // 开始路径
        ctx.beginPath();

        circles.forEach((circle) => {
            ctx.moveTo(circle.x + circle.radius, circle.y);
            ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        });

        // 填充所有圆形
        ctx.fill();
    }

    // 批量绘制线段
    batchDrawLines(lines, layerName = 'dynamic') {
        const ctx = this.layers.get(layerName);
        if (!ctx) return;

        // 开始路径
        ctx.beginPath();

        lines.forEach((line) => {
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
        });

        // 绘制所有线段
        ctx.stroke();
    }

    // 设置图层样式
    setLayerStyle(layerName, style) {
        const ctx = this.layers.get(layerName);
        if (!ctx) return;

        if (style.fillStyle) ctx.fillStyle = style.fillStyle;
        if (style.strokeStyle) ctx.strokeStyle = style.strokeStyle;
        if (style.lineWidth) ctx.lineWidth = style.lineWidth;
        if (style.lineCap) ctx.lineCap = style.lineCap;
        if (style.lineJoin) ctx.lineJoin = style.lineJoin;
    }

    // 调整画布大小
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;

        // 调整所有图层大小
        this.layers.forEach((ctx) => {
            ctx.canvas.width = width;
            ctx.canvas.height = height;
        });
    }
}
