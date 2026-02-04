// 测试脚本 - 查看抓取的数据和传递给 AI 的信息
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { fetchTrending, formatProjectsText } = require('./services/scraper');
const prompts = require('./config/prompts');
const logger = require('./utils/logger');

/**
 * 输出流 - 支持同时输出到控制台和文件
 */
class OutputWriter {
  constructor(filePath = null) {
    this.filePath = filePath;
    this.output = '';
    this.writeToFile = !!filePath;
    
    if (this.writeToFile) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  write(text) {
    this.output += text + '\n';
    console.log(text);
  }

  section(title) {
    const line = '='.repeat(60);
    this.write(line);
    this.write(title);
    this.write(line);
  }

  subSection(title) {
    this.write('\n' + title);
    this.write('-'.repeat(60));
  }

  table(data) {
    console.table(data);
    if (this.writeToFile) {
      this.output += JSON.stringify(data, null, 2) + '\n';
    }
  }

  save() {
    if (this.writeToFile) {
      fs.writeFileSync(this.filePath, this.output, 'utf-8');
      logger.success(`\n✅ 测试报告已保存到: ${this.filePath}`);
      return this.filePath;
    }
  }
}

/**
 * 测试数据抓取和格式化
 */
async function testScraping(outputPath = null) {
  const writer = new OutputWriter(outputPath);
  
  try {
    writer.section('GitHub Trending Bot 测试报告');
    writer.write(`生成时间: ${new Date().toLocaleString('zh-CN')}\n`);
    
    writer.section('第一步：数据抓取');
    
    // 1. 抓取数据
    const projects = await fetchTrending();
    
    writer.write(`✅ 成功抓取到 ${projects.length} 个项目\n`);
    
    // 2. 显示原始数据结构
    writer.subSection('📊 原始数据结构（前 3 个项目）');
    projects.slice(0, 3).forEach((project, index) => {
      writer.write(`\n[项目 ${index + 1}]`);
      writer.write(JSON.stringify(project, null, 2));
    });
    
    // 3. 显示所有字段统计
    writer.subSection('📋 数据字段统计');
    const fieldStats = {
      name: projects.filter(p => p.name).length,
      url: projects.filter(p => p.url).length,
      description: projects.filter(p => p.description && p.description !== '暂无描述').length,
      language: projects.filter(p => p.language && p.language !== '未指定').length,
      stars: projects.filter(p => p.stars).length,
      todayStars: projects.filter(p => p.todayStars).length
    };
    
    writer.table(fieldStats);
    
    // 4. 显示语言分布
    writer.subSection('💻 编程语言分布');
    const languageCount = {};
    projects.forEach(p => {
      const lang = p.language || '未指定';
      languageCount[lang] = (languageCount[lang] || 0) + 1;
    });
    writer.table(languageCount);
    
    // 5. 显示完整的项目列表
    writer.subSection('📝 完整项目列表');
    projects.forEach((p, i) => {
      writer.write(`\n${i + 1}. ${p.name}`);
      writer.write(`   URL: ${p.url}`);
      writer.write(`   语言: ${p.language} | Stars: ${p.stars} | 今日: ${p.todayStars}`);
      writer.write(`   描述: ${p.description.substring(0, 80)}${p.description.length > 80 ? '...' : ''}`);
    });
    
    // 6. 显示格式化后的文本
    writer.section('第二步：数据格式化');
    writer.write('🤖 传递给 AI 的格式化文本:\n');
    const formattedText = formatProjectsText(projects);
    writer.write(formattedText);
    
    // 7. 显示提示词预览
    writer.section('第三步：AI 提示词');
    writer.write('💬 AI 提示词预览（前 500 字符）:\n');
    const prompt = prompts.htmlReport(formattedText);
    writer.write(prompt.substring(0, 500) + '\n[省略剩余内容]');
    
    // 8. 统计信息
    writer.section('📈 数据统计汇总');
    const stats = {
      '抓取项目数': projects.length,
      '有效描述数': fieldStats.description,
      '有效语言数': fieldStats.language,
      '格式化文本长度': formattedText.length + ' 字符',
      '完整提示词长度': prompt.length + ' 字符',
      '预计 Token 数': Math.ceil(prompt.length / 4)
    };
    writer.table(stats);
    
    writer.write('\n✨ 测试完成！');
    
    // 保存到文件
    if (outputPath) {
      writer.save();
    }
    
    return {
      success: true,
      projects,
      stats,
      filePath: outputPath
    };
    
  } catch (error) {
    writer.write(`\n❌ 测试失败: ${error.message}`);
    if (error.stack) {
      writer.write(`\n详细错误:\n${error.stack}`);
    }
    
    if (outputPath) {
      writer.save();
    }
    
    throw error;
  }
}

/**
 * 带参数的测试
 */
async function testWithOptions() {
  const args = process.argv.slice(2);
  
  try {
    const projects = await fetchTrending();
    
    logger.success(`抓取到 ${projects.length} 个项目\n`);
    
    // 简化输出
    projects.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.language}) - ${p.todayStars}`);
    });
    
  } catch (error) {
    logger.error('测试失败:', error.message);
  }
}

// 主函数
if (require.main === module) {
  const mode = process.argv[2];
  
  if (mode === '--simple' || mode === '-s') {
    // 简化模式
    testWithOptions();
  } else if (mode === '--output' || mode === '-o') {
    // 指定输出文件
    const outputPath = process.argv[3] || path.join(__dirname, '..', 'test-results.txt');
    testScraping(outputPath)
      .then(() => process.exit(0))
      .catch(err => {
        logger.error(err.message);
        process.exit(1);
      });
  } else if (mode === '--save') {
    // 使用默认路径保存
    const outputPath = path.join(__dirname, '..', 'test-results.txt');
    testScraping(outputPath)
      .then(() => process.exit(0))
      .catch(err => {
        logger.error(err.message);
        process.exit(1);
      });
  } else {
    // 完整模式（只控制台输出）
    testScraping()
      .then(() => process.exit(0))
      .catch(err => {
        logger.error(err.message);
        process.exit(1);
      });
  }
}

module.exports = { testScraping, testWithOptions };
