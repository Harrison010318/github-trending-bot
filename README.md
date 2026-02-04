# GitHub 趋势早报机器人

每天自动获取 GitHub Trending 热门项目，由 Gemini AI 生成中文摘要报告并通过邮件发送。

## 功能特点

- 🤖 使用 **Gemini 1.5 Pro** 模型智能分析 GitHub 趋势
- 📧 通过 **Resend** 自动发送精美的 HTML 格式日报
- ⏰ GitHub Actions 每天自动运行，无需手动操作
- 🔒 安全的环境变量管理

## 快速开始

### 1. 准备 API Keys

你需要获取以下两个 API Key：

- **Gemini API Key**: 访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取
- **Resend API Key**: 访问 [Resend Dashboard](https://resend.com/api-keys) 获取

### 2. 修改配置

编辑 [index.js](index.js#L35) 文件，将收件邮箱修改为你的邮箱：

```javascript
to: ['你的邮箱地址@example.com'], // 替换成你接收日报的邮箱
```

### 3. 配置 GitHub Secrets

1. 将代码推送到 GitHub 仓库
2. 进入仓库的 **Settings** → **Secrets and variables** → **Actions**
3. 添加以下两个 secrets：
   - `GEMINI_API_KEY`: 你的 Gemini API Key
   - `RESEND_API_KEY`: 你的 Resend API Key

### 4. 测试运行

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 选择 "Daily Trending Job" 工作流
3. 点击 **Run workflow** 手动触发测试
4. 几分钟后检查你的邮箱

## 自动运行时间

工作流配置为每天北京时间早上 9:00 (UTC 1:00) 自动运行。

如需修改运行时间，编辑 [.github/workflows/daily.yml](.github/workflows/daily.yml#L3) 中的 cron 表达式。

## 自定义提示词

你可以修改 [index.js](index.js#L15) 中的 `prompt` 变量，让 AI 关注特定领域的项目，例如：

```javascript
const prompt = `
  请执行以下任务：
  1. 搜索今天 GitHub Trending 榜单上与"人工智能"相关的最热门的 5 个项目。
  2. 针对每个项目，提供：项目名称、核心功能简介、Star 增长情况、以及为什么它值得关注。
  3. 以 HTML 格式输出一份排版美观的日报。
  请使用中文输出。
`;
```

## 本地测试

确保设置了环境变量后，可以本地运行测试：

```bash
export GEMINI_API_KEY="你的key"
export RESEND_API_KEY="你的key"
node index.js
```

## 项目结构

```
github-trending-bot/
├── index.js                 # 核心逻辑
├── package.json            # 依赖配置
├── .github/
│   └── workflows/
│       └── daily.yml       # GitHub Actions 配置
└── README.md               # 说明文档
```

## 依赖

- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) - Google Gemini AI SDK
- [resend](https://www.npmjs.com/package/resend) - 邮件发送服务

## 常见问题

**Q: 为什么没有收到邮件？**
- 检查 GitHub Actions 运行日志是否有报错
- 确认 Secrets 配置正确
- 检查邮箱的垃圾邮件文件夹

**Q: 如何修改发件人地址？**
- Resend 免费账户只能使用 `onboarding@resend.dev`
- 需要验证自己的域名才能使用自定义发件人地址

**Q: 可以发送给多个邮箱吗？**
- 可以，修改 `to` 数组添加多个邮箱地址：
  ```javascript
  to: ['email1@example.com', 'email2@example.com']
  ```

## License

MIT
