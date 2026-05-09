# 国服 CMS 内测说明

本分支：`china-cms-beta`

## 目标

这个分支用于国服数据内测，不直接影响当前线上主链接。

- 国服数据从 `public/cms/*.json` 读取。
- 当前接入的文件包括：`items.json`、`lookups.json`、`maps.json`、`monsters.json`、`skills.json`。
- `npcs.json`、`quests.json` 已保留在 `public/cms/`，后续可以继续接任务、NPC 或路线功能。
- 不合并到 `main` 前，生产站点不会因为这个分支的代码改动而变化。

## 本次改动

1. `src/engine/officialDataAdapter.js`
   - 数据源从旧的 `AppData/*.json` 切到新的 `/cms/*.json`。
   - 新增兼容型 normalizer，用于适配数组、对象映射、以及包一层的 JSON 结构。
   - 输出仍保持应用内部需要的 `items`、`monsters`、`maps`、`skillGroups` 格式，这样 UI、装备推荐、地图推荐、技能面板可以继续复用原逻辑。

2. `src/data/classes.js`
   - 将 beta 分支里的版本显示为“国服内测”。
   - 让国服版本也走 `official-appdata` 通道，避免 `AppMediaEnhanced.jsx` 把国服数据置为空。
   - 开启海盗职业入口。

## Cloudflare Pages 使用方式

如果 Cloudflare Pages 已开启 preview deployment：

1. 推送这个分支后，Cloudflare 会为 `china-cms-beta` 生成一个预览部署。
2. 你可以只把这个 preview URL 自己打开测试。
3. 当前正式链接继续指向 production/main，不会因为这个 beta 分支改变。

如果你想真正做到“只有我能看”：

- 在 Cloudflare Pages 里给 preview deployments 加 Access 保护。
- 仅靠分支/preview URL 不是严格私有，因为 repo 是公开的，preview URL 默认也可能被知道链接的人访问。

## 测试重点

打开 preview 后重点检查：

- 首页版本是否显示“国服内测”。
- 装备推荐是否能从 `/cms/items.json` 显示装备。
- 地图推荐是否能从 `/cms/maps.json` 和 `/cms/monsters.json` 显示地图、怪物和刷怪数。
- 技能面板是否能从 `/cms/skills.json` 匹配一转/二转技能。
- 如果某些卡片为空，优先检查对应 CMS JSON 的字段名是否需要继续补 normalizer alias。

## 上线方式

测试确认没问题后，再把 PR 合并到 `main`，或在 Cloudflare Pages 里手动切换 production branch。不要在没测试完前合并这个分支。
