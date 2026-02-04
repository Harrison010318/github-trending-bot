// 数据验证工具
const logger = require('./logger');

/**
 * 验证项目数据结构
 */
function validateProject(project) {
  const requiredFields = ['name', 'url', 'description', 'language', 'stars', 'todayStars'];
  const missingFields = requiredFields.filter(field => !project[field] && project[field] !== '');
  
  if (missingFields.length > 0) {
    logger.warn(`项目数据不完整，缺少字段: ${missingFields.join(', ')}`, project);
    return false;
  }
  
  return true;
}

/**
 * 清理和标准化项目数据
 */
function sanitizeProject(project) {
  return {
    name: project.name?.trim() || '未知项目',
    url: project.url?.trim() || '',
    description: project.description?.trim() || '暂无描述',
    language: project.language?.trim() || '未指定',
    stars: project.stars?.trim() || '0',
    todayStars: project.todayStars?.trim() || '0'
  };
}

/**
 * 验证环境变量
 */
function validateEnv() {
  const requiredEnvVars = ['GEMINI_API_KEY', 'RESEND_API_KEY', 'RECIPIENT_EMAIL'];
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(process.env.RECIPIENT_EMAIL)) {
    throw new Error('RECIPIENT_EMAIL 格式不正确');
  }
}

module.exports = {
  validateProject,
  sanitizeProject,
  validateEnv
};
