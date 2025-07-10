# GitHub OAuth 配置指南

为了使用GitHub同步功能，您需要创建一个GitHub OAuth应用。请按照以下步骤进行配置：

## 🚀 快速开始

### 1. 创建GitHub OAuth应用

1. 访问 [GitHub Developer Settings](https://github.com/settings/applications/new)
2. 填写应用信息：
   - **Application name**: `Echo Nav` (或您喜欢的名称)
   - **Homepage URL**: `http://localhost:3000` (开发环境)
   - **Application description**: `Personal navigation page with GitHub sync` (可选)
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`

3. 点击 "Register application"

### 2. 获取OAuth凭据

创建应用后，您将看到：
- **Client ID**: 一个公开的标识符
- **Client Secret**: 一个私密的密钥（点击"Generate a new client secret"生成）

### 3. 配置环境变量

1. 在项目根目录创建 `.env.local` 文件：
```bash
# GitHub OAuth配置
VITE_GITHUB_CLIENT_ID=your_client_id_here
VITE_GITHUB_CLIENT_SECRET=your_client_secret_here
VITE_APP_VERSION=1.0.0
```

2. 将实际的Client ID和Client Secret替换到文件中

3. 重启开发服务器：
```bash
pnpm dev
```

## 🔧 详细配置

### 开发环境配置

**Homepage URL**: `http://localhost:3000`
**Callback URL**: `http://localhost:3000/auth/github/callback`

### 生产环境配置

当您部署到生产环境时，需要创建另一个OAuth应用：

**Homepage URL**: `https://your-domain.com`
**Callback URL**: `https://your-domain.com/auth/github/callback`

## 🔒 安全注意事项

1. **Client Secret安全性**:
   - 在开发环境中，Client Secret会暴露在前端代码中
   - 在生产环境中，建议通过后端服务器处理OAuth流程
   - 永远不要将Client Secret提交到公开的代码仓库

2. **权限范围**:
   - 当前应用只请求 `gist` 权限
   - 这允许应用读取和写入您的GitHub Gists
   - 不会访问您的私有仓库或其他敏感信息

## 🛠️ 故障排除

### 问题1: "client_id为空"
**原因**: 环境变量未正确配置
**解决方案**: 
1. 确保 `.env.local` 文件存在且包含正确的Client ID
2. 重启开发服务器
3. 检查浏览器控制台是否有错误信息

### 问题2: "404页面"
**原因**: OAuth回调URL配置错误
**解决方案**:
1. 确保GitHub应用的回调URL设置为 `http://localhost:3000/auth/github/callback`
2. 检查URL拼写是否正确

### 问题3: "认证失败"
**原因**: Client Secret错误或网络问题
**解决方案**:
1. 重新生成Client Secret并更新 `.env.local`
2. 检查网络连接
3. 查看浏览器控制台的详细错误信息

## 📝 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth应用的Client ID | ✅ |
| `VITE_GITHUB_CLIENT_SECRET` | GitHub OAuth应用的Client Secret | ✅ |
| `VITE_APP_VERSION` | 应用版本号 | ❌ |

## 🔄 OAuth流程说明

1. 用户点击"连接GitHub"按钮
2. 跳转到GitHub授权页面
3. 用户授权应用访问Gist
4. GitHub重定向回应用的回调URL
5. 应用处理授权码并获取访问令牌
6. 保存令牌到本地存储
7. 用户可以开始使用同步功能

## 📚 相关文档

- [GitHub OAuth Apps Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub Gist API Documentation](https://docs.github.com/en/rest/gists)
- [Vue.js Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 💡 提示

- 开发时可以使用同一个OAuth应用
- 生产环境建议创建单独的OAuth应用
- 定期检查和更新Client Secret以确保安全性
- 如果不需要同步功能，可以跳过此配置，应用的其他功能仍然可以正常使用
