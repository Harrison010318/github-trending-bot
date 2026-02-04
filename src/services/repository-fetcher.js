// 增强的 GitHub 仓库信息抓取服务
const cheerio = require('cheerio');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 获取仓库的详细信息（通过访问仓库页面）
 * @param {string} repoUrl - 仓库 URL，例如 https://github.com/user/repo
 * @returns {Promise<object>} 详细的仓库信息
 */
async function fetchRepositoryDetails(repoUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.github.timeout);
    
    const response = await fetch(repoUrl, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      logger.warn(`无法获取仓库详情: ${repoUrl} (HTTP ${response.status})`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 提取仓库详细信息
    const details = {
      // 基本信息
      fullName: $('[data-filterable-for="your-repositories-filter"] a.flex-auto')
        .text()
        .trim() || extractRepoName(repoUrl),
      
      // 仓库描述（通常在标题下方）
      description: $('p[data-testid="repo-header-description"]')
        .text()
        .trim(),
      
      // Topics/标签
      topics: [],
      
      // 语言分布
      languages: [],
      
      // 仓库信息
      isForked: $('[data-testid="label-default-label"]:contains("forked")').length > 0,
      isMirror: $('[data-testid="label-default-label"]:contains("mirror")').length > 0,
      isArchived: $('[data-testid="label-danger-label"]:contains("archived")').length > 0,
      
      // README 内容（简短版本）
      readmeExcerpt: extractReadmeExcerpt($),
      
      // 关键特性（从 README 中提取）
      features: extractFeatures($),
      
      // 更新时间
      lastUpdated: extractLastUpdated($),
      
      // 贡献者数
      contributorsCount: extractContributorsCount($)
    };
    
    // 提取 topics
    $('a[data-octo-link-type="repository-topic"]').each((i, el) => {
      const topic = $(el).text().trim();
      if (topic) details.topics.push(topic);
    });
    
    return details;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn(`获取仓库详情超时: ${repoUrl}`);
    } else {
      logger.warn(`获取仓库详情失败: ${repoUrl}`, error.message);
    }
    return null;
  }
}

/**
 * 从 URL 提取仓库名称
 */
function extractRepoName(url) {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1] : '未知仓库';
}

/**
 * 从 README 中提取摘要
 */
function extractReadmeExcerpt($) {
  const readmeContent = $('article').first().text();
  if (!readmeContent) return '';
  
  // 获取前 200 字符
  return readmeContent.substring(0, 200).trim() + '...';
}

/**
 * 从 README 中提取特性/功能
 */
function extractFeatures($) {
  const features = [];
  const readmeContent = $('article').first();
  
  // 查找 Features、특성、功能等标题下的内容
  readmeContent.find('h2, h3').each((i, el) => {
    const heading = $(el).text().toLowerCase();
    if (heading.includes('feature') || heading.includes('功能') || heading.includes('특성')) {
      const nextUl = $(el).next('ul');
      if (nextUl.length) {
        nextUl.find('li').slice(0, 3).each((j, item) => {
          const feature = $(item).text().trim();
          if (feature) features.push(feature);
        });
      }
    }
  });
  
  return features.slice(0, 5);  // 最多 5 个特性
}

/**
 * 提取最后更新时间
 */
function extractLastUpdated($) {
  const timeEl = $('relative-time').attr('datetime');
  if (timeEl) {
    return new Date(timeEl).toLocaleDateString('zh-CN');
  }
  
  // 备选方案：查找 "Updated" 文本
  const text = $('body').text();
  const match = text.match(/Updated\s+(\w+\s+\d+,\s+\d+)/);
  return match ? match[1] : '未知';
}

/**
 * 提取贡献者数量
 */
function extractContributorsCount($) {
  const contributeLink = $('a[href*="/graphs/contributors"]').text();
  const match = contributeLink.match(/(\d+)/);
  return match ? parseInt(match[1]) : '未知';
}

/**
 * 获取仓库的 GitHub API 信息（需要 token 时使用）
 * 注意：这需要额外的 API Key，目前不使用
 */
async function fetchRepositoryFromAPI(owner, repo) {
  // 未来可以添加 GitHub API 支持
  // const url = `https://api.github.com/repos/${owner}/${repo}`;
  // const response = await fetch(url, {
  //   headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
  // });
  // return response.json();
  
  logger.warn('GitHub API 支持还未实现');
  return null;
}

module.exports = {
  fetchRepositoryDetails,
  extractRepoName,
  extractReadmeExcerpt,
  extractFeatures,
  extractLastUpdated,
  extractContributorsCount
};
