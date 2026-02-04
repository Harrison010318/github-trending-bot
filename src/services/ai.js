// AI 内容生成服务
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const prompts = require('../config/prompts');
const logger = require('../utils/logger');

/**
 * AI 服务类
 */
class AIService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API Key 未提供');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.ai.model 
    });
  }

  /**
   * 生成 HTML 报告
   * @param {string} projectsText - 格式化的项目文本
   * @param {string} promptType - 提示词类型 (htmlReport, simplifiedReport, englishReport)
   * @returns {Promise<string>} 生成的 HTML
   */
  async generateReport(projectsText, promptType = 'htmlReport') {
    logger.info('正在使用 Gemini 生成趋势报告...');
    
    const prompt = prompts[promptType](projectsText);
    
    for (let attempt = 1; attempt <= config.ai.maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const html = response.text();
        
        if (!html || html.length === 0) {
          throw new Error('生成的 HTML 报告为空');
        }
        
        logger.success(`报告生成成功，大小: ${html.length} 字符`);
        return html;
        
      } catch (error) {
        logger.warn(`生成报告失败 (尝试 ${attempt}/${config.ai.maxRetries}):`, error.message);
        
        if (attempt === config.ai.maxRetries) {
          throw new Error(`AI 生成失败: ${error.message}`);
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, config.ai.retryDelay));
      }
    }
  }
}

module.exports = AIService;
