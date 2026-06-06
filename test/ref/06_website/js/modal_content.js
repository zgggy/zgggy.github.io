const ModalContent = {
    nav: {
        '什么是': `
            <p>starletto 是一个高性能、模块化的自动驾驶系统框架，为开发者提供完整的感知、规划、控制解决方案。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">高性能</div>
                    <div class="card-content">采用现代 C++ 架构，支持单进程零拷贝和跨进程共享内存传输</div>
                </div>
                <div class="card">
                    <div class="card-title">模块化</div>
                    <div class="card-content">清晰的模块划分，便于扩展和维护</div>
                </div>
                <div class="card">
                    <div class="card-title">完整解决方案</div>
                    <div class="card-content">从感知到控制的全栈自动驾驶功能</div>
                </div>
                <div class="card">
                    <div class="card-title">开源开放</div>
                    <div class="card-content">基于 MIT 许可证，欢迎社区贡献</div>
                </div>
            </div>

            <h3>技术栈</h3>
            <div class="icon-list">
                <div class="icon-item">
                    <div class="icon-item-icon">⚙️</div>
                    <div class="icon-item-text">C++17/20</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🔨</div>
                    <div class="icon-item-text">CMake</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">📦</div>
                    <div class="icon-item-text">Conan</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">📄</div>
                    <div class="icon-item-text">Protobuf</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🖥️</div>
                    <div class="icon-item-text">Web UI</div>
                </div>
            </div>
        `,
        '关于我们': `
            <p>我们是一个专注于自动驾驶技术的开源团队，致力于打造最先进的自动驾驶系统框架。</p>

            <h3>团队愿景</h3>
            <p>通过开源协作，推动自动驾驶技术的发展，让智能驾驶技术惠及更多人。</p>

            <h3>核心价值观</h3>
            <div class="card-container">
                <div class="card">
                    <div class="card-title">技术创新</div>
                    <div class="card-content">不断探索前沿技术，推动行业发展</div>
                </div>
                <div class="card">
                    <div class="card-title">开放协作</div>
                    <div class="card-content">拥抱开源文化，与社区共同成长</div>
                </div>
                <div class="card">
                    <div class="card-title">品质至上</div>
                    <div class="card-content">追求代码质量和系统可靠性</div>
                </div>
                <div class="card">
                    <div class="card-title">用户导向</div>
                    <div class="card-content">以开发者需求为中心，提供优质工具</div>
                </div>
            </div>

            <h3>联系方式</h3>
            <div class="icon-list">
                <div class="icon-item">
                    <div class="icon-item-icon">🐱</div>
                    <div class="icon-item-text">GitHub</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">✉️</div>
                    <div class="icon-item-text">Email</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">💬</div>
                    <div class="icon-item-text">Discord</div>
                </div>
            </div>
        `,
        '登录': `
            <p>请登录您的 starletto 账户以访问更多功能。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">开发者账户</div>
                    <div class="card-content">访问完整的开发工具和资源</div>
                </div>
                <div class="card">
                    <div class="card-title">企业账户</div>
                    <div class="card-content">获取企业级支持和服务</div>
                </div>
            </div>

            <h3>登录表单</h3>
            <form>
                <div class="form-group">
                    <label>邮箱</label>
                    <input type="email">
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password">
                </div>
                <div class="form-group">
                    <input type="checkbox" id="remember">
                    <label for="remember" class="form-checkbox-label">记住我</label>
                </div>
                <button type="submit" class="form-submit">登录</button>
            </form>
            <p class="form-footer">
                还没有账户？<a href="#">注册</a>
            </p>
        `,
        '条款': `
            <p>欢迎使用 starletto 服务。以下是使用我们服务的条款和条件。</p>

            <div class="chart-container">
                <div class="chart-title">服务使用统计</div>
                <div class="chart-placeholder">[使用统计图表]</div>
            </div>

            <h3>1. 接受条款</h3>
            <p>通过访问或使用 starletto 服务，您同意遵守本条款。如果您不同意这些条款，请不要使用我们的服务。</p>

            <h3>2. 使用许可</h3>
            <p>starletto 授予您非独占、不可转让的许可，以使用我们的服务用于个人或商业目的。</p>

            <h3>3. 用户责任</h3>
            <ul>
                <li>您负责维护您账户的安全性</li>
                <li>您同意不使用我们的服务进行任何非法活动</li>
                <li>您同意不侵犯他人的知识产权</li>
            </ul>

            <h3>4. 知识产权</h3>
            <p>starletto 及其相关服务的所有知识产权归 starletto 团队所有。</p>

            <h3>5. 免责声明</h3>
            <p>starletto 服务按"原样"提供，不提供任何明示或暗示的保证。</p>
        `,
        '隐私': `
            <p>starletto 重视您的隐私。本隐私政策解释了我们如何收集、使用和保护您的个人信息。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">个人信息</div>
                    <div class="card-content">当您注册账户时，我们可能收集您的姓名、邮箱等信息</div>
                </div>
                <div class="card">
                    <div class="card-title">使用数据</div>
                    <div class="card-content">我们可能收集您使用我们服务的方式和频率</div>
                </div>
                <div class="card">
                    <div class="card-title">技术数据</div>
                    <div class="card-content">我们可能收集设备信息、IP 地址等技术数据</div>
                </div>
            </div>

            <h3>使用信息</h3>
            <p>我们使用收集的信息来：</p>
            <ul>
                <li>提供和维护我们的服务</li>
                <li>改进和个性化我们的服务</li>
                <li>与您沟通</li>
                <li>分析使用情况</li>
            </ul>

            <h3>信息共享</h3>
            <p>我们不会向第三方共享您的个人信息，除非：</p>
            <ul>
                <li>获得您的明确许可</li>
                <li>遵守法律法规</li>
                <li>保护我们的权利和财产</li>
            </ul>
        `
    },

    doc: {
        '系统架构设计': `
            <p>starletto 采用现代化分层架构设计，通过严格的模块边界和高效的通信机制，实现了高性能、可扩展的自动驾驶系统。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[系统架构图]</div>
            </div>

            <h3>1. Schema 层 - 类型安全的基础</h3>
            <p><strong>核心优势：</strong>通过 .schema 文件定义数据模式，自动生成 C++ 数据结构，保证类型安全和序列化效率。支持跨语言数据交换，为系统提供统一的数据表示。</p>
            <ul>
                <li>自动代码生成，减少手动错误</li>
                <li>编译期类型检查，运行时零开销</li>
                <li>支持 Protobuf 兼容，易于与外部系统集成</li>
            </ul>

            <h3>2. Transport 层 - 高性能通信</h3>
            <p><strong>核心优势：</strong>业界领先的通信架构，支持单进程零拷贝和跨进程共享内存传输，大幅降低通信延迟。</p>
            <ul>
                <li>单进程：指针传递，零拷贝开销</li>
                <li>跨进程：共享内存，零拷贝传输</li>
                <li>统一 Channel 接口，简化模块间通信</li>
                <li>支持订阅/发布模式，灵活的数据分发</li>
            </ul>

            <h3>3. Runtime 层 - 可靠的运行时</h3>
            <p><strong>核心优势：</strong>提供进程管理、调度器、触发器等运行时基础设施，保障系统稳定运行，提供实时性保障和故障恢复机制。</p>
            <ul>
                <li>实时调度，保证关键任务优先执行</li>
                <li>进程监控与自动重启</li>
                <li>资源管理与限制</li>
                <li>故障隔离与恢复</li>
            </ul>

            <h3>4. Application 层 - 智能算法核心</h3>
            <p><strong>核心优势：</strong>包含业界领先的感知、规划、控制等核心算法模块，实现完整的自动驾驶功能。</p>
            <ul>
                <li>多传感器融合感知系统</li>
                <li>实时路径规划与决策</li>
                <li>高精度车辆控制</li>
                <li>场景理解与预测</li>
            </ul>

            <h3>5. Tools 层 - 开发效率利器</h3>
            <p><strong>核心优势：</strong>提供开发工具、可视化、数据记录和回放等功能，大幅提升开发效率。</p>
            <ul>
                <li>实时可视化调试</li>
                <li>数据记录与回放</li>
                <li>性能分析工具</li>
                <li>场景编辑器</li>
            </ul>

            <div class="chart-container">
                <div class="chart-title">通信性能对比</div>
                <div class="chart-placeholder">[性能对比图表]</div>
            </div>

            <h3>架构优势总结</h3>
            <div class="card-container">
                <div class="card">
                    <div class="card-title">性能领先</div>
                    <div class="card-content">零拷贝通信，实时调度，高性能算法实现</div>
                </div>
                <div class="card">
                    <div class="card-title">扩展性强</div>
                    <div class="card-content">模块化设计，插件式架构，易于添加新功能</div>
                </div>
                <div class="card">
                    <div class="card-title">可靠性高</div>
                    <div class="card-content">故障隔离，自动恢复，鲁棒性设计</div>
                </div>
                <div class="card">
                    <div class="card-title">开发友好</div>
                    <div class="card-content">丰富的工具链，完善的文档，活跃的社区</div>
                </div>
            </div>
        `,
        '感知模块设计': `
            <p>感知模块是自动驾驶系统的眼睛，负责理解周围环境。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">多传感器融合</div>
                    <div class="card-content">激光雷达、摄像头、毫米波雷达数据融合</div>
                </div>
                <div class="card">
                    <div class="card-title">目标检测</div>
                    <div class="card-content">实时检测道路上的车辆、行人、障碍物</div>
                </div>
                <div class="card">
                    <div class="card-title">语义分割</div>
                    <div class="card-content">理解道路场景，识别车道线、交通标志</div>
                </div>
                <div class="card">
                    <div class="card-title">环境建模</div>
                    <div class="card-content">构建周围环境的 3D 模型</div>
                </div>
            </div>

            <h3>技术特点</h3>
            <ul>
                <li>实时处理，延迟低于 10ms</li>
                <li>高精度目标定位和分类</li>
                <li>鲁棒的传感器融合算法</li>
                <li>自适应环境感知能力</li>
                <li>支持多种传感器配置</li>
            </ul>

            <div class="icon-list">
                <div class="icon-item">
                    <div class="icon-item-icon">📷</div>
                    <div class="icon-item-text">摄像头</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">📡</div>
                    <div class="icon-item-text">激光雷达</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">📳</div>
                    <div class="icon-item-text">毫米波雷达</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🔊</div>
                    <div class="icon-item-text">超声波</div>
                </div>
            </div>
        `,
        '路径规划算法': `
            <p>starletto 的路径规划模块采用多层次规划架构，结合先进的算法技术，实现了安全、高效、舒适的路径规划。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[路径规划流程图]</div>
            </div>

            <h3>规划层次</h3>
            <ul>
                <li><strong>全局路径规划</strong>：基于高精度地图的长距离路径规划，考虑道路网络、交通规则和实时交通信息</li>
                <li><strong>局部路径规划</strong>：实时避障和轨迹优化，考虑动态环境和车辆动力学约束</li>
                <li><strong>行为规划</strong>：智能决策车辆行为（如变道、超车、停车、环岛行驶等）</li>
            </ul>

            <h3>核心算法优势</h3>
            <div class="card-container">
                <div class="card">
                    <div class="card-title">A* 算法优化</div>
                    <div class="card-content">基于启发式搜索的高效路径规划，结合道路拓扑结构优化</div>
                </div>
                <div class="card">
                    <div class="card-title">RRT* 算法</div>
                    <div class="card-content">快速随机树算法，适用于复杂环境的路径探索</div>
                </div>
                <div class="card">
                    <div class="card-title">MPC 轨迹优化</div>
                    <div class="card-content">模型预测控制，考虑车辆动力学和环境约束</div>
                </div>
                <div class="card">
                    <div class="card-title">行为决策树</div>
                    <div class="card-content">基于规则和学习的行为决策系统</div>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart-title">规划算法性能对比</div>
                <div class="chart-placeholder">[算法性能对比图表]</div>
            </div>

            <h3>技术特点</h3>
            <ul>
                <li><strong>实时性</strong>：规划周期低于 50ms，支持高速行驶场景</li>
                <li><strong>安全性</strong>：多重碰撞检测，确保路径安全</li>
                <li><strong>舒适性</strong>：优化加速度和方向盘转角，提供平滑驾驶体验</li>
                <li><strong>适应性</strong>：支持城市、高速、园区等多种场景</li>
                <li><strong>鲁棒性</strong>：应对动态环境和传感器不确定性</li>
                <li><strong>可扩展性</strong>：模块化设计，易于集成新算法</li>
            </ul>

            <h3>实际应用效果</h3>
            <ul>
                <li>高速场景：稳定的车道保持和智能变道</li>
                <li>城市场景：复杂交通流中的高效路径规划</li>
                <li>园区场景：低速精准导航和避障</li>
                <li>特殊场景：环岛、匝道、施工区域等复杂路况处理</li>
            </ul>
        `,
        '仿真系统使用指南': `
            <p>starletto 提供了功能强大的仿真系统，用于算法测试和验证。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">场景模拟</div>
                    <div class="card-content">创建各种驾驶场景进行测试</div>
                </div>
                <div class="card">
                    <div class="card-title">传感器模拟</div>
                    <div class="card-content">模拟各种传感器的数据输出</div>
                </div>
                <div class="card">
                    <div class="card-title">车辆动力学</div>
                    <div class="card-content">模拟真实车辆的物理行为</div>
                </div>
                <div class="card">
                    <div class="card-title">数据记录</div>
                    <div class="card-content">记录和回放仿真数据</div>
                </div>
            </div>

            <h3>使用方法</h3>
            <ol>
                <li><strong>创建场景</strong>：使用场景编辑器创建或加载预设场景</li>
                <li><strong>配置车辆</strong>：选择车辆模型和传感器配置</li>
                <li><strong>设置参数</strong>：调整仿真参数和环境条件</li>
                <li><strong>运行仿真</strong>：启动仿真并观察系统行为</li>
                <li><strong>分析结果</strong>：查看仿真数据和性能指标</li>
                <li><strong>优化算法</strong>：基于仿真结果调整算法参数</li>
            </ol>

            <div class="icon-list">
                <div class="icon-item">
                    <div class="icon-item-icon">🏙️</div>
                    <div class="icon-item-text">城市场景</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🛣️</div>
                    <div class="icon-item-text">高速场景</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🌧️</div>
                    <div class="icon-item-text">雨天场景</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🌫️</div>
                    <div class="icon-item-text">雾天场景</div>
                </div>
            </div>
        `,
        '系统部署指南': `
            <p>本指南介绍如何在不同环境中部署 starletto 系统。</p>

            <div class="chart-container">
                <div class="chart-title">硬件需求对比</div>
                <div class="chart-placeholder">[硬件需求图表]</div>
            </div>

            <h3>硬件要求</h3>
            <ul>
                <li><strong>CPU</strong>：至少 8 核处理器，推荐 Intel i7 或 AMD Ryzen 7</li>
                <li><strong>内存</strong>：至少 16GB RAM，推荐 32GB</li>
                <li><strong>GPU</strong>：推荐 NVIDIA RTX 系列，用于深度学习加速</li>
                <li><strong>存储</strong>：至少 100GB 固态硬盘</li>
            </ul>

            <h3>软件要求</h3>
            <ul>
                <li><strong>操作系统</strong>：Ubuntu 20.04+</li>
                <li><strong>依赖库</strong>：CUDA 11.0+, OpenCV 4.5+, Eigen 3.3+</li>
                <li><strong>编译工具</strong>：CMake 3.16+，GCC 9+</li>
            </ul>

            <h3>部署步骤</h3>
            <pre>
# 步骤 1：安装依赖
sudo apt update
sudo apt install build-essential cmake git

# 步骤 2：克隆代码
git clone https://github.com/starletto/starletto.git
cd starletto

# 步骤 3：编译系统
mkdir build && cd build
cmake ..
make -j8

# 步骤 4：配置传感器
./star config sensors

# 步骤 5：启动系统
./star run
            </pre>
        `,
        'API 参考文档': `
            <p>starletto 提供了丰富的 API 接口，用于模块间通信和系统集成。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">Transport API</div>
                    <div class="card-content">模块间通信接口</div>
                </div>
                <div class="card">
                    <div class="card-title">Module API</div>
                    <div class="card-content">模块管理和生命周期</div>
                </div>
                <div class="card">
                    <div class="card-title">Data API</div>
                    <div class="card-content">数据结构和序列化</div>
                </div>
                <div class="card">
                    <div class="card-title">Config API</div>
                    <div class="card-content">配置管理接口</div>
                </div>
            </div>

            <h3>API 浏览器</h3>
            <p>使用我们的交互式 API 浏览器探索 starletto 的核心 API 接口。</p>
            <a href="api_browser.html" class="button" style="display: inline-block; margin: 16px 0; padding: 12px 24px; border: 2px solid #000; background: #fff; color: #000; text-decoration: none; font-family: 'Apercu', sans-serif; font-weight: 700; transition: all 0.15s ease;">打开 API 浏览器</a>

            <h3>使用示例</h3>
            <pre>
// 创建感知模块
auto perception = CreateModule&lt;PerceptionModule&gt;("perception");

// 创建 Channel
auto channel = Transport::CreateChannel&lt;PerceptionOutput&gt;("/perception/output");

// 创建 Writer
auto writer = channel->CreateWriter();

// 发布感知结果
PerceptionOutput output;
output.objects = DetectObjects();
writer->Write(output);
            </pre>

            <h3>API 版本</h3>
            <p>当前 API 版本：v1.0.0</p>
            <p>API 文档更新日期：2026-04-14</p>
        `,
        '快速开始示例': `
            <p>本示例将帮助您快速上手 starletto 系统。</p>

            <div class="icon-list">
                <div class="icon-item">
                    <div class="icon-item-icon">🚀</div>
                    <div class="icon-item-text">快速开始</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">📚</div>
                    <div class="icon-item-text">文档</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">💡</div>
                    <div class="icon-item-text">示例</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">❓</div>
                    <div class="icon-item-text">帮助</div>
                </div>
            </div>

            <h3>步骤 1：安装依赖</h3>
            <pre>
sudo apt update
sudo apt install build-essential cmake git
            </pre>

            <h3>步骤 2：克隆代码</h3>
            <pre>
git clone https://github.com/starletto/starletto.git
cd starletto
            </pre>

            <h3>步骤 3：编译系统</h3>
            <pre>
mkdir build && cd build
cmake ..
make -j8
            </pre>

            <h3>步骤 4：运行示例</h3>
            <pre>
./star run example
            </pre>

            <h3>步骤 5：查看结果</h3>
            <p>打开浏览器访问 http://localhost:8080 查看系统状态和可视化结果。</p>

            <div class="chart-container">
                <div class="chart-title">系统启动时间</div>
                <div class="chart-placeholder">[启动时间图表]</div>
            </div>
        `,
        '常见问题解答': `
            <div class="card-container">
                <div class="card">
                    <div class="card-title">系统启动</div>
                    <div class="card-content">解决系统启动失败的问题</div>
                </div>
                <div class="card">
                    <div class="card-title">性能优化</div>
                    <div class="card-content">提升系统性能的方法</div>
                </div>
                <div class="card">
                    <div class="card-title">传感器配置</div>
                    <div class="card-content">正确配置传感器的步骤</div>
                </div>
                <div class="card">
                    <div class="card-title">故障排除</div>
                    <div class="card-content">常见故障的解决方法</div>
                </div>
            </div>

            <h3>Q: 系统启动失败怎么办？</h3>
            <p>A: 检查日志文件，确认依赖项是否安装正确，传感器是否连接正常。</p>

            <h3>Q: 感知模块延迟过高如何解决？</h3>
            <p>A: 检查硬件性能，优化算法参数，考虑使用 GPU 加速。</p>

            <h3>Q: 如何添加新的传感器？</h3>
            <p>A: 在配置文件中添加传感器参数，实现相应的驱动接口。</p>

            <h3>Q: 系统支持哪些车型？</h3>
            <p>A: starletto 支持多种车型，包括轿车、SUV、卡车等，可通过配置文件适配不同车型。</p>

            <h3>Q: 如何贡献代码？</h3>
            <p>A: Fork 代码仓库，创建分支，提交 PR，我们会及时 review 和合并。</p>
        `,
        '数据流程设计': `
            <p>starletto 系统的数据流程设计，包括数据采集、处理和分发机制。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[数据流程图]</div>
            </div>

            <h3>数据采集</h3>
            <ul>
                <li>传感器数据采集：激光雷达、摄像头、毫米波雷达等</li>
                <li>车辆状态数据：速度、加速度、方向盘角度等</li>
                <li>地图数据：高精度地图、实时交通信息等</li>
                <li>环境数据：天气、路况、交通流量等</li>
            </ul>

            <h3>数据处理</h3>
            <ul>
                <li>数据预处理：去噪、校准、时间同步</li>
                <li>特征提取：从原始数据中提取有用信息</li>
                <li>数据融合：多传感器数据融合</li>
                <li>数据压缩：减少数据传输带宽</li>
            </ul>

            <div class="chart-container">
                <div class="chart-title">数据处理延迟</div>
                <div class="chart-placeholder">[数据处理延迟图表]</div>
            </div>
        `,
        '定位模块设计': `
            <p>高精度定位模块的详细设计，包括多源融合定位算法。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">GNSS 定位</div>
                    <div class="card-content">全球卫星导航系统定位</div>
                </div>
                <div class="card">
                    <div class="card-title">IMU 融合</div>
                    <div class="card-content">惯性测量单元数据融合</div>
                </div>
                <div class="card">
                    <div class="card-title">激光 SLAM</div>
                    <div class="card-content">基于激光雷达的定位</div>
                </div>
                <div class="card">
                    <div class="card-title">视觉 SLAM</div>
                    <div class="card-content">基于摄像头的定位</div>
                </div>
            </div>

            <h3>核心功能</h3>
            <ul>
                <li>GNSS 定位：全球卫星导航系统</li>
                <li>IMU 融合：惯性测量单元数据融合</li>
                <li>激光 SLAM：基于激光雷达的同时定位与地图构建</li>
                <li>视觉 SLAM：基于摄像头的同时定位与地图构建</li>
                <li>地图匹配：与高精度地图匹配</li>
                <li>定位精度评估：实时评估定位精度</li>
            </ul>

            <div class="chart-container">
                <div class="chart-title">定位精度对比</div>
                <div class="chart-placeholder">[定位精度对比图表]</div>
            </div>
        `,
        '控制算法': `
            <p>starletto 的控制算法模块采用先进的控制理论和工程实践，实现了高精度、高鲁棒性的车辆控制。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[控制算法流程图]</div>
            </div>

            <h3>核心控制策略</h3>
            <div class="card-container">
                <div class="card">
                    <div class="card-title">PID 控制</div>
                    <div class="card-content">自适应 PID 参数，针对不同车速和路况自动调整</div>
                </div>
                <div class="card">
                    <div class="card-title">MPC 控制</div>
                    <div class="card-content">模型预测控制，考虑车辆动力学和环境约束</div>
                </div>
                <div class="card">
                    <div class="card-title">LQR 控制</div>
                    <div class="card-content">线性二次调节器，优化控制性能和稳定性</div>
                </div>
                <div class="card">
                    <div class="card-title">滑模控制</div>
                    <div class="card-content">鲁棒控制策略，应对参数不确定性和外部干扰</div>
                </div>
            </div>

            <h3>控制目标</h3>
            <ul>
                <li><strong>轨迹跟踪</strong>：厘米级轨迹跟踪精度</li>
                <li><strong>稳定性</strong>：保证车辆在各种工况下的稳定行驶</li>
                <li><strong>舒适性</strong>：优化加速度和方向盘转角，提供平滑驾驶体验</li>
                <li><strong>安全性</strong>：避免危险操作，应对紧急情况</li>
                <li><strong>燃油经济性</strong>：优化能源消耗，提高续航里程</li>
            </ul>

            <h3>技术创新</h3>
            <ul>
                <li><strong>自适应控制</strong>：根据车辆状态和路况自动调整控制参数</li>
                <li><strong>多目标优化</strong>：平衡跟踪精度、舒适性和燃油经济性</li>
                <li><strong>鲁棒性设计</strong>：应对传感器噪声和模型不确定性</li>
                <li><strong>实时性保证</strong>：控制周期低于 10ms，确保快速响应</li>
                <li><strong>故障容错</strong>：单个传感器故障时的降级控制策略</li>
            </ul>

            <div class="chart-container">
                <div class="chart-title">控制算法性能对比</div>
                <div class="chart-placeholder">[控制算法性能对比图表]</div>
            </div>

            <h3>实际应用效果</h3>
            <ul>
                <li>高速场景：稳定的车道保持，精准的轨迹跟踪</li>
                <li>城市场景：平滑的起步停车，精确的转向控制</li>
                <li>特殊场景：紧急避障，坡道起步，湿滑路面控制</li>
                <li>多车型适配：支持轿车、SUV、卡车等多种车型</li>
            </ul>
        `,
        '场景编辑器使用': `
            <p>starletto 场景编辑器的使用方法，包括场景创建和编辑。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">场景创建</div>
                    <div class="card-content">从零开始创建新场景</div>
                </div>
                <div class="card">
                    <div class="card-title">场景编辑</div>
                    <div class="card-content">修改现有场景</div>
                </div>
                <div class="card">
                    <div class="card-title">元素添加</div>
                    <div class="card-content">添加道路、建筑、车辆等</div>
                </div>
                <div class="card">
                    <div class="card-title">参数调整</div>
                    <div class="card-content">调整环境参数和物理属性</div>
                </div>
            </div>

            <h3>使用步骤</h3>
            <ol>
                <li>启动场景编辑器：<code>./star editor</code></li>
                <li>选择场景模板或创建新场景</li>
                <li>添加道路和环境元素</li>
                <li>添加动态元素（车辆、行人等）</li>
                <li>设置场景参数（天气、时间等）</li>
                <li>保存场景配置</li>
                <li>在仿真中使用场景</li>
            </ol>

            <div class="icon-list">
                <div class="icon-item">
                    <div class="icon-item-icon">🏙️</div>
                    <div class="icon-item-text">城市场景</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🛣️</div>
                    <div class="icon-item-text">高速场景</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🏞️</div>
                    <div class="icon-item-text">乡村场景</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🚧</div>
                    <div class="icon-item-text">施工场景</div>
                </div>
            </div>
        `,
        '预测模块设计': `
            <p>障碍物行为预测模块的详细设计，包括轨迹预测和意图识别。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[预测模块架构图]</div>
            </div>

            <h3>核心功能</h3>
            <ul>
                <li>车辆轨迹预测</li>
                <li>行人行为预测</li>
                <li>交通参与者意图识别</li>
                <li>多模态预测融合</li>
                <li>预测不确定性估计</li>
            </ul>

            <div class="chart-container">
                <div class="chart-title">预测准确率</div>
                <div class="chart-placeholder">[预测准确率图表]</div>
            </div>
        `,
        '机器学习模型': `
            <p>starletto 中使用的机器学习模型，包括目标检测、语义分割等。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">目标检测</div>
                    <div class="card-content">YOLO, Faster R-CNN 等模型</div>
                </div>
                <div class="card">
                    <div class="card-title">语义分割</div>
                    <div class="card-content">DeepLab, U-Net 等模型</div>
                </div>
                <div class="card">
                    <div class="card-title">行为预测</div>
                    <div class="card-content">LSTM, Transformer 等模型</div>
                </div>
                <div class="card">
                    <div class="card-title">传感器融合</div>
                    <div class="card-content">多模态融合模型</div>
                </div>
            </div>

            <h3>模型性能</h3>
            <ul>
                <li>实时推理，延迟低于 5ms</li>
                <li>支持模型量化和加速</li>
                <li>自适应模型选择</li>
                <li>在线模型更新</li>
            </ul>
        `,
        '硬件选型指南': `
            <p>自动驾驶系统的硬件选型指南，包括传感器、计算平台等。</p>

            <div class="chart-container">
                <div class="chart-title">硬件性能对比</div>
                <div class="chart-placeholder">[硬件性能对比图表]</div>
            </div>

            <h3>传感器选型</h3>
            <ul>
                <li><strong>激光雷达</strong>：推荐 Hesai Pandar 系列或 Velodyne VLP 系列</li>
                <li><strong>摄像头</strong>：推荐 Sony IMX 系列或 ON Semiconductor AR0234</li>
                <li><strong>毫米波雷达</strong>：推荐 Continental ARS408 或 Bosch LR4</li>
                <li><strong>IMU</strong>：推荐 Xsens MTI 系列或 MicroStrain 3DM</li>
            </ul>

            <h3>计算平台</h3>
            <ul>
                <li><strong>车载计算单元</strong>：NVIDIA Drive Xavier 或 Intel Atom</li>
                <li><strong>开发平台</strong>：NVIDIA Jetson Xavier NX 或 Intel NUC</li>
                <li><strong>存储系统</strong>：NVMe SSD 或 eMMC</li>
            </ul>
        `,
        'SDK 开发指南': `
            <p>starletto SDK 的开发指南，包括如何使用 SDK 开发自定义应用。</p>

            <div class="card-container">
                <div class="card">
                    <div class="card-title">C++ SDK</div>
                    <div class="card-content">核心开发接口</div>
                </div>
                <div class="card">
                    <div class="card-title">Python SDK</div>
                    <div class="card-content">快速原型开发</div>
                </div>
                <div class="card">
                    <div class="card-title">ROS 接口</div>
                    <div class="card-content">与 ROS 系统集成</div>
                </div>
                <div class="card">
                    <div class="card-title">REST API</div>
                    <div class="card-content">Web 应用集成</div>
                </div>
            </div>

            <h3>使用示例</h3>
            <pre>
// C++ SDK 示例
#include &lt;star/sdk.h&gt;

int main() {
    // 初始化 SDK
    star::SDK sdk;

    // 创建感知模块
    auto perception = sdk.createModule("perception");

    // 订阅感知数据
    perception->subscribe([](const star::PerceptionData& data) {
        // 处理感知数据
        std::cout << "Detected " << data.objects.size() << " objects" << std::endl;
    });

    // 运行 SDK
    sdk.run();

    return 0;
}
            </pre>
        `,
        '传感器配置示例': `
            <p>不同传感器配置的示例，帮助开发者快速配置传感器。</p>

            <div class="icon-list">
                <div class="icon-item">
                    <div class="icon-item-icon">📷</div>
                    <div class="icon-item-text">单目相机</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">👁️</div>
                    <div class="icon-item-text">双目相机</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">🔄</div>
                    <div class="icon-item-text">环视相机</div>
                </div>
                <div class="icon-item">
                    <div class="icon-item-icon">📡</div>
                    <div class="icon-item-text">激光雷达</div>
                </div>
            </div>

            <h3>配置文件示例</h3>
            <pre>
# 传感器配置文件
sensors:
  cameras:
    - name: front_camera
      type: mono
      resolution: [1920, 1080]
      fps: 30
      topic: /camera/front
  lidars:
    - name: main_lidar
      type: velodyne
      model: VLP-16
      topic: /lidar/main
  radars:
    - name: front_radar
      type: continental
      model: ARS408
      topic: /radar/front
            </pre>
        `,
        '性能优化指南': `
            <p>starletto 系统的性能优化指南，帮助开发者优化系统性能。</p>

            <div class="chart-container">
                <div class="chart-title">性能优化效果</div>
                <div class="chart-placeholder">[性能优化效果图表]</div>
            </div>

            <h3>优化策略</h3>
            <ul>
                <li><strong>硬件优化</strong>：选择合适的计算平台，使用 GPU 加速</li>
                <li><strong>算法优化</strong>：优化算法复杂度，使用近似算法</li>
                <li><strong>并行计算</strong>：利用多核心和多线程</li>
                <li><strong>内存优化</strong>：减少内存分配和拷贝</li>
                <li><strong>缓存优化</strong>：提高缓存命中率</li>
            </ul>

            <h3>工具链</h3>
            <ul>
                <li><strong>性能分析</strong>：使用 perf、valgrind 等工具</li>
                <li><strong>编译优化</strong>：使用 -O3 优化级别</li>
                <li><strong>内存分析</strong>：使用 address sanitizer</li>
                <li><strong>代码分析</strong>：使用 clang-tidy、cppcheck 等工具</li>
            </ul>
        `
    },

    scroll: {
        '城市道路': `
            <p>城市道路是自动驾驶最复杂的场景之一，starletto 通过先进的感知、规划和控制算法，实现了在复杂城市场景下的安全、高效行驶。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[城市道路场景图]</div>
            </div>

            <h3>技术演示</h3>
            <p>查看城市道路场景的技术演示视频，了解 starletto 在真实场景中的表现。</p>
            <a href="demo_videos.html" class="button" style="display: inline-block; margin: 16px 0; padding: 12px 24px; border: 2px solid #000; background: #fff; color: #000; text-decoration: none; font-family: 'Apercu', sans-serif; font-weight: 700; transition: all 0.15s ease;">观看演示视频</a>

            <h3>核心挑战</h3>
            <ul>
                <li>密集交通流中的路径规划</li>
                <li>行人与非机动车行为预测</li>
                <li>红绿灯与交通标志识别</li>
                <li>窄路会车与避让策略</li>
                <li>复杂路口的通行决策</li>
            </ul>

            <h3>starletto 技术优势</h3>
            <div class="card-container">
                <div class="card">
                    <div class="card-title">多传感器融合</div>
                    <div class="card-content">激光雷达、摄像头、毫米波雷达数据融合，实现 360° 环境感知</div>
                </div>
                <div class="card">
                    <div class="card-title">行为预测</div>
                    <div class="card-content">基于深度学习的交通参与者行为预测，提前识别潜在风险</div>
                </div>
                <div class="card">
                    <div class="card-title">智能决策</div>
                    <div class="card-content">基于规则和学习的行为决策系统，应对复杂交通场景</div>
                </div>
                <div class="card">
                    <div class="card-title">精确控制</div>
                    <div class="card-content">厘米级轨迹跟踪精度，确保在狭窄空间内的安全行驶</div>
                </div>
            </div>

            <h3>应用效果</h3>
            <ul>
                <li><strong>复杂路口通行</strong>：准确识别交通信号，智能判断通行时机</li>
                <li><strong>行人避让</strong>：提前预测行人意图，实现平滑避让</li>
                <li><strong>变道超车</strong>：智能判断变道时机，安全完成超车操作</li>
                <li><strong>环岛行驶</strong>：准确识别环岛规则，安全通过复杂环岛</li>
                <li><strong>施工区域导航</strong>：识别临时交通标志，调整行驶策略</li>
            </ul>

            <h3>性能指标</h3>
            <ul>
                <li>感知延迟：&lt; 10ms</li>
                <li>规划周期：&lt; 50ms</li>
                <li>控制周期：&lt; 10ms</li>
                <li>轨迹跟踪精度：&lt; 10cm</li>
                <li>复杂场景通过率：&gt; 95%</li>
            </ul>
        `,
        '高速公路': `
            <p>高速公路是自动驾驶的重要应用场景，starletto 通过先进的规划和控制算法，实现了在高速场景下的稳定、安全、高效行驶。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[高速公路场景图]</div>
            </div>

            <h3>技术演示</h3>
            <p>查看高速公路场景的技术演示视频，了解 starletto 在高速行驶中的表现。</p>
            <a href="demo_videos.html" class="button" style="display: inline-block; margin: 16px 0; padding: 12px 24px; border: 2px solid #000; background: #fff; color: #000; text-decoration: none; font-family: 'Apercu', sans-serif; font-weight: 700; transition: all 0.15s ease;">观看演示视频</a>

            <h3>核心挑战</h3>
            <ul>
                <li>高速行驶下的实时感知</li>
                <li>智能变道与超车决策</li>
                <li>匝道汇入与驶出控制</li>
                <li>长距离续航与能耗优化</li>
                <li>恶劣天气下的鲁棒性</li>
            </ul>

            <h3>starletto 技术优势</h3>
            <div class="card-container">
                <div class="card">
                    <div class="card-title">高速感知</div>
                    <div class="card-content">远距离目标检测，支持 200m+ 感知范围</div>
                </div>
                <div class="card">
                    <div class="card-title">智能变道</div>
                    <div class="card-content">基于交通流预测的智能变道决策，提高通行效率</div>
                </div>
                <div class="card">
                    <div class="card-title">匝道控制</div>
                    <div class="card-content">精准的匝道汇入与驶出控制，确保安全平滑</div>
                </div>
                <div class="card">
                    <div class="card-title">能耗优化</div>
                    <div class="card-content">基于路况的智能速度规划，优化燃油消耗</div>
                </div>
            </div>

            <h3>应用效果</h3>
            <ul>
                <li><strong>稳定车道保持</strong>：厘米级车道中心线跟踪，即使在弯道也保持稳定</li>
                <li><strong>智能变道超车</strong>：自动识别变道时机，安全完成超车操作</li>
                <li><strong>匝道平滑汇入</strong>：精准控制速度和轨迹，实现无缝汇入主车道</li>
                <li><strong>长距离巡航</strong>：支持连续数小时的自动驾驶，减轻驾驶员疲劳</li>
                <li><strong>队列行驶</strong>：支持车辆编队行驶，提高道路通行效率</li>
            </ul>

            <h3>性能指标</h3>
            <ul>
                <li>最高支持速度：130 km/h</li>
                <li>车道保持精度：&lt; 10cm</li>
                <li>变道决策时间：&lt; 1s</li>
                <li>感知范围：&gt; 200m</li>
                <li>系统稳定性：&gt; 99.9%</li>
            </ul>
        `,
        '园区物流': `
            <p>园区物流是自动驾驶的重要应用场景，starletto 通过定制化的解决方案，实现了园区内货物的高效、安全、智能转运。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[园区物流场景图]</div>
            </div>

            <h3>技术演示</h3>
            <p>查看园区物流场景的技术演示视频，了解 starletto 在物流转运中的表现。</p>
            <a href="demo_videos.html" class="button" style="display: inline-block; margin: 16px 0; padding: 12px 24px; border: 2px solid #000; background: #fff; color: #000; text-decoration: none; font-family: 'Apercu', sans-serif; font-weight: 700; transition: all 0.15s ease;">观看演示视频</a>

            <h3>核心挑战</h3>
            <ul>
                <li>低速精准停靠与装卸</li>
                <li>多车协同调度</li>
                <li>固定路线的路径优化</li>
                <li>园区内行人安全避让</li>
                <li>24/7 连续作业可靠性</li>
            </ul>

            <h3>starletto 技术优势</h3>
            <div class="card-container">
                <div class="card">
                    <div class="card-title">精准定位</div>
                    <div class="card-content">厘米级定位精度，支持室内外无缝切换</div>
                </div>
                <div class="card">
                    <div class="card-title">协同调度</div>
                    <div class="card-content">多车智能协同，优化路径和任务分配</div>
                </div>
                <div class="card">
                    <div class="card-title">低速控制</div>
                    <div class="card-content">精准的低速控制，实现厘米级停靠精度</div>
                </div>
                <div class="card">
                    <div class="card-title">自主充电</div>
                    <div class="card-content">支持自动寻找充电桩，实现无人化运营</div>
                </div>
            </div>

            <h3>应用效果</h3>
            <ul>
                <li><strong>高效转运</strong>：自动化货物搬运，提高物流效率 30%+</li>
                <li><strong>精准停靠</strong>：厘米级停靠精度，确保装卸安全高效</li>
                <li><strong>智能调度</strong>：多车协同作业，优化园区内物流 flow</li>
                <li><strong>24/7 运营</strong>：全天候作业，提高园区运营效率</li>
                <li><strong>安全可靠</strong>：多重安全保障，确保园区内人员和设备安全</li>
            </ul>

            <h3>性能指标</h3>
            <ul>
                <li>停靠精度：&lt; 5cm</li>
                <li>作业效率：提升 30%+</li>
                <li>运行时间：24/7 连续作业</li>
                <li>安全事故率：0</li>
                <li>能源消耗：降低 20%+</li>
            </ul>
        `,
        '矿区自动驾驶': `
            <p>矿区是自动驾驶的重要应用场景，starletto 通过专门的矿区解决方案，实现了在恶劣环境下的安全、高效、可靠运营。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[矿区场景图]</div>
            </div>

            <h3>技术演示</h3>
            <p>查看矿区自动驾驶场景的技术演示视频，了解 starletto 在恶劣环境下的表现。</p>
            <a href="demo_videos.html" class="button" style="display: inline-block; margin: 16px 0; padding: 12px 24px; border: 2px solid #000; background: #fff; color: #000; text-decoration: none; font-family: 'Apercu', sans-serif; font-weight: 700; transition: all 0.15s ease;">观看演示视频</a>

            <h3>核心挑战</h3>
            <ul>
                <li>非铺装路面的定位与感知</li>
                <li>粉尘环境下的传感器鲁棒性</li>
                <li>大吨位车辆的运动控制</li>
                <li>24 小时连续作业可靠性</li>
                <li>恶劣天气条件下的运行</li>
            </ul>

            <h3>starletto 技术优势</h3>
            <div class="card-container">
                <div class="card">
                    <div class="card-title">鲁棒感知</div>
                    <div class="card-content">抗粉尘、抗振动的传感器系统，确保在恶劣环境下的可靠感知</div>
                </div>
                <div class="card">
                    <div class="card-title">精准定位</div>
                    <div class="card-content">基于多源融合的定位系统，在无 GPS 信号环境下仍保持高精度</div>
                </div>
                <div class="card">
                    <div class="card-title">重型车辆控制</div>
                    <div class="card-content">针对大吨位车辆的专门控制算法，确保安全稳定运行</div>
                </div>
                <div class="card">
                    <div class="card-title">智能调度</div>
                    <div class="card-content">基于矿区作业流程的智能调度系统，优化运输效率</div>
                </div>
            </div>

            <h3>应用效果</h3>
            <ul>
                <li><strong>安全提升</strong>：减少人为事故，提高矿区作业安全性</li>
                <li><strong>效率提高</strong>：24/7 连续作业，提高运输效率 40%+</li>
                <li><strong>成本降低</strong>：减少人力成本，降低运营成本</li>
                <li><strong>数据驱动</strong>：实时采集矿区数据，优化作业流程</li>
                <li><strong>环境适应</strong>：在粉尘、泥泞等恶劣环境下稳定运行</li>
            </ul>

            <h3>性能指标</h3>
            <ul>
                <li>定位精度：&lt; 10cm</li>
                <li>作业效率：提升 40%+</li>
                <li>运行时间：24/7 连续作业</li>
                <li>安全事故率：降低 90%+</li>
                <li>设备寿命：延长 20%+</li>
            </ul>
        `,
        '农业机械': `
            <p>农业场景下的自动驾驶，实现精准耕作和智能化管理。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[农业机械场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>农田非结构化环境导航</li>
                <li>RTK 高精度定位</li>
                <li>农机作业路径规划</li>
                <li>作物行线精准跟踪</li>
            </ul>
        `,
        '园区摆渡': `
            <p>园区摆渡场景下的自动驾驶，提供便捷的短途接驳服务。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[园区摆渡场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>固定站点精准停靠</li>
                <li>乘客上下车安全管理</li>
                <li>园区低速交通参与者避让</li>
                <li>班次调度与路径优化</li>
            </ul>
        `,
        '自主泊车': `
            <p>自主泊车场景下的自动驾驶，实现从入口到车位的全自动泊车。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[自主泊车场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>停车场内精确定位</li>
                <li>车位检测与选择</li>
                <li>窄空间内的运动规划</li>
                <li>多楼层停车场导航</li>
            </ul>
        `,
        '物流配送': `
            <p>物流配送场景下的自动驾驶，实现最后一公里的智能配送。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[物流配送场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>开放道路与小区道路混合行驶</li>
                <li>配送点精准停靠</li>
                <li>小型车辆的安全防护</li>
                <li>配送任务调度优化</li>
            </ul>
        `,
        '医疗急救': `
            <p>医疗急救场景下的自动驾驶，为急救车辆提供快速通道规划。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[医疗急救场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>紧急情况下的高速安全行驶</li>
                <li>实时交通状况感知与避让</li>
                <li>医院区域精准导航</li>
                <li>特殊车辆优先通行协调</li>
            </ul>
        `,
        '教育科研': `
            <p>教育科研场景下的自动驾驶，为高校和研究机构提供实验平台。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[教育科研场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>算法快速验证与迭代</li>
                <li>模块化架构便于教学演示</li>
                <li>仿真与实车环境无缝切换</li>
                <li>丰富的数据记录与回放</li>
            </ul>
        `,
        '共享出行': `
            <p>共享出行场景下的自动驾驶，提供按需出行服务。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[共享出行场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>多乘客调度与路径优化</li>
                <li>上下客点精准停靠</li>
                <li>车内乘客安全监控</li>
                <li>运营效率与成本平衡</li>
            </ul>
        `,
        '智慧城市': `
            <p>智慧城市场景下的自动驾驶，与城市基础设施协同运作。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[智慧城市场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>V2X 车路协同通信</li>
                <li>城市级交通调度优化</li>
                <li>多模态交通方式衔接</li>
                <li>数据安全与隐私保护</li>
            </ul>
        `,
        '长途货运': `
            <p>长途货运场景下的自动驾驶，实现干线物流的自动化运输。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[长途货运场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>长时间高速行驶的稳定性</li>
                <li>疲劳驾驶替代与安全监控</li>
                <li>编队行驶协同控制</li>
                <li>恶劣天气下的鲁棒性</li>
            </ul>
        `,
        '旅游景区': `
            <p>旅游景区场景下的自动驾驶，提供观光接驳服务。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[旅游景区场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>景区道路的精准导航</li>
                <li>游客密集区域的安全行驶</li>
                <li>观光路线的灵活调度</li>
                <li>多语言交互与导览服务</li>
            </ul>
        `,
        '零售配送': `
            <p>零售配送场景下的自动驾驶，实现商超到户的智能配送。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[零售配送场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>城市末端配送路径规划</li>
                <li>配送时效与成本优化</li>
                <li>社区门禁与电梯协同</li>
                <li>货物安全与温控管理</li>
            </ul>
        `,
        '超市购物': `
            <p>超市购物场景下的自动驾驶，提供无人购物车服务。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[超市购物场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>室内精准定位与导航</li>
                <li>人群密集区域的安全避让</li>
                <li>购物车跟随与自主返回</li>
                <li>商品识别与自动结算</li>
            </ul>
        `,
        '社区服务': `
            <p>社区服务场景下的自动驾驶，提供安防巡逻和便民服务。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[社区服务场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>社区道路的低速安全行驶</li>
                <li>安防监控与异常检测</li>
                <li>居民交互与服务响应</li>
                <li>全天候运行可靠性</li>
            </ul>
        `,
        '紧急救援': `
            <p>紧急救援场景下的自动驾驶，快速抵达灾害现场执行救援任务。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[紧急救援场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>灾害环境下的路径规划</li>
                <li>非结构化地形通过能力</li>
                <li>救援物资精准投放</li>
                <li>通信中断下的自主决策</li>
            </ul>
        `,
        '机场服务': `
            <p>机场服务场景下的自动驾驶，提供航站楼接驳和行李运输。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[机场服务场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>机场区域严格安全规范</li>
                <li>航站楼间长距离接驳</li>
                <li>行李装卸自动化</li>
                <li>与航班信息实时联动</li>
            </ul>
        `,
        '轨道交通': `
            <p>轨道交通场景下的自动驾驶，实现列车运行自动化。</p>

            <div class="architecture-diagram">
                <div class="diagram-placeholder">[轨道交通场景图]</div>
            </div>

            <h3>核心挑战</h3>
            <ul>
                <li>高密度运行下的安全间隔控制</li>
                <li>站台精准停靠</li>
                <li>信号系统协同</li>
                <li>紧急制动与故障恢复</li>
            </ul>
        `
    }
};

function showModal(title, bodyHtml) {
    const modal = document.getElementById('docModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('docModal');
    modal.classList.remove('active');
}
