# 部署指南

本文档详细介绍如何将 Echo Nav 部署到 Cloudflare Pages。

## 目录

- [快速开始](#快速开始)
- [环境变量配置](#环境变量配置)
- [Cloudflare Pages 部署](#cloudflare-pages-部署)
- [GitHub Actions 自动部署](#github-actions-自动部署)
- [域名和SSL配置](#域名和ssl配置)
- [故障排除](#故障排除)

## 快速开始

### 前置要求

- Node.js 18+ 
- pnpm 8+
- GitHub 账户
- Cloudflare 账户

### 本地构建测试

```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 环境变量配置

### 开发环境

1. 复制环境变量模板：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件，填入实际值：
```env
VITE_APP_VERSION=1.0.0
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 生产环境

生产环境的环境变量需要在 Cloudflare Pages 控制台中设置，**不要**将敏感信息提交到代码库。

## Cloudflare Pages 部署

### 方法一：通过 Cloudflare 控制台

1. **登录 Cloudflare**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 选择 "Pages" 服务

2. **创建新项目**
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 授权并选择你的 GitHub 仓库

3. **配置构建设置**
   ```
   Framework preset: Vue
   Build command: pnpm build
   Build output directory: dist
   Root directory: (留空)
   ```

4. **设置环境变量**
   - 在项目设置中添加环境变量
   - 生产环境：
     - `VITE_APP_VERSION`: 应用版本
     - `VITE_GITHUB_CLIENT_ID`: GitHub OAuth Client ID
     - `VITE_GITHUB_CLIENT_SECRET`: GitHub OAuth Client Secret

5. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成

### 方法二：使用 Wrangler CLI

1. **安装 Wrangler**
```bash
npm install -g wrangler
```

2. **登录 Cloudflare**
```bash
wrangler login
```

3. **部署项目**
```bash
# 构建项目
pnpm build

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=echo-nav
```

## GitHub Actions 自动部署

项目已配置 GitHub Actions 工作流，可以实现自动部署。

### 设置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. **CLOUDFLARE_API_TOKEN**
   - 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - 创建自定义 token，权限：
     - Zone: Zone Settings:Read, Zone:Read
     - Account: Cloudflare Pages:Edit

2. **CLOUDFLARE_ACCOUNT_ID**
   - 在 Cloudflare Dashboard 右侧边栏找到 Account ID

### 工作流触发

- 推送到 `main` 或 `master` 分支时自动部署
- 创建 Pull Request 时构建预览版本

## 域名和SSL配置

### 自定义域名

1. **在 Cloudflare Pages 中添加域名**
   - 进入项目设置
   - 点击 "Custom domains"
   - 添加你的域名

2. **DNS 配置**
   - 如果域名在 Cloudflare 管理：自动配置
   - 如果域名在其他服务商：添加 CNAME 记录指向 Cloudflare Pages

### SSL 证书

Cloudflare Pages 自动提供免费的 SSL 证书，支持：
- Let's Encrypt 证书
- 自动续期
- HTTP/2 和 HTTP/3 支持

## 故障排除

### 常见问题

#### 1. 构建失败

**问题**: `pnpm: command not found`

**解决方案**:
```yaml
# 在 .github/workflows/deploy.yml 中确保安装了 pnpm
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8
```

#### 2. 环境变量未生效

**问题**: 环境变量在生产环境中为空

**解决方案**:
- 检查 Cloudflare Pages 项目设置中的环境变量
- 确保变量名以 `VITE_` 开头
- 重新部署项目

#### 3. GitHub 同步功能异常

**问题**: GitHub OAuth 认证失败

**解决方案**:
- 检查 GitHub OAuth 应用的回调 URL 设置
- 确保生产环境的 Client ID 和 Secret 正确
- 推荐使用 Personal Access Token 方式

#### 4. 路由问题

**问题**: 刷新页面出现 404

**解决方案**:
- 检查 `wrangler.toml` 中的重定向配置
- 确保 SPA 路由重定向到 `index.html`

### 性能优化

#### 1. 缓存策略

项目已配置合适的缓存头：
- 静态资源：1年缓存
- HTML文件：不缓存
- API响应：根据需要配置

#### 2. 代码分割

- 自动分割 vendor 和 utils 包
- 按需加载路由组件
- 优化包大小

#### 3. 图片优化

- 使用 WebP 格式
- 配置适当的图片尺寸
- 启用懒加载

### 监控和分析

#### 1. Cloudflare Analytics

- 访问量统计
- 性能指标
- 错误监控

#### 2. Web Vitals

- Core Web Vitals 监控
- 性能优化建议

## 更多资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Vue.js 部署指南](https://vuejs.org/guide/best-practices/production-deployment.html)

## 支持

如果遇到部署问题，请：

1. 检查本文档的故障排除部分
2. 查看 Cloudflare Pages 的构建日志
3. 在项目 GitHub 仓库中创建 Issue
