// GitHub Trending 数据抓取服务
const cheerio = require('cheerio');
const config = require('../config');
const logger = require('../utils/logger');
const { validateProject, sanitizeProject } = require('../utils/validator');

/**
 * 抓取 GitHub Trending 数据
 * @param {string} language - 可选的编程语言过滤
 * @param {string} since - 可选的时间范围 (daily, weekly, monthly)
 * @returns {Promise<Array>} 项目列表
 */
async function fetchTrending(language = '', since = 'daily') {
  const url = language 
    ? `${config.github.trendingUrl}/${language}?since=${since}`
    : `${config.github.trendingUrl}?since=${since}`;
  
  logger.info(`正在抓取 GitHub Trending 数据: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.github.timeout);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const projects = parseProjects(html);
    
    logger.success(`成功抓取到 ${projects.length} 个项目`);
    return projects;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.error('请求超时');
      throw new Error('抓取 GitHub Trending 超时');
    }
    logger.error('抓取 GitHub Trending 失败:', error.message);
    throw error;
  }
}

/**
 * 解析 HTML 并提取项目信息
 */
function parseProjects(html) {
  const $ = cheerio.load(html);
  const selectors = config.github.selectors;
  const projects = [];
  
  $(selectors.article).each((index, element) => {
    try {
      const $article = $(element);
      
      const project = {
        name: $article.find(selectors.name).text().trim().replace(/\s+/g, ' '),
        url: 'https://github.com' + $article.find(selectors.url).attr('href'),
        description: $article.find(selectors.description).text().trim() || '暂无描述',
        language: $article.find(selectors.language).text().trim() || '未指定',
        stars: $article.find(selectors.stars).parent().text().trim(),
        todayStars: $article.find(selectors.todayStars).text().trim()
      };
      
      // 验证并清理数据
      if (validateProject(project)) {
        projects.push(sanitizeProject(project));
      }
    } catch (err) {
      logger.warn(`解析第 ${index + 1} 个项目时出错:`, err.message);
    }
  });
  
  return projects;
}

/**
 * 格式化项目数据为文本
 */
function formatProjectsText(projects) {
  return projects.map((p, i) => 
    `${i + 1}. 项目名称：${p.name}
       GitHub 链接：${p.url}
       项目描述：${p.description}
       主要语言：${p.language}
       总获赞数：${p.stars}
       今日新增：${p.todayStars}`
  ).join('\n\n');
}

module.exports = {
  fetchTrending,
  formatProjectsText
};
