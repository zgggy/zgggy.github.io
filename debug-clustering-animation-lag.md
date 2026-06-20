# Debug Session: clustering-animation-lag
- **Status**: [OPEN]
- **Issue**: 聚类动画在迁移阶段仍然卡顿，且点亮状态没有在移动过程中逐渐熄灭
- **Debug Server**: http://127.0.0.1:7778/event
- **Log File**: .dbg/trae-debug-log-clustering-animation-lag.ndjson

## Reproduction Steps
1. 打开首页并让聚类可视化出现。
2. 等待一轮聚类播放完成，观察点云迁移到新位置的过程。
3. 关注两个现象：
   - 迁移动画是否明显卡顿。
   - 点从高亮状态进入迁移时，是否逐步熄灭。

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | 迁移阶段仍然在做过多逐帧绘制，导致帧耗时在 transition 阶段显著升高 | High | Med | Rejected: `drawCostMs` 在 transition 期间仅约 `0.1-0.7ms` |
| B | 点亮状态的目标值虽然有衰减逻辑，但没有真正参与 transition 阶段的可视化输出 | High | Med | Partially Confirmed: `currentLight` 从 `0.28 -> 0.005`，但 `transitionProgress` 只按大步跳变，视觉上不连续 |
| C | 波纹与点绘制使用了不同的坐标/时间基准，导致视觉上看起来像“没有慢慢熄掉” | Med | Med | Rejected: transition 期间 `rippleCount=0`，与当前问题无关 |
| D | 活跃邻居集合或队列状态在进入 transition 时没有完全清空，造成迁移期间仍有额外高亮开销 | Med | Low | Rejected: `activeNeighborCount=0` 且 `queuedCount=0` |
| E | 真正卡顿来自 requestAnimationFrame 主循环中每帧对象分配或数组过滤，而不是 canvas fill 本身 | Med | Med | Confirmed Root Cause: `transition-sample` 只每约 `180ms` 记录一次，说明位置与亮度共享了步进式更新节奏 |

## Log Evidence
- `draw-sample` in transition: `drawCostMs=0.1-0.7`, `pointCount=42`, `rippleCount=0`
- `transition-sample`: `elapsed=179 -> eased=0.455`, `elapsed=360 -> eased=0.747`, `elapsed=541 -> eased=0.910`
- `light-sample`: `currentLight=0.28 -> 0.26 -> 0.141 -> 0.064 -> 0.022 -> 0.005`
- Conclusion: draw cost is low, but transition progress updates in coarse steps, causing visibly choppy movement and stepped fade-out

## Verification Conclusion
- Minimal fix applied: update transition on every animation frame in `startAnimation()`, while keeping DBSCAN step playback under `stepInterval`
- Pre-fix evidence:
  - `transition-sample` first appears at `elapsed=179ms`
  - `transitionProgress` and `currentLight` change in coarse jumps
- Post-fix evidence:
  - `transition-sample` begins at `elapsed=6ms`
  - `draw-sample` during transition shows `transitionProgress=0.537 -> 0.836 -> 0.967 -> 0.999`
  - `light-sample` during transition shows `currentLight=0.175 -> 0.085 -> 0.033 -> 0.008 -> 0.001`
- Conclusion: transition movement and fade now update continuously rather than in `180ms` steps
