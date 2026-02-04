// 主程序入口 - 重构版本（支持仓库详情增强）
require('dotenv').config({ path: '.env.local' });

const { fetchTrending, formatProjectsText } = require('./services/scraper');
const { fetchRepositoryDetails } = require('./services/repository-fetcher');
const AIService = require('./services/ai');
const EmailService = require('./services/email');
const { validateEnv } = require('./utils/validator');
const logger = require('./utils/logger');

/**
 * 批量获取仓库详情
 * @param {Array} projects - 项目列表
 * @param {number} maxProjects - 最多获取多少个项目的详情（0 表示全部）
 * @returns {Promise<Array>} 包含详情的项目列表
 */
async function enrichProjectsWithDetails(projects, maxProjects = 0) {
  const targetCount = maxProjects > 0 ? Math.min(maxProjects, projects.length) : projects.length;
  
  logger.info(`开始获取前 ${targetCount} 个项目的详细信息...`);
  
  const enriched = [];
  
  for (let i = 0; i < targetCount; i++) {
    const project = projects[i];
    
    try {
      logger.info(`[${i + 1}/${targetCount}] 获取 ${project.name} 的详情...`);
      const details = await fetchRepositoryDetails(project.url);
      
      if (details) {
        enriched.push({
          ...project,
          details
        });
        logger.success(`  ✅ 成功`);
      } else {
        enriched.push(project);
        logger.warn(`  ⚠️  部分信息未获取`);
      }
      
      // 添加延迟，避免请求过于频繁
      if (i < targetCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      logger.warn(`  ❌ 失败: ${error.message}`);
      enriched.push(project);
    }
  }
  
  // 补充其他项目（不获取详情）
  for (let i = targetCount; i < projects.length; i++) {
    enriched.push(projects[i]);
  }
  
  return enriched;
}

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
    logger.info('正在抓取 GitHub Trending 数据...');
    const projects = await fetchTrending();
    
    if (projects.length === 0) {
      throw new Error('没有抓取到任何项目数据');
    }
    
    logger.success(`成功抓取 ${projects.length} 个项目`);
    
    // 4. 根据报告类型决定是否获取仓库详情
    const reportType = process.env.REPORT_TYPE || 'htmlReport';
    const enhanceDetails = process.env.ENHANCE_DETAILS !== 'false';
    const maxDetailProjects = parseInt(process.env.MAX_DETAIL_PROJECTS || '10');
    
    let enrichedProjects = projects;
    
    if (enhanceDetails && (reportType === 'enhancedReport' || reportType === 'insightfulReport')) {
      enrichedProjects = await enrichProjectsWithDetails(projects, maxDetailProjects);
    }
    
    // 5. 格式化项目数据
    logger.info('格式化项目数据...');
    const projectsText = formatProjectsText(enrichedProjects);
    
    // 6. 使用 AI 生成报告
    logger.info(`使用 "${reportType}" 提示词生成报告...`);
    const html = await aiService.generateReport(projectsText, reportType);
    
    // 7. 发送邮件
    logger.info('准备发送邮件...');
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
