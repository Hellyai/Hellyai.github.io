# HellyAI 工作台

仓库名称：`Hellyai.github.io`

公开网址：<https://hellyai.github.io/>

基于 VitePress 的个人品牌与知识工作站。本机版保留内容管理功能，GitHub Pages 公开版会自动排除后台、上传说明和所有修改入口。

## 本地启动

```powershell
npm.cmd install
npm.cmd run docs:dev
```

## 新增工作

推荐打开网站导航栏中的“本机上传”，通过表单填写内容和添加图片。

也可以使用命令创建 Markdown 文件：

```powershell
.\scripts\new-work.ps1 -Slug "project-name" -Title "项目名称"
```

详细说明见网站中的 `/guide/upload-content`。

## 首次连接 GitHub

1. 登录 GitHub，新建一个公开的空仓库，名称必须是 `Hellyai.github.io`，不要勾选自动创建 README。
2. 在仓库的 `Settings → Pages → Build and deployment` 中将 Source 设为 `GitHub Actions`。
3. 在本项目文件夹运行：

```powershell
.\scripts\connect-github.ps1
```

脚本会完成首次提交并推送。此后，在本机后台新增、修改、移动或删除内容，以及修改首页设置时，系统会自动提交并推送到 GitHub；GitHub Actions 随后自动更新公开网站。

如果后台提示“GitHub 仓库尚未连接”或“自动同步失败”，内容仍已安全保存在本机，可完成 GitHub 登录或网络检查后重新保存一次。


