# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

工作台所有者本人。主要在自己的 Windows 电脑上整理工作成果、方法、Agent 指令、Skill、教程和工具资料。

## Product Purpose

把分散的工作材料整理成可搜索、可浏览、可持续更新的个人 AI 工作台。成功意味着使用者不需要修改代码，也能把文字与图片保存为网站内容。

## Operating Context

网站基于 VitePress，在本机通过 `127.0.0.1` 运行。内容以 Markdown 文件保存在项目目录，图片保存在 `docs/public/images/`。本机内容管理入口负责把表单转换为这些文件。

## Capabilities and Constraints

- 内容分为工作作品、Agent 指令、Skill 技能、AI 教程和实用工具。
- 本机上传入口只接受来自本机的请求，不提供互联网账号系统。
- 新内容不得覆盖已有文章或图片；文件名必须使用小写英文、数字和短横线。
- 线上发布和跨设备内容管理仍是开放决策，不属于当前版本。

## Brand Commitments

沿用用户提供的个人形象与暖奶油、墨绿、雾蓝、橙金色调。界面延续 ESTHER不二个人设计系统的方法，并保留相应署名与许可说明。

## Evidence on Hand

- 个人形象：`docs/public/hero-persona.png`
- 现有视觉实现：`docs/.vitepress/theme/style.css` 和 `HomeWorkbench.vue`
- 工作内容模板：`templates/work-template.md`

## Product Principles

- 内容所有权始终留在本机文件中。
- 保存动作清晰、可恢复，不静默覆盖已有材料。
- 上传流程使用日常语言，不要求使用者理解代码或项目结构。
- 新内容继续兼容 VitePress 搜索、栏目页面和首页展示。
