// 加载 .env.local 文件中的环境变量（必须在文件最开始）
require('dotenv').config({ path: '.env.local' });

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Resend } = require("resend");
const cheerio = require("cheerio");

// 1. 配置 Key(通过环境变量读取,保证安全)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// 抓取 GitHub Trending 数据
async function fetchGitHubTrending() {
  try {
    console.log("正在抓取 GitHub Trending 数据...");
    const response = await fetch("https://github.com/trending");
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const projects = [];
    $("article.Box-row").each((index, element) => {
      const $article = $(element);
      const name = $article.find("h2 a").text().trim().replace(/\s+/g, " ");
      const url = "https://github.com" + $article.find("h2 a").attr("href");
      const description = $article.find("p").text().trim() || "暂无描述";
      const language = $article.find('[itemprop="programmingLanguage"]').text().trim() || "未指定";
      const stars = $article.find(".octicon-star").parent().text().trim();
      const todayStars = $article.find(".float-sm-right").text().trim();
      
      projects.push({
        name,
        url,
        description,
        language,
        stars,
        todayStars
      });
    });
    
    console.log(`成功抓取到 ${projects.length} 个项目`);
    return projects;
  } catch (error) {
    console.error("抓取 GitHub Trending 失败:", error.message);
    throw error;
  }
}

async function run() {
  try {
    // 检查 API Key 是否设置
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY 环境变量未设置");
    }
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY 环境变量未设置");
    }
    if (!process.env.RECIPIENT_EMAIL) {
      throw new Error("RECIPIENT_EMAIL 环境变量未设置");
    }

    // 2. 抓取真实的 GitHub Trending 数据
    const projects = await fetchGitHubTrending();
    
    if (projects.length === 0) {
      throw new Error("没有抓取到任何项目数据");
    }

    // 3. 初始化 Gemini 模型（使用 Flash 模型，免费额度更高）
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });

    // 4. 让 Gemini 将数据格式化为精美的 HTML 报告
    const projectsText = projects.map((p, i) => 
      `${i + 1}. 项目名称：${p.name}
         GitHub 链接：${p.url}
         项目描述：${p.description}
         主要语言：${p.language}
         总获赞数：${p.stars}
         今日新增：${p.todayStars}`
    ).join("\n\n");

    const prompt = `
你是一位资深的开发者和技术内容专家。现在我需要你将以下今天的 GitHub Trending 榜单数据转换为一份专业的、高质量的 HTML 日报。

【数据】
${projectsText}

【具体要求】

1. 【整体布局】
   - 创建一个响应式的、适合邮件阅读的 HTML 页面
   - 使用现代的设计风格，配色方案为深蓝/青色主题
   - 页面宽度为 600px（邮件标准宽度），所有样式使用内联 CSS

2. 【页面结构】
   - 顶部：日期标题和副标题（"GitHub Trending Daily Report"）
   - 中间：项目卡片列表（按排名显示）
   - 底部：统计摘要和订阅信息

3. 【项目卡片样式】
   - 每个项目使用卡片式设计，卡片间有明显的视觉分隔
   - 卡片背景为白色，阴影效果，圆角设计
   - 排名号使用彩色圆形徽章（#FF6B6B、#4ECDC4、#45B7D1 等循环）

4. 【每张卡片的内容结构】
   排名号 + 项目名称（蓝色可点击链接）
   ├─ 📊 核心亮点（2-3 句话，总结为什么这个项目在 Trending 中脱颖而出）
   ├─ 📝 项目描述（原始描述）
   ├─ 🛠️ 技术栈（主要编程语言）
   ├─ ⭐ Stars 统计（总数 + 今日新增，用醒目的数字突出显示）
   └─ 🔗 GitHub 链接

5. 【亮点总结的智能分析】
   对于每个项目，根据其描述、语言、Stars 增长数据，分析出其核心竞争力，例如：
   - 如果是 AI/ML 相关：强调技术创新和应用价值
   - 如果 Stars 增长快：强调社区热度和实用价值
   - 如果是工具类：强调解决的实际问题
   - 如果是框架类：强调开发效率提升

6. 【颜色和排版】
   - 使用渐变色背景（浅灰到白色）
   - 标题使用深蓝色（#1F3A5F）
   - 链接使用青色（#4ECDC4）
   - 数字使用鲜艳颜色突出（如 #FF6B6B）
   - 使用不同的字体大小和粗细来建立视觉层级

7. 【信息密度】
   - 每个卡片信息完整但不冗长
   - 使用图标或符号快速识别不同的信息类型
   - 关键数据（Stars、今日增长）必须清晰可见

8. 【邮件友好性】
   - 所有样式必须兼容 Gmail、Outlook 等邮件客户端
   - 不使用外部 JavaScript 或媒体查询
   - 使用 Web-safe 字体（Arial, Helvetica, sans-serif 等）
   - 确保文本对比度足够高

9. 【最后的总结区域】
   - 在所有项目下方添加一个统计摘要：
     * 本日共抓取 X 个热门项目
     * Stars 最多的项目
     * 今日增长最快的项目
     * 涵盖的主要技术领域

10. 【语言】
    全部使用中文输出，表达专业、准确、有吸引力。

请生成完整的 HTML 代码，确保代码可以直接在邮件中渲染，展示出专业、美观、信息丰富的效果。
    `;

    console.log("正在使用 Gemini 生成趋势报告...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryHtml = response.text();

    // 5. 通过 Resend 发送邮件
    console.log("正在发送邮件...");
    console.log(`HTML 报告大小: ${summaryHtml.length} 字符`);
    
    // 确保 HTML 是字符串且不为空
    if (!summaryHtml || summaryHtml.length === 0) {
      throw new Error("生成的 HTML 报告为空");
    }
    
    const { data, error } = await resend.emails.send({
      from: 'GitHub Daily <onboarding@resend.dev>',
      to: [process.env.RECIPIENT_EMAIL],
      subject: `今日 GitHub 趋势早报 - ${new Date().toLocaleDateString('zh-CN')}`,
      html: summaryHtml,
    });

    if (error) {
      console.error("邮件发送失败详情:", JSON.stringify(error, null, 2));
      // 尝试发送纯文本版本作为备选
      console.log("尝试以纯文本形式重新发送...");
      const { data: textData, error: textError } = await resend.emails.send({
        from: 'GitHub Daily <onboarding@resend.dev>',
        to: [process.env.RECIPIENT_EMAIL],
        subject: `今日 GitHub 趋势早报 - ${new Date().toLocaleDateString('zh-CN')}`,
        text: `今日 GitHub Trending 日报\n\n已抓取 ${projects.length} 个项目。请查看完整的 HTML 版本邮件。`,
      });
      
      if (textError) {
        return console.error("纯文本邮件也发送失败:", textError);
      }
      return console.log("已以纯文本形式发送。ID:", textData.id);
    }
    console.log("任务完成！邮件已发送。ID:", data.id);

  } catch (err) {
    console.error("执行过程中出错:", err.message);
    if (err.cause) {
      console.error("详细错误:", err.cause);
    }
    process.exit(1);
  }
}

run();
