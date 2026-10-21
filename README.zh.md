# Ponytail for DeepSeek Harness

[中文](README.zh.md) | [English](README.md)

[Ponytail](https://github.com/DietrichGebert/ponytail) 是「懒惰资深工程师」模式：
用最少的新代码完整解决问题，并给出忙碌的人一眼能读懂的回复。本 bundle 把它移植为
DeepSeek Harness 的一个可插拔单元——打开开关即对每个会话生效，没有需要记住的斜杠命令。

## 装好后有什么（bundle 打开即生效）

- **常驻规则**：一个 prompt section（`ponytail:rules`，order 9500）携带
  `PONYTAIL MODE ACTIVE — level: <档位>` 加规范规则文本；每次 step 组装时重新读取，
  对本 profile 的每个会话（含子代理）生效。
- **六个技能**：会话目录会提示模型「请求匹配时自行加载技能」，所以你说「帮我审一下这次改动」
  就会走到 `ponytail-review`，无需任何手势。五个任务技能也支持直接输入
  `/ponytail-review`、`/ponytail-audit`、`/ponytail-debt`、`/ponytail-gain`、
  `/ponytail-help`；核心 `ponytail` 技能只供模型加载。
- **档位是行配置**：`defaultMode` 取 `off`、`lite`、`full`（默认）、`ultra`。
  无命令、无状态文件：开关打开，跑的就是配置的档位。
- **关闭短语**：整条消息恰好是 "stop ponytail" 或 "normal mode" 时，本次进程内停止注入规则
  （与上游一致）；bundle 关/开或重启即恢复配置档位。

## 档位

| `defaultMode` | 行为 |
|---|---|
| `off` | 不注入规则；六个技能仍可按需加载。 |
| `lite` | 按要求实现，顺带一句话提名更小的方案。 |
| `full` | 上述规则。默认。 |
| `ultra` | 动手前先质疑需求本身。 |

## 安装

任选一条，装的是同一个 bundle（带 `dsh.bundle.patch` 的包）。

| 方式 | 在 **Plugins → 添加插件**（或 `dsh plugin add`）里填 |
|---|---|
| GitHub | `github:Vincent-chk/dsh-ponytail` |
| Git URL | `https://github.com/Vincent-chk/dsh-ponytail` |
| Tarball | 在检出的仓库里 `npm pack`，然后填生成的 `.tgz` 绝对路径 |
| 本地目录 | 本目录的绝对路径 |

**从插件市场安装**：在 **插件 → 发现 → 添加索引源** 里加上下面这个地址，再从卡片安装：

```
https://vincent-chk.github.io/dsh-ponytail/market/index.json
```

`npm publish` 的步骤已备好，见 [PUBLISHING.md](PUBLISHING.md)；当前尚未发布到 npm。

在 Plugins 页关掉 bundle 即移除规则与六个技能，重新打开即恢复。

## 切换档位

在 profile 的 `cordis.patch.yml` 里加一条覆盖行——loader 会整体替换该行的 `config`，
所以要把想要的档位写全：

```yaml
- id: ponytail
  name: '@dsh-ext/dsh-ponytail'
  config:
    defaultMode: lite   # off | lite | full | ultra
```

patch 变化会触发 HMR 重组合；若没生效，在 Plugins 页关/开一次 bundle。
`PONYTAIL_DEFAULT_MODE` 优先于行配置。解析顺序：`PONYTAIL_DEFAULT_MODE` > 行
`defaultMode` > `full`。

## 有意不移植

- Claude Code 的 statusline/band 与本地 HTML 看板：DeepSeek Harness 已显示 token 与缓存命中，
  且 band 依赖 Claude 私有 API。
- `/ponytail` 切档命令与状态文件：开关即控制，档位是部署配置；规则里那句上游原文已相应改写。
- 按项目分档：当前为全进程一个档位；升级路径是按 `agent.ctx` 以会话 cwd 为键注册 section。
- `/ponytail default <mode>`：默认档位走行配置，不做成命令。

## 自检

`npm test` 跑两个检查：`test/selfcheck.mjs` 断言档位语法、frontmatter 解析、按档过滤、
关闭短语匹配与六个技能资产完整；`test/bundle-check.mjs` 对假 Cordis 上下文运行真实的
`apply()`，断言注入规则跟随配置档位、未注册任何命令、不写状态文件、关闭短语清空 section、
技能 provider 提供六个 registry 可校验的技能定义。

在把扩展属性存成 AppleDouble 的 macOS 卷上（exFAT、部分网络盘），在
`locale/*.json` 旁边写入可能留下 `._*.json` 伴生文件，Harness 的语言读取器会把它当成
非法语言文件；`npm run clean:macos` 可清理，清理前自检会失败。

## 许可

MIT；来源与逐文件对照见 [UPSTREAM.md](UPSTREAM.md)。技能正文为上游内容
（`ponytail`、`ponytail-help` 为本宿主改写）。
