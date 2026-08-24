import type { LocalizedText } from "./contracts";

const t = (zh: string, en: string): LocalizedText => ({ zh, en });

export const APP_COPY = {
  route: {
    offline: {
      label: t("只看结构", "Structure only"),
      description: t(
        "在浏览器里核对连线、冲突和缺口，不写正文。",
        "Checks links, conflicts, and gaps in the browser. It does not write prose.",
      ),
      privacy: t("运行结构检查时，不调用模型或第三方服务。", "Running this check calls no model or third-party service."),
    },
    default: {
      label: t("站点体验", "Hosted Experience"),
      description: t(
        "以后由本站提供一个默认模型，打开页面就能试。",
        "A future default model will let visitors try the site without bringing a key.",
      ),
      unavailable: t(
        "还没有选定模型，也没有部署转发服务。这一项暂时不能用。",
        "No model or relay has been chosen yet, so this route is unavailable.",
      ),
      privacy: t(
        "当前不会发送任何内容。正式开放时，页面会另行说明发送哪些字段、是否保存以及保存多久。",
        "Nothing is sent today. Before this route opens, the page will state which fields are sent, whether they are retained, and for how long.",
      ),
    },
    byok: {
      label: t("自带密钥", "Bring Your Own Key"),
      description: t(
        "以后可以自己选供应商、填模型 ID，再临时输入 Key。",
        "A future BYOK route will let you choose a provider, enter a model ID, and supply a temporary key.",
      ),
      unavailable: t(
        "供应商清单还是空的。等直连方式和安全限制确认后再开。",
        "The provider list is still empty. This route stays closed until direct access and its safety limits are verified.",
      ),
      privacy: t(
        "将来启用后，Key 只放在本页内存里：不进草稿和导出文件，刷新或关页就没了。不要把 Key 写进上面的备注框。",
        "When enabled, a key will live only in this page's memory. It will not enter drafts or exports and will disappear on refresh or close. Do not put a key in the notes field.",
      ),
    },
  },
  outputMode: {
    outline: {
      label: t("开放结构", "Open Outline"),
      description: t(
        "可以带着空白往下看，适合还没决定完时。",
        "Leave some choices open while you are still deciding.",
      ),
    },
    full: {
      label: t("闭合命运", "Closed Fate"),
      description: t(
        "准备收束时再用；断掉的路径要先接上。",
        "Use this when you are ready to close the story; broken paths must be joined first.",
      ),
    },
  },
  preview: {
    name: t("这条命运现在走到哪里", "Where this fate stands"),
    disclaimer: t(
      "下面只整理这组选择命中的关系和缺口，不是故事正文。",
      "This page only arranges the links and gaps matched by these choices; it is not story prose.",
    ),
    section: {
      closure: t("整条线走到哪了", "How far the line runs"),
      edges: t("已经接上的地方", "What already connects"),
      conflicts: t("互相顶住的选择", "Choices that collide"),
      gaps: t("还没决定的地方", "What remains undecided"),
    },
    emptyEdges: t("这些选择之间还没有现成的线。", "There is no rule-backed link between these choices yet."),
    emptyConflicts: t("按现有规则，这些选择没有正面冲突。", "Under the current rules, these choices do not directly conflict."),
    emptyGaps: t("眼下没有规则要求你再补什么。", "The current rules do not require another choice."),
    noActivePath: t("还没选剧情内容。先从任意一项开始。", "No story choices yet. Start with any one of them."),
    partialClosure: (closed: number, active: number): LocalizedText =>
      t(
        `${active} 条路里，${closed} 条已经走通；其余还断着。`,
        `${closed} of ${active} active ${active === 1 ? "path is" : "paths are"} complete; the rest still break somewhere.`,
      ),
    fullClosure: (closed: number): LocalizedText =>
      t(
        closed === 1 ? "这条路已经走通。" : `${closed} 条路都已经走通。`,
        closed === 1 ? "The active path runs through." : `All ${closed} active paths run through.`,
      ),
    noneClosed: (active: number): LocalizedText =>
      t(
        `${active} 条路已经起头，还没有一条走到底。`,
        `${active} ${active === 1 ? "path has" : "paths have"} started, but none reaches the end yet.`,
      ),
    conflictSummary: (blocking: number, warning: number): LocalizedText => {
      if (blocking === 0 && warning === 0) {
        return t("没有冲突把路截断。", "No conflict cuts off the path.");
      }
      if (blocking === 0) {
        return t(
          `没有冲突截断路径；还有 ${warning} 处提醒可以一并看看。`,
          `No conflict cuts off the path; ${warning} non-blocking ${warning === 1 ? "note remains" : "notes remain"}.`,
        );
      }
      if (warning === 0) {
        return t(
          `${blocking} 处冲突把路截断了。`,
          `${blocking} ${blocking === 1 ? "conflict cuts" : "conflicts cut"} off the path.`,
        );
      }
      return t(
        `${blocking} 处冲突把路截断；另有 ${warning} 处提醒不会截断路径。`,
        `${blocking} blocking ${blocking === 1 ? "conflict cuts" : "conflicts cut"} off the path; ${warning} non-blocking ${warning === 1 ? "note remains" : "notes remain"}.`,
      );
    },
    gapSummary: (required: number, recommended: number): LocalizedText => {
      if (required === 0 && recommended === 0) {
        return t("眼下没有绕不过去的缺口。", "There is no required gap right now.");
      }
      if (required === 0) {
        return t(
          `没有非补不可的地方；还有 ${recommended} 项可以以后再想。`,
          `Nothing else is required; ${recommended} ${recommended === 1 ? "item can" : "items can"} wait.`,
        );
      }
      if (recommended === 0) {
        return t(
          `${required} 项不补就接不上。`,
          `${required} required ${required === 1 ? "gap remains" : "gaps remain"}.`,
        );
      }
      return t(
        `${required} 项不补就接不上；另有 ${recommended} 项可以以后再想。`,
        `${required} required ${required === 1 ? "gap remains" : "gaps remain"}; ${recommended} ${recommended === 1 ? "item can" : "items can"} wait.`,
      );
    },
    fullNeedsClosedPath: t(
      "这条命运还没走通。切回“开放结构”，先看看断在哪里。",
      'This fate does not run through yet. Switch to "Open Outline" to see where it breaks.',
    ),
  },
  draft: {
    enabled: t(
      "这台浏览器会记住语言、路线、模式、选择、备注、供应商／模型 ID 和种子。Key 输入框不会保存；也别把 Key 写进备注。",
      "This browser will remember the language, route, mode, choices, notes, provider/model IDs, and seed. The key field is not saved; do not put keys in notes.",
    ),
    disabled: t(
      "现在不保存。刷新或离开前，记得导出想留下的内容。",
      "Nothing is being saved. Export anything you want to keep before refreshing or leaving.",
    ),
    disableAction: t("停止保存并清除草稿", "Stop Saving and Clear Draft"),
    clearAction: t("清除本地草稿", "Clear Local Draft"),
    cleared: t("这台浏览器中的草稿已清除。", "The draft in this browser has been cleared."),
  },
  actions: {
    clearAll: t("清空全部配置", "Clear All Configuration"),
    export: t("导出配置", "Export Configuration"),
    newSeed: t("生成下一随机种子", "Create Next Random Seed"),
  },
} as const;

export function collectStaticCopy(): readonly LocalizedText[] {
  const result: LocalizedText[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === "function") return;
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    if (typeof record.zh === "string" && typeof record.en === "string") {
      result.push(record as unknown as LocalizedText);
      return;
    }
    Object.values(record).forEach(visit);
  };
  visit(APP_COPY);
  return result;
}
