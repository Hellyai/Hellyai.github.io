---
title: 如何上传工作内容
description: 不懂代码也可以完成的内容更新步骤
---

# 如何上传工作内容

这个网站使用 Markdown 管理内容。你不需要修改首页代码，只要在正确的栏目中添加文件，网站就会生成页面并加入搜索。

## 推荐方式：使用本机内容管理页

1. 在项目目录运行 `npm.cmd run docs:dev`。
2. 浏览器打开终端显示的地址，进入导航栏的[本机上传](/admin/)。
3. 选择栏目，填写标题、英文网页地址、摘要和正文。
4. 可以拖入最多 5 张图片，每张不超过 8MB。
5. 点击“保存并加入工作台”。

内容会直接保存到当前电脑的项目目录。遇到同名文章或图片时，系统会停止并提示，不会覆盖已有内容。

## 备用方式：手动新增工作

### 第一步：创建工作文件

在项目根目录打开 PowerShell，运行：

```powershell
.\scripts\new-work.ps1 -Slug "project-name" -Title "我的项目名称"
```

`Slug` 是网页地址，只使用小写英文、数字和短横线。例如：`legal-ai-workflow`。

脚本会在 `docs/work/` 下生成新的 Markdown 文件。

### 第二步：填写内容

打开生成的文件，主要修改开头这几项：

```yaml
title: 项目名称
date: 2026-08-01
category: 项目分类
summary: 一句话项目介绍
number: '04'
tags: [AI, 内容, 工作流]
```

然后按照模板填写项目背景、核心问题、工作过程、成果和复盘。

### 第三步：添加图片

1. 在 `docs/public/images/` 中新建项目文件夹。
2. 把图片复制进去，例如：`docs/public/images/project-a/cover.png`。
3. 在 Markdown 中插入：

```md
![项目封面](/images/project-a/cover.png)
```

文件名建议使用英文、数字和短横线，不使用空格。

### 第四步：本地预览

第一次使用先安装依赖：

```powershell
npm.cmd install
```

之后运行：

```powershell
npm.cmd run docs:dev
```

浏览器打开终端显示的本地地址，检查标题、图片、手机排版和链接。

## 网站发布后：通过 GitHub 网页上传

网站发布到 GitHub 后，也可以完全通过网页更新：

1. 打开网站对应的 GitHub 仓库。
2. 进入 `docs/work/`。
3. 点击 **Add file → Create new file**。
4. 文件名填写 `项目英文名.md`。
5. 复制 `templates/work-template.md` 的内容并填写。
6. 图片进入 `docs/public/images/项目英文名/` 后选择 **Add file → Upload files**。
7. 点击 **Commit changes** 保存。
8. Cloudflare Pages 或 GitHub Pages 会自动重新构建网站。

## 上传其他内容放在哪里

| 内容类型 | 文件目录 | 示例地址 |
| --- | --- | --- |
| 工作作品 | `docs/work/` | `/work/project-name` |
| Agent 指令 | `docs/agents/` | `/agents/prompt-name` |
| Skill 技能 | `docs/skills/` | `/skills/skill-name` |
| AI 教程 | `docs/tutorials/` | `/tutorials/tutorial-name` |
| 工具介绍 | `docs/tools/` | `/tools/tool-name` |

## 发布前检查

- 标题和摘要是否能独立说明项目价值。
- 日期格式是否为 `YYYY-MM-DD`。
- 图片是否清晰并经过压缩。
- 文中是否包含不适合公开的信息。
- 手机端是否能正常阅读。
- 链接是否都能打开。

## 一个重要提醒

新增“工作作品”会自动进入首页精选工作数据源。其他栏目的文章会进入导航和站内搜索；如需在首页“最近更新”中特别推荐，可以之后再调整首页推荐规则。
