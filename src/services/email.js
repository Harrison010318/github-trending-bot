// 邮件发送服务
const { Resend } = require('resend');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 邮件服务类
 */
class EmailService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Resend API Key 未提供');
    }
    this.resend = new Resend(apiKey);
  }

  /**
   * 发送 HTML 邮件
   * @param {string} to - 收件人邮箱
   * @param {string} html - HTML 内容
   * @param {string} subject - 邮件主题（可选）
   * @returns {Promise<object>} 发送结果
   */
  async sendHtml(to, html, subject = null) {
    if (!to) {
      throw new Error('收件人邮箱未提供');
    }
    
    const emailSubject = subject || config.email.subjectTemplate(
      new Date().toLocaleDateString(config.app.locale)
    );
    
    logger.info(`正在发送邮件到: ${to}`);
    
    try {
      const { data, error } = await this.resend.emails.send({
        from: config.email.from,
        to: [to],
        subject: emailSubject,
        html: html
      });
      
      if (error) {
        logger.error('邮件发送失败:', JSON.stringify(error, null, 2));
        throw new Error(`邮件发送失败: ${error.message || JSON.stringify(error)}`);
      }
      
      logger.success(`邮件发送成功！ID: ${data.id}`);
      return data;
      
    } catch (error) {
      // 尝试发送纯文本备选版本
      logger.warn('尝试发送纯文本备选版本...');
      return this.sendFallbackText(to, emailSubject);
    }
  }

  /**
   * 发送纯文本备选邮件
   */
  async sendFallbackText(to, subject) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: config.email.from,
        to: [to],
        subject: subject,
        text: config.email.fallbackText('N/A')
      });
      
      if (error) {
        throw new Error(`纯文本邮件也发送失败: ${error.message}`);
      }
      
      logger.success(`已发送纯文本备选版本。ID: ${data.id}`);
      return data;
      
    } catch (error) {
      logger.error('所有邮件发送尝试均失败');
      throw error;
    }
  }

  /**
   * 批量发送邮件
   * @param {Array<string>} recipients - 收件人列表
   * @param {string} html - HTML 内容
   * @param {string} subject - 邮件主题
   * @returns {Promise<Array>} 发送结果列表
   */
  async sendBatch(recipients, html, subject = null) {
    logger.info(`准备批量发送邮件，收件人数: ${recipients.length}`);
    
    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await this.sendHtml(recipient, html, subject);
        results.push({ recipient, success: true, data: result });
      } catch (error) {
        logger.error(`发送到 ${recipient} 失败:`, error.message);
        results.push({ recipient, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    logger.info(`批量发送完成: ${successCount}/${recipients.length} 成功`);
    
    return results;
  }
}

module.exports = EmailService;
