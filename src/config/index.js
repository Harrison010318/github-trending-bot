// 配置管理
module.exports = {
  // GitHub Trending 配置
  github: {
    trendingUrl: 'https://github.com/trending',
    selectors: {
      article: 'article.Box-row',
      name: 'h2 a',
      url: 'h2 a',
      description: 'p',
      language: '[itemprop="programmingLanguage"]',
      stars: '.octicon-star',
      todayStars: '.float-sm-right'
    },
    timeout: 10000 // 10秒超时
  },

  // Gemini AI 配置
  ai: {
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelay: 2000
  },

  // 邮件配置
  email: {
    from: 'GitHub Daily <onboarding@resend.dev>',
    subjectTemplate: (date) => `今日 GitHub 趋势早报 - ${date}`,
    fallbackText: (count) => `今日 GitHub Trending 日报\n\n已抓取 ${count} 个项目。请查看完整的 HTML 版本邮件。`
  },

  // 应用配置
  app: {
    locale: 'zh-CN',
    timezone: 'Asia/Shanghai'
  }
};
