# Solaris Explorer Development Log

该文档用于持续记录项目开发状态，便于换设备或中断后快速恢复上下文。

## 使用规则

- 每次完成一个明确需求后，追加一条记录。
- 每条记录至少包含：日期、目标、实现内容、涉及文件、验证结果、后续建议。
- 优先记录架构变化、关键 shader、交互入口、已知限制。

## 当前项目概览

- 项目名称：`nasa-solar-visualization`
- 技术栈：`React 19`、`TypeScript`、`Vite`、`Three.js`、`React Three Fiber`、`@react-three/drei`、`@react-three/postprocessing`
- 当前目标：构建 NASA 风格太阳 3D 可视化站点 `Solaris Explorer`

## 2026-07-07 初始化阶段

### 目标

创建 React + Three.js + TypeScript 基础项目，并搭建第一版太阳可视化场景。

### 实现内容

- 初始化 `Vite + React + TypeScript` 项目。
- 接入 `React Three Fiber`、`OrbitControls`、`Bloom` 后处理。
- 创建深空背景、基础场景光照和太阳主体组件。
- 建立 `scene / objects / shaders / postprocessing / ui` 目录结构。

### 关键文件

- `src/App.tsx`
- `src/components/scene/SolarCanvas.tsx`
- `src/components/postprocessing/SolarEffects.tsx`
- `src/styles/index.css`

### 验证

- `npm install`
- `npm run build`

### 备注

- 后续扩展方向已按组件分层预留，适合继续增加 `Corona`、`Flare`、`CME`。

## 2026-07-07 第二阶段 Photosphere

### 目标

实现真实太阳光球层 `Photosphere`，替换普通太阳材质。

### 实现内容

- 新增独立组件 `Photosphere.tsx`。
- 拆分 shader 为：
  - `src/shaders/photosphere.vert`
  - `src/shaders/photosphere.frag`
- 基于程序化噪声实现太阳颗粒 `Granulation`。
- 加入动态流动、表面位移、自转和 limb darkening。
- 保留 HDR Bloom。

### 关键视觉特征

- 颗粒中心亮、边缘暗。
- 表面是对流沸腾的等离子体，而不是岩浆贴图或普通噪声球。
- 太阳自转采用真实参数 `27 天一圈`，但可视化速度做了压缩，便于观察。

### 关键文件

- `src/components/objects/Photosphere.tsx`
- `src/shaders/photosphere.vert`
- `src/shaders/photosphere.frag`
- `src/components/objects/Sun.tsx`

### 验证

- `npm run build`

## 2026-07-07 第三阶段 Solar Interior Mode

### 目标

增加太阳内部结构展示模式 `Solar Interior Mode`。

### 实现内容

- 在 `App.tsx` 提升模式状态。
- 新增 UI 切换按钮：`内部结构`
- 在 `Normal Mode` 和 `Interior Mode` 间切换。
- 光球层进入内部模式时降低透明度。
- 新增三层内部结构球体：
  - `Core`
  - `Radiative Zone`
  - `Convection Zone`
- 为三层分别创建独立 shader。

### 关键文件

- `src/components/ui/ModeToggle.tsx`
- `src/components/objects/SolarInterior.tsx`
- `src/shaders/interiorLayer.vert`
- `src/shaders/coreLayer.frag`
- `src/shaders/radiativeZone.frag`
- `src/shaders/convectionZone.frag`
- `src/components/ui/StageLabel.tsx`

### 验证

- `npm run build`

### 备注

- 内部结构保持科学分层表现，没有引入机械或科幻结构。

## 2026-07-07 第四阶段 Solar Corona

### 目标

实现真实太阳日冕 `Corona` 系统。

### 实现内容

- 新增独立组件 `Corona.tsx`。
- 新增体积片元着色器 `src/shaders/corona.frag`。
- 采用外层壳体 + ray marching 方式模拟透明等离子体。
- 使用 Curl Noise 形成流动气体与磁场弧状结构。
- 使用 Fresnel 增强太阳边缘辉光。
- 颜色从中心白黄色过渡到外围橙红透明。
- 使用多尺度噪声：
  - Large：整体云雾
  - Medium：等离子体流
  - Small：细节

### 关键文件

- `src/components/objects/Corona.tsx`
- `src/shaders/corona.frag`
- `src/components/objects/Sun.tsx`

### 验证

- `npm run build`

### 已知情况

- 构建可通过。
- 目前仍有 Vite 的 chunk size warning，不影响运行。

## 2026-07-07 工程维护

### 目标

补充基础工程忽略规则，避免构建产物和本地文件进入版本控制。

### 实现内容

- 新增 `.gitignore`
- 忽略依赖、构建产物、日志、IDE 配置、环境变量文件等

### 关键文件

- `.gitignore`

## 当前建议的接手顺序

1. 先看 `src/App.tsx`，理解全局模式切换入口。
2. 再看 `src/components/scene/SolarCanvas.tsx`，确认场景装配顺序。
3. 然后按对象层阅读：
   - `src/components/objects/Sun.tsx`
   - `src/components/objects/Photosphere.tsx`
   - `src/components/objects/SolarInterior.tsx`
   - `src/components/objects/Corona.tsx`
4. 最后看 `src/shaders/` 下对应 shader，理解每个视觉模块的实现细节。

## 当前可继续开发的方向

- `Solar Flare`
- `CME`
- 日冕磁力线可视化
- 科学参数面板
- 时间流速控制
- 分包优化与性能调优
