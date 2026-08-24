import type { LocalizedText } from "./contracts";

const t = (zh: string, en: string): LocalizedText => ({ zh, en });

export const APP_COPY = {
  route: {
    offline: {
      label: t("只看结构", "Structure only"),
      description: t(
        "在浏览器里核对连线、冲突和缺口。",
        "Checks links, conflicts, and gaps in the browser.",
      ),
      privacy: t("离线 · 无模型调用", "Offline · no model call"),
    },
    default: {
      label: t("站点体验", "Hosted Experience"),
      description: t(
        "预留给打开页面就能试的默认模型。",
        "Reserved for a default model visitors can try right away.",
      ),
      unavailable: t(
        "默认模型和转发服务还没定。",
        "The default model and relay service are still to be decided.",
      ),
      privacy: t("本站提供模型与凭据", "Model and credentials provided by this site"),
    },
    byok: {
      label: t("自带密钥", "Bring Your Own Key"),
      description: t(
        "预留给自选供应商、模型 ID 和临时 Key。",
        "Reserved for a provider, model ID, and temporary key of your choice.",
      ),
      unavailable: t(
        "供应商清单、直连方式和安全限制还没定。",
        "The provider list, direct connection method, and safety limits are still to be decided.",
      ),
      privacy: t("自选模型 · Key 仅在本页", "Your model · key used only in this page"),
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
        "“闭合命运”留到收束时用；断着的路径需要接上。",
        "Save Closed Fate for the point of closure; broken paths need to be joined.",
      ),
    },
  },
  preview: {
    name: t("这条命运现在走到哪里", "Where this fate stands"),
    disclaimer: t(
      "下面是这组选择已经接上的关系，以及仍然断着的地方。",
      "Below are the links these choices have made and the places where the thread still breaks.",
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
      "这条命运还没走通。切回“开放结构”，看看断在哪里。",
      'This fate does not run through yet. Switch to "Open Outline" to see where it breaks.',
    ),
  },
  draft: {
    enabled: t(
      "已保存：语言、路线、模式、选择、备注、供应商／模型 ID 和种子。",
      "Saved: language, route, mode, choices, notes, provider/model IDs, and seed.",
    ),
    disabled: t(
      "想留下这次的内容，刷新前记得导出。",
      "Export this draft before refreshing if you want to keep it.",
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
