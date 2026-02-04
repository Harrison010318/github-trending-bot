// 增强功能测试脚本 - 测试仓库详情爬虫和增强提示词
require('dotenv').config({ path: '.env.local' });

const { fetchTrending, formatProjectsText } = require('./services/scraper');
const { fetchRepositoryDetails } = require('./services/repository-fetcher');
const promptsEnhanced = require('./config/prompts-enhanced');
const logger = require('./utils/logger');

/**
 * 并发爬取仓库详情（带速率限制）
 */
async function fetchRepositoriesInBatches(urls, batchSize = 3, delayMs = 500) {
  const results = [];
  
  logger.info(`开始批量爬取仓库详情，共 ${urls.length} 个，批次大小: ${batchSize}`);
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    logger.info(`第 ${Math.ceil((i + 1) / batchSize)} 批: 爬取 ${batch.length} 个仓库...`);
    
    // 并发请求
    const promises = batch.map(url => fetchRepositoryDetails(url));
    const batchResults = await Promise.allSettled(promises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        logger.success(`  ✅ 仓库 ${i + index + 1} 成功`);
      } else {
        results.push(null);
        logger.warn(`  ❌ 仓库 ${i + index + 1} 失败: ${result.reason.message}`);
      }
    });
    
    // 批次间延迟，避免过快请求
    if (i + batchSize < urls.length) {
      logger.info(`等待 ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  const successCount = results.filter(r => r !== null).length;
  logger.success(`\n爬取完成: ${successCount}/${urls.length} 成功`);
  
  return results;
}

/**
 * 测试增强功能
 */
async function testEnhancedScraping() {
  try {
    logger.info('='.repeat(60));
    logger.info('GitHub Trending Bot 增强功能测试');
    logger.info('='.repeat(60));
    
    // 1. 获取基础数据
    logger.info('\n【步骤 1】获取 Trending 列表...');
    const projects = await fetchTrending();
    logger.success(`成功获取 ${projects.length} 个项目\n`);
    
    // 2. 显示前 5 个项目
    logger.info('【步骤 2】前 5 个项目：');
    projects.slice(0, 5).forEach((p, i) => {
      logger.info(`${i + 1}. ${p.name} (${p.language}) - ${p.todayStars}`);
    });
    
    // 3. 爬取仓库详情（可选，仅爬取前 3 个以节省时间）
    logger.info(`\n【步骤 3】爬取仓库详情（前 3 个）...`);
    const urlsToFetch = projects.slice(0, 3).map(p => p.url);
    const repositoryDetails = await fetchRepositoriesInBatches(urlsToFetch, 1);
    
    // 4. 显示爬取的仓库详情
    logger.info('\n【步骤 4】仓库详情预览：');
    repositoryDetails.forEach((detail, index) => {
      if (detail) {
        logger.info(`\n${index + 1}. ${detail.fullName}`);
        logger.info(`   - 描述: ${detail.description.substring(0, 60)}...`);
        logger.info(`   - Topics: ${detail.topics.slice(0, 3).join(', ')}`);
        logger.info(`   - 特性: ${detail.features.slice(0, 2).join(', ')}`);
        logger.info(`   - 贡献者: ${detail.contributorsCount}`);
        logger.info(`   - 最后更新: ${detail.lastUpdated}`);
      } else {
        logger.warn(`${index + 1}. 爬取失败`);
      }
    });
    
    // 5. 格式化项目文本
    logger.info('\n【步骤 5】格式化项目数据...');
    const projectsText = formatProjectsText(projects);
    logger.success(`项目文本长度: ${projectsText.length} 字符`);
    
    // 6. 生成增强提示词
    logger.info('\n【步骤 6】生成增强提示词...');
    const enhancedPrompt = promptsEnhanced.enhancedReport(
      projectsText,
      repositoryDetails
    );
    logger.success(`增强提示词长度: ${enhancedPrompt.length} 字符\n`);
    
    // 7. 显示提示词预览
    logger.info('【步骤 7】增强提示词预览（前 300 字符）：');
    logger.info('-'.repeat(60));
    console.log(enhancedPrompt.substring(0, 300) + '...\n');
    
    // 8. 生成深度分析提示词
    logger.info('【步骤 8】生成深度分析提示词...');
    const insightfulPrompt = promptsEnhanced.insightfulReport(
      projectsText,
      repositoryDetails
    );
    logger.success(`深度分析提示词长度: ${insightfulPrompt.length} 字符\n`);
    
    // 9. 统计信息
    logger.info('【步骤 9】统计数据：');
    logger.info('-'.repeat(60));
    const stats = {
      '项目总数': projects.length,
      '成功爬取详情': repositoryDetails.filter(d => d !== null).length,
      '基础信息长度': projectsText.length + ' 字符',
      '增强提示词长度': enhancedPrompt.length + ' 字符',
      '深度分析提示词长度': insightfulPrompt.length + ' 字符',
      '预计 Token 数（增强）': Math.ceil(enhancedPrompt.length / 4),
      '预计 Token 数（深度）': Math.ceil(insightfulPrompt.length / 4)
    };
    console.table(stats);
    
    logger.success('\n✨ 增强功能测试完成！');
    logger.info(`\n建议：`);
    logger.info('- enhancedReport: 日常使用，兼顾深度和速度');
    logger.info('- insightfulReport: 深度分析，提供行业洞察');
    logger.info('- htmlReport: 快速生成，无需爬取仓库信息');
    
  } catch (error) {
    logger.error('测试失败:', error.message);
    if (error.stack) {
      logger.debug(error.stack);
    }
    process.exit(1);
  }
}

/**
 * 快速测试 - 仅测试仓库爬虫
 */
async function testRepositoryFetcher() {
  try {
    logger.info('仓库详情爬虫快速测试\n');
    
    const testUrls = [
      'https://github.com/openai/gpt-4',
      'https://github.com/huggingface/transformers',
      'https://github.com/facebook/react'
    ];
    
    for (const url of testUrls) {
      logger.info(`正在爬取: ${url}`);
      const details = await fetchRepositoryDetails(url);
      
      if (details) {
        logger.success(`✅ 成功`);
        console.log(JSON.stringify(details, null, 2));
      } else {
        logger.warn(`❌ 失败`);
      }
      
      console.log();
    }
    
  } catch (error) {
    logger.error('爬虫测试失败:', error.message);
  }
}

// 主函数
if (require.main === module) {
  const mode = process.argv[2];
  
  if (mode === '--fetcher') {
    // 仅测试爬虫
    testRepositoryFetcher();
  } else {
    // 完整测试
    testEnhancedScraping()
      .then(() => process.exit(0))
      .catch(err => {
        logger.error(err.message);
        process.exit(1);
      });
  }
}

module.exports = { testEnhancedScraping, testRepositoryFetcher };
