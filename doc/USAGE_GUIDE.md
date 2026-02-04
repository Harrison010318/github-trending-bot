# 使用指南

## 快速开始

### 基础模式（推荐日常使用）

```bash
npm start
```

**工作流程**：
1. 抓取 GitHub Trending 列表
2. 使用基础信息生成报告
3. 发送邮件

**耗时**: ~20-30 秒

---

## 增强模式（获取仓库详细信息）

### 方式 1: 使用增强报告模板

```bash
REPORT_TYPE=enhancedReport npm start
```

**特点**：
- 自动获取前 10 个项目的详细信息
- 包含 README 摘要、特性、贡献者数等
- 生成更丰富的分析报告
- AI 能获得更多上下文进行深度分析

**耗时**: ~3-5 分钟（1 趋势请求 + 10 个仓库详情请求）

### 方式 2: 使用深度分析报告

```bash
REPORT_TYPE=insightfulReport npm start
```

**特点**：
- 获取所有项目的详细信息（最多 25 个）
- 提供行业洞察和趋势预测
- 多维度的项目价值评估
- 深层分析为主，统计为辅

**耗时**: ~5-10 分钟（1 趋势请求 + 25 个仓库详情请求）

---

## 环境变量配置

### 必需变量

```bash
# API 密钥（从 Google AI Studio 获取）
GEMINI_API_KEY=your_key_here

# Email 服务密钥（从 Resend 获取）
RESEND_API_KEY=your_key_here

# 收件人邮箱（可多个，用逗号分隔）
RECIPIENT_EMAIL=your@email.com,another@email.com
```

### 可选变量

```bash
# 报告类型：htmlReport | enhancedReport | insightfulReport
# 默认: htmlReport
REPORT_TYPE=htmlReport

# 是否获取仓库详情：true | false
# 默认: true (当 REPORT_TYPE 为增强或深度时)
ENHANCE_DETAILS=true

# 最多获取多少个项目的详情（0 表示全部）
# 默认: 10
MAX_DETAIL_PROJECTS=10

# Trending 语言过滤（留空表示所有语言）
# 示例: javascript | python | go | typescript
TRENDING_LANGUAGE=

# Trending 时间范围：daily | weekly | monthly
# 默认: daily
TRENDING_SINCE=daily
```

---

## 测试命令

### 1. 测试基础数据抓取

```bash
npm test
# 或
npm run test:simple     # 快速模式
npm run test:save       # 保存结果到文件
npm run test:output FILE_NAME  # 保存到指定文件
```

**输出信息**：
- Trending 项目列表
- 语言分布统计
- 数据格式化预览
- 提示词预览

### 2. 测试增强功能（仓库爬虫）

```bash
node src/test-enhanced.js
```

**输出信息**：
- 抓取成功数量
- 前 5 个项目列表
- 仓库详情预览
- 三种提示词的大小对比
- 令牌估算

### 3. 指定语言测试

```bash
TRENDING_LANGUAGE=python npm test
TRENDING_LANGUAGE=javascript npm test:enhanced
```

---

## 实际运行示例

### 示例 1: 日常使用（基础报告）

```bash
npm start
```

**输出日志**：
```
[INFO] 验证环境配置...
[INFO] 正在抓取 GitHub Trending 数据...
[SUCCESS] 成功抓取 11 个项目
[INFO] 格式化项目数据...
[INFO] 使用 "htmlReport" 提示词生成报告...
[SUCCESS] 报告生成成功，共 ~2000 token
[INFO] 准备发送邮件...
[SUCCESS] ✨ 任务完成！所有邮件已发送。
```

### 示例 2: 增强报告（获取详情）

```bash
REPORT_TYPE=enhancedReport MAX_DETAIL_PROJECTS=5 npm start
```

**输出日志**：
```
[INFO] 验证环境配置...
[INFO] 正在抓取 GitHub Trending 数据...
[SUCCESS] 成功抓取 11 个项目
[INFO] 开始获取前 5 个项目的详细信息...
[INFO] [1/5] 获取 thedotmack/claude-mem 的详情...
[SUCCESS]   ✅ 成功
[INFO] [2/5] 获取 masoncl/review-prompts 的详情...
[SUCCESS]   ✅ 成功
...
[INFO] 格式化项目数据...
[INFO] 使用 "enhancedReport" 提示词生成报告...
[SUCCESS] 报告生成成功，共 ~5000 token
[SUCCESS] ✨ 任务完成！所有邮件已发送。
```

### 示例 3: 深度分析（所有项目）

```bash
REPORT_TYPE=insightfulReport MAX_DETAIL_PROJECTS=0 npm start
```

---

## GitHub Actions 自动化

### 编辑工作流文件

`.github/workflows/daily.yml` - 修改环境变量：

```yaml
env:
  REPORT_TYPE: enhancedReport        # 改为增强报告
  MAX_DETAIL_PROJECTS: 10            # 获取 10 个项目的详情
```

### 日程设置

默认每天 9 AM 运行（北京时间）：

```yaml
schedule:
  - cron: '0 1 * * *'  # UTC 1:00 = 北京时间 9:00
```

修改时间：

```yaml
# 每天 18:00（北京时间 18:00）
schedule:
  - cron: '10 10 * * *'  # UTC 10:10 = 北京时间 18:10
```

---

## 常见问题

### Q1: 运行时报网络错误怎么办？

**检查代理配置**：
```bash
# 查看当前代理
git config --get https.proxy

# 配置代理
git config --global https.proxy http://127.0.0.1:7890

# 运行命令时使用代理
export https_proxy=http://127.0.0.1:7890
npm start
```

### Q2: 增强模式太慢了？

**解决方案**：
1. 减少获取详情的项目数：`MAX_DETAIL_PROJECTS=5 npm start`
2. 使用基础模式：`REPORT_TYPE=htmlReport npm start`
3. 检查网络连接速度

### Q3: 某个仓库爬虫失败了？

**这是正常的**：
- 单个仓库失败不影响整体流程
- 该项目会使用基础信息继续生成报告
- AI 会自动调整输出

### Q4: 如何仅测试不发送邮件？

```bash
npm test                    # 查看预览
npm run test:save           # 保存到文件
npm run test:output results.txt
```

### Q5: 令牌用量太多了？

```bash
# 方案 1: 使用基础报告（最省 token）
REPORT_TYPE=htmlReport npm start

# 方案 2: 只获取前 3 个项目的详情
MAX_DETAIL_PROJECTS=3 npm start

# 方案 3: 检查当前用量
node -e "
const text = require('fs').readFileSync('.env.local', 'utf8');
const key = text.match(/GEMINI_API_KEY=(.+)/)[1];
console.log('API 密钥末尾:', key.slice(-4));
console.log('请访问 https://aistudio.google.com/app/apikey 查看用量');
"
```

---

## 工作流总结

```
┌─────────────────────────────────┐
│   启动程序 (npm start)           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   验证环境变量                   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   抓取 Trending 列表              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   REPORT_TYPE = htmlReport?      │
├─────────────┬───────────────────┤
│  是 (跳过)  │  否 (需要详情)    │
│             │                   │
│             ▼                   │
│   ┌─────────────────────────┐   │
│   │ 批量爬取仓库详情        │   │
│   │ (前 MAX_DETAIL_PROJECTS) │   │
│   └─────────┬───────────────┘   │
│             │                   │
└─────────────┼───────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   格式化项目数据                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   AI 生成报告 (Gemini API)       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   发送邮件 (Resend API)          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   完成 ✨                        │
└─────────────────────────────────┘
```

---

**更多信息**：
- [分支指南](./BRANCH_GUIDE.md)
- [代码重构说明](./代码重构说明.md)
- [功能扩展说明](./功能扩展说明.md)
