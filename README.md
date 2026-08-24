# OC Fate Loom · 命运织机

这是我把多年前的 OC Fate Generator 拆开重做后的版本。

它现在不替你写故事。页面先把两名角色的选择分开摆好，再把两条路之间已有的连线画出来；没想好的部分可以继续留空。

在线使用：[yuqing-cai.github.io/oc-fate-loom](https://yuqing-cai.github.io/oc-fate-loom/)

> 当前发布范围：离线结构检查。

## 怎么用

从两个人共同躲不开的事开始。轮到角色时，就替他们各自作答；轮到关系与命运时，再看两条路怎样互相改变。十七条轴可以慢慢填。

选到几项后，可以打开“命运图”：

- **因果**：按当前规则，前一项给后一项提供了来处；
- **支持**：两项互相托住，关系属于并列强化；
- **张力**：两项可以共存，故事需要承担它们之间的压力；
- **冲突**：按当前定义，两项互相排斥；
- **开放**：答案留给后面的场景或作者。

“开放结构”可以带着缺口查看。进入“闭合命运”时，所有已经启动的路径都要走通，阻断冲突也要处理完；满足这些条件后，页面才会标记为闭合。

## 后续路线

站点体验和 BYOK 已留出界面与接口草案。等模型选择、转发方式和上线边界确定后，再分别接入。

两条路线会各自管理凭据、端点和传输方式。接口草案见 [`docs/api-boundaries.md`](docs/api-boundaries.md)，启用条件见 [`docs/security.md`](docs/security.md)。

## 本地开发

要求 Node.js `^20.19.0` 或 `>=22.12.0`，并使用 pnpm 10。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

完整检查：

```bash
pnpm check
```

## 代码放在哪里

```text
src/
├── domain/   # 轴、选项、规则、命运图与闭合判定
├── app/      # 页面状态、草稿、离线检查与配置导出
├── api/      # 默认路线 / BYOK 的接口边界
├── ui/       # DOM 与命运图组件
├── main.ts   # 页面组装
└── styles.css
```

规则为什么这样分，见 [`docs/content-model.md`](docs/content-model.md)。

## 草稿与隐私

网页里的完整说明放在右上角“怎么用”。当前发布版执行离线结构检查；草稿、导出和未来模型路线的边界记在 [`docs/security.md`](docs/security.md)。

## 许可

代码使用 MIT License，见 [`LICENSE`](LICENSE)。轴文案、规则文案和其他叙事内容保留所有权利，见 [`CONTENT-LICENSE.md`](CONTENT-LICENSE.md)。

Copyright © Yuqing Cai.
