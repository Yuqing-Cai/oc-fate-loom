import type { LocalizedText } from "./contracts";

const t = (zh: string, en: string): LocalizedText => ({ zh, en });

export const APP_COPY = {
  route: {
    offline: {
      label: t("离线结构预检", "Offline Structure Check"),
      description: t(
        "只检查因果边、冲突、缺口与闭合路径；不会联网，也不会冒充成小说场景。",
        "Checks causal edges, conflicts, gaps, and closed paths only. It never connects to the internet or pretends to be a prose scene.",
      ),
      privacy: t("所有计算都在当前页面完成。", "All computation happens in this page."),
    },
    default: {
      label: t("站点体验", "Hosted Experience"),
      description: t(
        "使用站点维护者配置的受限模型服务。",
        "Uses a restricted model service configured by the site owner.",
      ),
      unavailable: t(
        "站点模型尚未配置；待预算、限流与滥用防护就绪后再开放。",
        "No hosted model is configured. This route will open only after budgets, rate limits, and abuse controls are ready.",
      ),
      privacy: t(
        "开放后只会发送生成所需的结构化配置，不会接收访客密钥。",
        "When enabled, it will send only the structured configuration needed for generation and will never accept a visitor API key.",
      ),
    },
    byok: {
      label: t("自带密钥", "Bring Your Own Key"),
      description: t(
        "由访客选择已审核的供应商与模型，并在本次页面会话中临时输入密钥。",
        "Lets visitors choose an approved provider and model, then enter a key for this page session only.",
      ),
      unavailable: t(
        "尚未开放已审核的供应商；供应商域名与浏览器直连能力确认后再启用。",
        "No approved providers are available yet. This route will open after provider origins and direct browser access are verified.",
      ),
      privacy: t(
        "专用 Key 输入框中的密钥只保存在页面内存中：不写入草稿、浏览器存储或导出文件，刷新或关闭页面后即消失。请勿把密钥粘贴到会被保存的补充说明中。",
        "A key entered in the dedicated key field lives in page memory only: it is never written to drafts, browser storage, or exports, and disappears on refresh or close. Do not paste a key into the saved notes field.",
      ),
    },
  },
  outputMode: {
    outline: {
      label: t("开放结构", "Open Outline"),
      description: t(
        "允许保留缺口，适合查看下一步还需要决定什么。",
        "Allows unresolved gaps so you can see what still needs a decision.",
      ),
    },
    full: {
      label: t("闭合命运", "Closed Fate"),
      description: t(
        "至少需要一条已经闭合的命运路径。",
        "Requires at least one closed fate path.",
      ),
    },
  },
  preview: {
    name: t("结构预检", "Structure Check"),
    disclaimer: t(
      "这是关系结构诊断，不是故事场景、人物小传或大模型生成结果。",
      "This is a relationship-structure diagnosis, not a story scene, character biography, or model-generated result.",
    ),
    section: {
      closure: t("路径闭合", "Path Closure"),
      edges: t("成立的关系", "Established Relations"),
      conflicts: t("需要处理的冲突", "Conflicts to Resolve"),
      gaps: t("仍待决定的缺口", "Open Decisions"),
    },
    emptyEdges: t("尚未形成选项级因果边。", "No option-level causal edge has formed yet."),
    emptyConflicts: t("当前没有检测到冲突。", "No conflict is currently detected."),
    emptyGaps: t("当前没有待补缺口。", "No open decision is currently detected."),
    noActivePath: t("尚未启动命运路径。", "No fate path is active yet."),
    partialClosure: (closed: number, active: number): LocalizedText =>
      t(
        `已有 ${closed}／${active} 条路径闭合；其余路径仍需承接。`,
        `${closed} of ${active} active ${active === 1 ? "path is" : "paths are"} closed; the remaining paths still need support.`,
      ),
    fullClosure: (closed: number): LocalizedText =>
      t(
        `全部 ${closed} 条已启动路径均已闭合。`,
        closed === 1 ? "The only active path is closed." : `All ${closed} active paths are closed.`,
      ),
    noneClosed: (active: number): LocalizedText =>
      t(
        `已有 ${active} 条路径启动，但还没有路径闭合。`,
        `${active} ${active === 1 ? "path is" : "paths are"} active, but none is closed yet.`,
      ),
    conflictSummary: (blocking: number, warning: number): LocalizedText =>
      t(
        `检测到 ${blocking} 项阻断冲突与 ${warning} 项张力提醒。`,
        `Detected ${blocking} blocking ${blocking === 1 ? "conflict" : "conflicts"} and ${warning} tension ${warning === 1 ? "warning" : "warnings"}.`,
      ),
    gapSummary: (required: number, recommended: number): LocalizedText =>
      t(
        `仍有 ${required} 项必要缺口与 ${recommended} 项建议补充。`,
        `${required} required ${required === 1 ? "gap" : "gaps"} and ${recommended} recommended ${recommended === 1 ? "addition" : "additions"} remain.`,
      ),
    fullNeedsClosedPath: t(
      "“闭合命运”至少需要一条已闭合路径；可先切换到“开放结构”查看缺口。",
      '"Closed Fate" needs at least one closed path. Switch to "Open Outline" to inspect unresolved gaps.',
    ),
  },
  draft: {
    enabled: t(
      "本地草稿已开启：语言、生成路线、输出模式、选择、补充说明、供应商／模型 ID 与随机种子会保存在这台浏览器中。专用 Key 输入框不保存；请勿把密钥粘贴到补充说明中。",
      "Local drafts are on: language, generation route, output mode, selections, notes, provider/model IDs, and random seed are saved in this browser. The dedicated key field is never saved; do not paste keys into notes.",
    ),
    disabled: t(
      "本地草稿已关闭：离开或刷新页面后，未导出的配置可能丢失。",
      "Local drafts are off. Unexported configuration may be lost when you refresh or leave.",
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
