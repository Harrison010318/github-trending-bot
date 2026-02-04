// 主程序入口 - 重构版本
require('dotenv').config({ path: '.env.local' });

const { fetchTrending, formatProjectsText } = require('./services/scraper');
const AIService = require('./services/ai');
const EmailService = require('./services/email');
const { validateEnv } = require('./utils/validator');
const logger = require('./utils/logger');

/**
 * 主函数
 */
async function main() {
  try {
    // 1. 验证环境变量
    logger.info('验证环境配置...');
    validateEnv();
    
    // 2. 初始化服务
    const aiService = new AIService(process.env.GEMINI_API_KEY);
    const emailService = new EmailService(process.env.RESEND_API_KEY);
    
    // 3. 抓取 GitHub Trending 数据
    const projects = await fetchTrending();
    
    if (projects.length === 0) {
      throw new Error('没有抓取到任何项目数据');
    }
    
    // 4. 格式化项目数据
    const projectsText = formatProjectsText(projects);
    
    // 5. 使用 AI 生成报告
    // 可以通过环境变量 REPORT_TYPE 选择不同的提示词模板
    const reportType = process.env.REPORT_TYPE || 'htmlReport';
    const html = await aiService.generateReport(projectsText, reportType);
    
    // 6. 发送邮件
    // 支持多个收件人（用逗号分隔）
    const recipients = process.env.RECIPIENT_EMAIL.split(',').map(e => e.trim());
    
    if (recipients.length === 1) {
      await emailService.sendHtml(recipients[0], html);
    } else {
      await emailService.sendBatch(recipients, html);
    }
    
    logger.success('✨ 任务完成！所有邮件已发送。');
    
  } catch (error) {
    logger.error('程序执行失败:', error.message);
    if (error.stack) {
      logger.debug('错误堆栈:', error.stack);
    }
    process.exit(1);
  }
}

// 执行主函数
main();
