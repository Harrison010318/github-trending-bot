# 分支指南

## 分支列表

### main (主分支)
- **描述**: 稳定的生产分支，包含代码重构后的模块化架构
- **最新提交**: `1493708` - refactor: 代码重构 - 模块化、配置管理、错误处理优化
- **状态**: 可用于生产部署

### feature/enhanced-scraping (开发分支)
- **描述**: 扩展数据抓取功能分支，添加了仓库详情爬虫和增强提示词
- **最新提交**: `96b9e71` - feat: 增强数据抓取 - 添加仓库详情爬虫和增强提示词
- **创建时间**: 基于 main 分支
- **状态**: 开发中，待测试和验证

## feature/enhanced-scraping 分支介绍

### 新增功能

#### 1. 仓库详情爬虫 (src/services/repository-fetcher.js)
- **目的**: 爬取个别 GitHub 仓库页面，获取详细信息
- **主要函数**:
  - `fetchRepositoryDetails(repoUrl)`: 抓取单个仓库的详细信息
  - `extractReadmeExcerpt($)`: 提取 README 前 200 字符
  - `extractFeatures($)`: 提取"Features"/"功能"部分（最多 5 项）
  - `extractLastUpdated($)`: 解析最后更新时间
  - `extractContributorsCount($)`: 统计贡献者数量

- **提取数据**:
  - description: 仓库描述
  - topics: 主题标签
  - features: 功能特性列表
  - contributors: 贡献者数量
  - readmeExcerpt: README 摘要
  - lastUpdated: 最后更新时间
  - archived: 是否已归档

#### 2. 增强提示词 (src/config/prompts-enhanced.js)
- **enhancedReport**: 结合基础信息和仓库详情，生成平衡的报告
- **insightfulReport**: 深度分析，提供趋势洞察和多维价值评估
- **htmlReport**: 原始提示词（保持向后兼容）

#### 3. 测试工具 (src/test-enhanced.js)
- 测试仓库爬虫功能
- 批量获取仓库详情（支持并发控制和速率限制）
- 比较三种提示词类型的令牌使用情况
- 展示详细的错误处理

### 使用方法

#### 运行基础测试
```bash
node src/test.js              # 查看基础数据采集
node src/test.js --simple     # 快速项目列表
node src/test.js --save       # 保存到 test-results.txt
```

#### 运行增强功能测试
```bash
node src/test-enhanced.js     # 完整测试（包括仓库爬虫）
npm run test:enhanced         # 快速命令（如果已配置）
```

#### 指定提示词类型运行
```bash
REPORT_TYPE=enhancedReport npm start    # 使用增强报告
REPORT_TYPE=insightfulReport npm start  # 使用洞察报告
REPORT_TYPE=htmlReport npm start        # 使用基础报告
```

### 文件结构

```
feature/enhanced-scraping
├── src/
│   ├── services/
│   │   ├── scraper.js (原有)
│   │   ├── ai.js (原有，支持 promptType)
│   │   ├── email.js (原有)
│   │   └── repository-fetcher.js (新增) ⭐
│   ├── config/
│   │   ├── index.js (原有)
│   │   ├── prompts.js (原有)
│   │   └── prompts-enhanced.js (新增) ⭐
│   ├── utils/ (原有)
│   ├── index.js (原有)
│   └── test-enhanced.js (新增) ⭐
├── doc/
│   └── BRANCH_GUIDE.md (本文件)
├── package.json (可能更新)
└── ...

```

### 性能考虑

- **超时设置**: 每个请求 10 秒超时
- **并发控制**: 批量获取时每次 3 个请求，500ms 延迟
- **错误处理**: 单个仓库失败不影响其他请求（优雅降级）
- **估计耗时**: 
  - 基础爬虫：20-30 秒
  - 增强爬虫（10 个仓库）：25-60 秒
  - 总执行时间：1-2 分钟（日常可接受）

### 集成检查清单

在合并到 main 分支前，确保完成以下检查：

- [ ] 基础测试通过：`npm test`
- [ ] 增强功能测试通过：`npm run test:enhanced`
- [ ] 三种报告类型都能正常生成
- [ ] 网络错误处理正确（如超时、连接失败）
- [ ] 令牌使用量在预期范围内
- [ ] 环境变量配置齐全（GEMINI_API_KEY, RESEND_API_KEY, RECIPIENT_EMAIL）
- [ ] 代码审查通过
- [ ] 文档更新完成

### 合并策略

**推荐流程**:
1. 在 feature/enhanced-scraping 上完成开发和测试
2. 创建 Pull Request 到 main 分支
3. 通过代码审查后合并
4. 更新 GitHub Actions 中的 REPORT_TYPE 环境变量
5. 监控第一次自动执行

**回滚计划**:
- 如果增强爬虫出现问题，可设置 `REPORT_TYPE=htmlReport` 立即回到基础报告
- 保留 `htmlReport` 提示词确保向后兼容性

## 与 main 分支的差异

### 新增文件 (3 个)
- `src/services/repository-fetcher.js`
- `src/config/prompts-enhanced.js`
- `src/test-enhanced.js`

### 修改文件 (1 个)
- `src/services/ai.js`: 增加 promptType 参数支持

### 总变更
- **文件数**: +3 新增
- **代码行数**: +1810 行
- **关键新增**: 仓库爬虫、增强提示词、测试工具

## 后续计划

### Phase 1: 验证（当前）
- ✅ 实现仓库爬虫功能
- ✅ 创建增强提示词
- ⏳ 执行功能测试
- ⏳ 验证数据质量和性能

### Phase 2: 集成
- 修改 src/index.js 支持 REPORT_TYPE 选择
- 实现 REPORT_TYPE 到提示词的映射
- 添加配置项控制爬取策略

### Phase 3: 优化
- 实现缓存机制（避免重复爬取）
- 性能分析和优化
- 并发请求的自适应调整

### Phase 4: 生产
- 合并到 main 分支
- 更新 GitHub Actions 工作流
- 监控和维护

---

**作者**: GitHub Trending Bot 开发团队  
**最后更新**: 当前日期  
**相关文档**: 
- [代码重构说明](./代码重构说明.md)
- [测试接口说明](./测试接口说明.md)
- [功能扩展说明](./功能扩展说明.md)
