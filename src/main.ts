import "./styles.css";

import {
  APP_COPY,
  clearSavedDraft,
  createInitialAppState,
  createRouteCatalog,
  disableDraftSaving,
  exportFileName,
  generateStructurePreview,
  loadDraft,
  nextSeed,
  persistDraft,
  planRoute,
  reduceAppState,
  seededOrder,
  serializeConfiguration,
  type AppAction,
  type AppState,
  type StructurePreview,
} from "./app";
import {
  bindTransientKeyLifecycle,
  createTransientKeyHolder,
  directByokRegistry,
} from "./api";
import {
  AXES,
  CHAPTERS,
  deriveFateGraph,
  getAxis,
  getOption,
  getOptionsForAxis,
  normalizeSelections,
  type Axis,
  type AxisId,
  type ChapterId,
  type FateGraph,
  type LocalizedText,
  type RoleId,
} from "./domain";
import { announce, append, button, downloadText, element } from "./ui/dom";
import {
  createFateGraph,
  type GraphViewData,
  type GraphViewHandle,
} from "./ui/fate-graph";
import { RISK_COPY, UI_COPY, uiText } from "./ui/copy";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Application root is missing.");
}

const appRoot = root;

const t = (zh: string, en: string): LocalizedText => ({ zh, en });

const EXTRA_COPY = {
  readyTitle: t("可以检查了", "Ready to check"),
  readyBody: t("现在可以看看这些选择接出了什么。", "You can now see what these choices connect."),
  unavailable: t("未开放", "Unavailable"),
  available: t("可用", "Available"),
  open: t("仍开放", "Open"),
  blocked: t("被阻断", "Blocked"),
  closed: t("已闭合", "Closed"),
  inactive: t("未启动", "Inactive"),
  graphSummary: t(
    "命中的线画在图上；空着的地方等你来定。",
    "Matched threads appear on the map; open space waits for your decision.",
  ),
  noFindings: t("这里暂时没有内容。", "Nothing here yet."),
  noSelectionsOverview: t("还没选东西。", "Nothing selected yet."),
  chapterActorA: t("她有五项可选；他的答案留在另一栏。", "She has five choices here; his answers have their own column."),
  chapterActorB: t("轮到他。他可以和她完全不同。", "Now it is his turn. His answers may be entirely different."),
  routeKeyStateEmpty: t("本页没有暂存 Key。", "No key is held in this page."),
  routeKeyStateSet: t("Key 暂存在本页；刷新或关页就会清掉。", "The key is held in this page and clears on refresh or close."),
  draftUnavailable: t("浏览器不允许使用本地存储，这次不会保存草稿。", "Browser storage is unavailable, so this draft will not be kept."),
  seedHint: t("同一个种子会排出同一组起点。", "The same seed produces the same starting set."),
  previewMetrics: {
    edges: t("已经接上", "Links"),
    conflicts: t("冲突", "Conflicts"),
    gaps: t("还缺", "Gaps"),
    structure: t("整条线", "Overall path"),
  },
  helpSteps: [
    t("从境遇、两个人和关系里各挑一两项。还没想好的，可以空着。", "Pick one or two items from the context, each character, and the relationship. Leave the rest open."),
    t("打开命运图，看哪些选择已经相连，哪些彼此冲突，哪条路还缺一环。", "Open the fate map to see what connects, what collides, and where a path still breaks."),
    t("还在摸索时用“开放结构”；准备收束时再试“闭合命运”。", "Use Open Outline while exploring; switch to Closed Fate when you are ready to finish the line."),
  ],
  helpPrivacyTitle: t("隐私", "Privacy"),
  helpPrivacyDraft: t(
    "当前结构检查在本页完成。草稿默认关闭；开启后，这次的配置和备注会留在这台浏览器，导出文件也会带上它们。",
    "Current structure checks run in this page. Draft saving is off by default; when enabled, this configuration and its notes remain in this browser and are included in exports.",
  ),
  helpPrivacyKey: t(
    "自带密钥路线启用后，Key 只在本页暂存，刷新或关页即清；它不会进入草稿和导出文件。备注属于普通文本，请别把 Key 粘贴进去。",
    "Once BYOK is available, keys stay only in page memory and clear on refresh or close; they never enter drafts or exports. Notes are ordinary text, so do not paste a key there.",
  ),
  axisModalIntro: t("一次选一项。现在不想定，也可以先空着。", "Choose one item, or leave the axis open for now."),
  riskPrefix: t("涉及：", "Touches: "),
  randomComplete: t("起点已经放进来了。", "Starting points were added."),
  gapComplete: t("补了一项，看看这条线有没有往前走。", "One item was added; see whether the line moves forward."),
  exported: t("配置 JSON 已下载。", "The configuration JSON was downloaded."),
  clearKeyDone: t("本页暂存的 Key 已清掉。", "The key held by this page was cleared."),
  previewCopyFailed: t("浏览器没有允许复制。", "The browser did not allow clipboard access."),
  resultMode: {
    outline: t("开放结构", "Open Outline"),
    full: t("闭合命运", "Closed Fate"),
  },
  pathLabel: t("这条路", "Path"),
  acceptableLabel: t("可以接上的选项", "Options that can connect it"),
  incompatibleSelection: t("现在选的这一项接不上。", "The current choice does not connect here."),
  noSafeGapFill: t("这里没有合适的代填答案。我把对应的轴打开了，留给你选。", "There is no safe answer to fill for you. The relevant axis is open for your choice."),
  notReadyTitle: t("还不能查看", "Not ready yet"),
  skipWorkspace: t("跳到命运工作台", "Skip to the fate workbench"),
  allRequired: t("这几项要一起成立", "All of these are required"),
  convergence: t("在这里合到一起", "Meet here"),
} as const;

// Real model routes require an explicit release decision in addition to an adapter.
// Keeping this false prevents a future registry entry from silently opening BYOK.
const BYOK_ROUTE_ENABLED = false;

function routeCatalog() {
  return createRouteCatalog({
    byok: {
      available: BYOK_ROUTE_ENABLED && directByokRegistry.list().length > 0,
    },
  });
}

let browserStorage: Storage | null = null;
try {
  browserStorage = window.localStorage;
  const probe = "oc-fate-loom:storage-probe";
  browserStorage.setItem(probe, "1");
  browserStorage.removeItem(probe);
} catch {
  browserStorage = null;
}

let state: AppState = createInitialAppState({
  locale: navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en",
  draftSavingEnabled: false,
});

if (browserStorage) {
  try {
    state = loadDraft(browserStorage, state);
  } catch {
    state = { ...state, draftSavingEnabled: false };
    browserStorage = null;
  }
}

state = { ...state, selections: normalizeSelections(state.selections) };

const transientKey = createTransientKeyHolder();
const unbindTransientKey = bindTransientKeyLifecycle(transientKey, window);
window.addEventListener("beforeunload", unbindTransientKey, { once: true });

let activeChapter: ChapterId = "context";
let activeRole: RoleId = "roleA";
let view: "editor" | "result" = "editor";
let currentPreview: StructurePreview | null = null;
let focusAfterRender: string | null = null;
let graphHandles: GraphViewHandle[] = [];

const localized = (value: LocalizedText): string => uiText(value, state.locale);

function safePersist(): void {
  if (!browserStorage || !state.draftSavingEnabled) return;
  try {
    persistDraft(browserStorage, state);
  } catch {
    state = { ...state, draftSavingEnabled: false };
    browserStorage = null;
  }
}

function commit(action: AppAction, focusKey?: string): void {
  state = reduceAppState(state, action);
  safePersist();
  focusAfterRender = focusKey ?? null;
  if (action.type !== "set-locale") currentPreview = null;
  render();
}

function commitWithoutRender(action: AppAction): void {
  state = reduceAppState(state, action);
  safePersist();
}

function selectedCountForAxes(axes: readonly Axis[]): number {
  return axes.filter((axis) => state.selections[axis.id] !== undefined).length;
}

function chapterAxes(chapter: ChapterId, role = activeRole): readonly Axis[] {
  return AXES.filter((axis) => axis.chapter === chapter && (chapter !== "characters" || axis.role === role));
}

function navigateToAxis(axisId: AxisId): void {
  const axis = getAxis(axisId);
  if (!axis) return;
  document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((dialog) => dialog.close());
  activeChapter = axis.chapter;
  if (axis.role) activeRole = axis.role;
  view = "editor";
  focusAfterRender = `axis-${axis.id}`;
  render();
}

function createTopbar(): HTMLElement {
  const header = element("header", "topbar");
  const brand = element("div", "brand");
  const mark = element("span", "brand-mark", "纬╱经");
  mark.setAttribute("aria-hidden", "true");
  const brandCopy = element("div", "brand-copy");
  append(brandCopy, element("span", "brand-name", localized(UI_COPY.brand)), element("span", "brand-version", localized(UI_COPY.version)));
  append(brand, mark, brandCopy);

  const actions = element("div", "topbar-actions");
  actions.append(
    button(localized(UI_COPY.help), "text-button", showHelpDialog),
    button(localized(UI_COPY.export), "text-button", exportConfiguration),
    button(state.locale === "zh" ? "EN" : "中", "quiet-button", () => {
      commit({ type: "set-locale", locale: state.locale === "zh" ? "en" : "zh" }, "language");
    }),
  );
  actions.lastElementChild?.setAttribute("data-focus-key", "language");
  actions.lastElementChild?.setAttribute("aria-label", localized(UI_COPY.switchLanguage));
  header.append(brand, actions);
  return header;
}

function createThesis(): HTMLElement {
  const section = element("section", "thesis-strip");
  const copy = element("div");
  append(copy, element("p", "eyebrow", localized(UI_COPY.thesisEyebrow)), element("h1", "thesis-title", localized(UI_COPY.thesisTitle)), element("p", "thesis-lede", localized(UI_COPY.thesisLede)));

  const modes = element("div");
  const label = element("p", "micro-label", localized(UI_COPY.outputModeLabel));
  const switcher = element("div", "scope-switcher");
  switcher.setAttribute("role", "radiogroup");
  switcher.setAttribute("aria-label", localized(UI_COPY.outputModeLabel));
  (["outline", "full"] as const).forEach((mode) => {
    const card = element("label", "scope-option");
    const input = element("input");
    input.type = "radio";
    input.name = "output-mode";
    input.value = mode;
    input.checked = state.outputMode === mode;
    input.dataset.focusKey = `output-${mode}`;
    input.addEventListener("change", () => commit({ type: "set-output-mode", outputMode: mode }, `output-${mode}`));
    append(card, input, element("span", "scope-name", localized(APP_COPY.outputMode[mode].label)), element("span", "scope-description", localized(APP_COPY.outputMode[mode].description)));
    switcher.append(card);
  });
  append(modes, label, switcher);
  section.append(copy, modes);
  return section;
}

function createChapterRail(): HTMLElement {
  const rail = element("aside", "chapter-rail");
  rail.setAttribute("aria-label", localized(UI_COPY.chapters));
  const heading = element("div", "rail-heading");
  append(heading, element("strong", "", localized(UI_COPY.chapters)), element("span", "progress-count", localized(UI_COPY.selectedCount(selectedCountForAxes(AXES), AXES.length))));
  const nav = element("nav", "chapter-nav");
  nav.setAttribute("aria-label", localized(UI_COPY.chapters));
  for (const chapter of CHAPTERS) {
    const axes = AXES.filter((axis) => axis.chapter === chapter.id);
    const selected = selectedCountForAxes(axes);
    const tab = button("", "chapter-tab", () => {
      activeChapter = chapter.id;
      if (chapter.id === "characters") activeRole = "roleA";
      focusAfterRender = `chapter-${chapter.id}`;
      render();
    });
    tab.dataset.chapterTab = chapter.id;
    tab.dataset.focusKey = `chapter-${chapter.id}`;
    if (activeChapter === chapter.id) tab.setAttribute("aria-current", "step");
    append(tab, element("span", "chapter-number", String(chapter.order + 1).padStart(2, "0")), element("span", "", localized(chapter.label)), element("span", "chapter-count", `${selected}/${axes.length}`));
    nav.append(tab);
  }
  const actions = element("div", "rail-actions");
  const random = button(localized(UI_COPY.randomStart), "rail-action", fillRandomStart);
  random.dataset.focusKey = "random-start";
  random.append(element("span", "", "↻"));
  const graph = deriveFateGraph(state.selections);
  const fill = button(localized(UI_COPY.fillGap), "rail-action", () => fillRuleBackedGap(graph));
  fill.disabled = !graph.gaps.some((gap) => gap.blocking);
  fill.title = fill.disabled ? localized(UI_COPY.noGap) : "";
  fill.append(element("span", "", "＋"));
  const clear = button(localized(UI_COPY.clearAll), "rail-action", showClearDialog);
  clear.append(element("span", "", "×"));
  actions.append(random, fill, clear);
  rail.append(heading, nav, actions);
  return rail;
}

function createRoleSwitch(): HTMLElement {
  const wrap = element("div", "role-switch");
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", localized(UI_COPY.roleSwitchLabel));
  const tabs = element("div", "route-tabs");
  (["roleA", "roleB"] as const).forEach((role) => {
    const control = button(localized(role === "roleA" ? UI_COPY.roleA : UI_COPY.roleB), "route-tab", () => {
      activeRole = role;
      focusAfterRender = `role-${role}`;
      render();
    });
    control.dataset.focusKey = `role-${role}`;
    control.setAttribute("aria-pressed", String(activeRole === role));
    tabs.append(control);
  });
  wrap.append(tabs);
  return wrap;
}

function createAxisSection(axis: Axis, index: number): HTMLElement {
  const section = element("section", "axis-section");
  section.dataset.focusKey = `axis-${axis.id}`;
  section.tabIndex = -1;
  const heading = element("div", "axis-heading");
  const titleWrap = element("div");
  const titleId = `axis-title-${axis.id.replaceAll(".", "-")}`;
  const title = element("h3", "axis-title", localized(axis.question));
  title.id = titleId;
  append(titleWrap, title, element("p", "axis-description", localized(axis.description)));
  const help = button("?", "icon-button axis-help", () => showAxisDialog(axis));
  help.setAttribute("aria-label", `${localized(UI_COPY.axisHelp)}：${localized(axis.label)}`);
  append(heading, element("span", "axis-code", String(index + 1).padStart(2, "0")), titleWrap, help);
  const options = element("div", "option-grid");
  options.setAttribute("role", "radiogroup");
  options.setAttribute("aria-labelledby", titleId);
  for (const option of axis.options) {
    const card = element("label", "option-card");
    const input = element("input");
    input.type = "radio";
    input.name = axis.id;
    input.value = option.id;
    input.checked = state.selections[axis.id] === option.id;
    input.dataset.focusKey = `option-${option.id}`;
    input.addEventListener("change", () => commit({ type: "select", axisId: axis.id, optionId: option.id }, `option-${option.id}`));
    append(card, input, element("span", "option-label", localized(option.label)), element("span", "option-summary", localized(option.summary)));
    if (option.riskTags.length > 0) {
      const risks = element("span", "risk-markers");
      for (const risk of option.riskTags) risks.append(element("span", "risk-marker", `◇ ${localized(RISK_COPY[risk])}`));
      card.append(risks);
    }
    options.append(card);
  }
  const clear = button(localized(UI_COPY.clearAxis), "clear-axis", () => commit({ type: "clear-axis", axisId: axis.id }, `axis-${axis.id}`));
  clear.disabled = state.selections[axis.id] === undefined;
  section.append(heading, options, clear);
  return section;
}

type NavigationUnit = { readonly chapter: ChapterId; readonly role?: RoleId };
const NAVIGATION_UNITS: readonly NavigationUnit[] = [
  { chapter: "context" }, { chapter: "characters", role: "roleA" }, { chapter: "characters", role: "roleB" }, { chapter: "relationship" }, { chapter: "fate" }, { chapter: "palette" },
];

function currentNavigationIndex(): number {
  return NAVIGATION_UNITS.findIndex((unit) => unit.chapter === activeChapter && (unit.chapter !== "characters" || unit.role === activeRole));
}

function moveNavigation(direction: -1 | 1): void {
  const target = NAVIGATION_UNITS[currentNavigationIndex() + direction];
  if (!target) return;
  activeChapter = target.chapter;
  if (target.role) activeRole = target.role;
  focusAfterRender = `chapter-${target.chapter}`;
  render();
}

function createChapterPanel(graph: FateGraph): HTMLElement {
  const column = element("div", "editor-column");
  column.append(createMobileTools());
  const fateButton = button("", "mobile-fate-button", () => showFateDrawer(graph));
  append(fateButton, element("span", "", localized(UI_COPY.showFate)), element("span", "closure-badge", localized(EXTRA_COPY[graph.closure.status])));
  const chapter = CHAPTERS.find((candidate) => candidate.id === activeChapter);
  if (!chapter) throw new Error(`Unknown chapter: ${activeChapter}`);
  const panel = element("section", "chapter-panel");
  const head = element("div", "chapter-heading");
  const copy = element("div");
  append(copy, element("p", "chapter-kicker", localized(chapter.eyebrow)), element("h2", "", localized(chapter.label)), element("p", "chapter-description", localized(chapter.description)));
  head.append(copy);
  if (activeChapter === "characters") {
    const actor = element("div");
    append(actor, createRoleSwitch(), element("p", "actor-note", localized(activeRole === "roleA" ? EXTRA_COPY.chapterActorA : EXTRA_COPY.chapterActorB)));
    head.append(actor);
  }
  panel.append(head);
  const axes = chapterAxes(activeChapter);
  const stack = element("div", "axis-stack");
  axes.forEach((axis, index) => stack.append(createAxisSection(axis, index)));
  panel.append(stack);
  const footer = element("div", "chapter-footer");
  const previous = button(`← ${localized(UI_COPY.previous)}`, "quiet-button", () => moveNavigation(-1));
  previous.disabled = currentNavigationIndex() === 0;
  const actions = element("div", "inline-actions");
  const fill = button(localized(UI_COPY.fillGap), "secondary-button", () => fillRuleBackedGap(graph));
  fill.disabled = !graph.gaps.some((gap) => gap.blocking);
  fill.title = fill.disabled ? localized(UI_COPY.noGap) : "";
  const next = button(`${localized(UI_COPY.next)} →`, "primary-button", () => moveNavigation(1));
  next.disabled = currentNavigationIndex() === NAVIGATION_UNITS.length - 1;
  actions.append(fill, next);
  footer.append(previous, actions);
  panel.append(footer);
  column.append(fateButton, panel, createComposePanel(graph));
  return column;
}

function createComposePanel(graph: FateGraph): HTMLElement {
  const panel = element("section", "compose-panel");
  panel.setAttribute("aria-labelledby", "compose-title");
  const heading = element("div", "panel-heading");
  const title = element("h2", "", localized(UI_COPY.compose));
  title.id = "compose-title";
  heading.append(title);
  panel.append(heading);
  const notesGroup = element("div", "field-group");
  const notesHead = element("div", "field-heading");
  const notesLabel = element("label");
  notesLabel.htmlFor = "creative-notes";
  notesLabel.append(element("strong", "", localized(UI_COPY.notes)));
  const noteCount = element("span", "field-count", `${state.notes.length}/4000`);
  append(notesHead, notesLabel, noteCount);
  const notes = element("textarea", "textarea");
  notes.id = "creative-notes";
  notes.maxLength = 4000;
  notes.placeholder = localized(UI_COPY.notesPlaceholder);
  notes.value = state.notes;
  notes.addEventListener("input", () => {
    commitWithoutRender({ type: "set-notes", notes: notes.value });
    noteCount.textContent = `${notes.value.length}/4000`;
  });
  append(notesGroup, notesHead, element("span", "field-hint", localized(UI_COPY.notesHint)), notes);
  panel.append(notesGroup, createRoutePanel(), createDraftPanel(), createSeedPanel());
  const readiness = getReadiness(graph);
  const actions = element("div", "compose-actions");
  const readinessCopy = element("div", "readiness");
  const readinessMessage = element("span", "", readiness.message);
  readinessMessage.id = "readiness-message";
  append(readinessCopy, element("strong", "", readiness.ready ? localized(EXTRA_COPY.readyTitle) : localized(EXTRA_COPY.notReadyTitle)), readinessMessage);
  const preview = button(localized(UI_COPY.preview), "primary-button", () => openPreview(graph));
  preview.disabled = !readiness.ready;
  preview.dataset.focusKey = "open-preview";
  preview.setAttribute("aria-describedby", readinessMessage.id);
  actions.append(readinessCopy, preview);
  panel.append(actions);
  return panel;
}

function createRoutePanel(): HTMLElement {
  const catalog = routeCatalog();
  const card = element("div", "route-card");
  const tabs = element("div", "route-tabs");
  (["offline", "default", "byok"] as const).forEach((route) => {
    const status = catalog[route];
    const control = button(localized(status.label), "route-tab", () => {
      if (route !== "byok") transientKey.clear();
      commit({ type: "set-route", route }, `route-${route}`);
    });
    control.dataset.focusKey = `route-${route}`;
    control.setAttribute("aria-pressed", String(state.route === route));
    if (!status.available) control.title = localized(status.unavailableReason ?? UI_COPY.routeUnavailable);
    tabs.append(control);
  });
  const status = catalog[state.route];
  const statusRow = element("div", "route-status");
  const dot = element("span", `status-dot${status.available ? " is-ready" : ""}`);
  dot.setAttribute("aria-hidden", "true");
  const statusCopy = element("div");
  append(statusCopy, element("strong", "", `${localized(status.label)} · ${localized(status.available ? EXTRA_COPY.available : EXTRA_COPY.unavailable)}`), element("p", "", status.available ? localized(status.description) : localized(status.unavailableReason ?? UI_COPY.routeUnavailable)), element("p", "privacy-note", localized(status.privacy)));
  append(statusRow, dot, statusCopy);
  append(card, element("p", "micro-label", localized(UI_COPY.route)), tabs, statusRow);
  if (state.route === "byok") card.append(createByokFields());
  return card;
}

function createByokFields(): HTMLElement {
  const adapters = directByokRegistry.list();
  const disabled = !BYOK_ROUTE_ENABLED || adapters.length === 0;
  const fields = element("div", "route-fields");
  const providerGroup = element("label", "field-group");
  providerGroup.append(element("span", "field-hint", localized(UI_COPY.byokProvider)));
  const select = element("select", "select");
  select.disabled = disabled;
  const empty = element("option", "", localized(UI_COPY.noProvider));
  empty.value = "";
  select.append(empty);
  for (const adapter of adapters) {
    const option = element("option", "", adapter.displayName);
    option.value = adapter.id;
    option.selected = state.connection.providerId === adapter.id;
    select.append(option);
  }
  select.addEventListener("change", () => {
    transientKey.clear();
    commit({ type: "set-provider", providerId: select.value });
  });
  providerGroup.append(select);
  const modelGroup = element("label", "field-group");
  modelGroup.append(element("span", "field-hint", localized(UI_COPY.byokModel)));
  const model = element("input", "input");
  model.value = state.connection.modelId;
  model.disabled = disabled;
  model.autocomplete = "off";
  model.addEventListener("change", () => commit({ type: "set-model", modelId: model.value }));
  modelGroup.append(model);
  const keyGroup = element("label", "field-group");
  keyGroup.append(element("span", "field-hint", localized(UI_COPY.byokKey)));
  const key = element("input", "input");
  key.type = "password";
  key.disabled = disabled;
  key.autocomplete = "off";
  key.spellcheck = false;
  const keyState = element("span", "field-hint", localized(transientKey.has() ? EXTRA_COPY.routeKeyStateSet : EXTRA_COPY.routeKeyStateEmpty));
  key.addEventListener("input", () => {
    transientKey.clear();
    if (key.value) {
      try { transientKey.set(key.value); } catch { key.value = ""; }
    }
    keyState.textContent = localized(transientKey.has() ? EXTRA_COPY.routeKeyStateSet : EXTRA_COPY.routeKeyStateEmpty);
  });
  keyGroup.append(key);
  const keyActions = element("div", "key-state");
  const clear = button(localized(UI_COPY.clearKey), "quiet-button", () => {
    transientKey.clear();
    key.value = "";
    keyState.textContent = localized(EXTRA_COPY.routeKeyStateEmpty);
    announce(localized(EXTRA_COPY.clearKeyDone));
  });
  clear.disabled = disabled;
  append(keyActions, keyState, clear);
  append(fields, providerGroup, modelGroup, keyGroup, keyActions);
  return fields;
}

function createDraftPanel(): HTMLElement {
  const card = element("div", "draft-card");
  const row = element("div", "draft-row");
  const copy = element("div");
  append(copy, element("strong", "", localized(UI_COPY.draft)), element("span", "", localized(state.draftSavingEnabled ? UI_COPY.draftOn : UI_COPY.draftOff)));
  const toggle = button(localized(state.draftSavingEnabled ? UI_COPY.disableDraft : UI_COPY.enableDraft), "quiet-button", toggleDraftSaving);
  toggle.dataset.focusKey = "draft-toggle";
  toggle.disabled = !browserStorage && !state.draftSavingEnabled;
  row.append(copy, toggle);
  const disclosure = browserStorage ? localized(state.draftSavingEnabled ? APP_COPY.draft.enabled : APP_COPY.draft.disabled) : localized(EXTRA_COPY.draftUnavailable);
  append(card, row, element("p", "privacy-note", disclosure));
  if (browserStorage && state.draftSavingEnabled) card.append(button(localized(UI_COPY.clearDraft), "quiet-button", clearDraftOnly));
  return card;
}

function createSeedPanel(): HTMLElement {
  const group = element("div", "field-group");
  const heading = element("div", "field-heading");
  const label = element("label");
  label.htmlFor = "random-seed";
  label.append(element("strong", "", localized(UI_COPY.seed)));
  const next = button(localized(UI_COPY.nextSeed), "quiet-button", () => commit({ type: "set-seed", seed: nextSeed(state.seed) }, "random-seed"));
  heading.append(label, next);
  const input = element("input", "input");
  input.id = "random-seed";
  input.dataset.focusKey = "random-seed";
  input.value = state.seed;
  input.maxLength = 120;
  input.addEventListener("change", () => commit({ type: "set-seed", seed: input.value }, "random-seed"));
  append(group, heading, input, element("span", "field-hint", localized(EXTRA_COPY.seedHint)));
  return group;
}

function getReadiness(graph: FateGraph): { readonly ready: boolean; readonly message: string } {
  if (graph.nodes.filter((node) => node.chapter !== "palette").length === 0) return { ready: false, message: localized(UI_COPY.noSelections) };
  const catalog = routeCatalog();
  const route = planRoute(state, catalog, transientKey.has());
  if (!route.ready) return { ready: false, message: localized(route.blocks[0]?.message ?? UI_COPY.routeUnavailable) };
  if (state.outputMode === "full" && !graph.closure.isClosed) return { ready: false, message: localized(UI_COPY.fullNeedsClosure) };
  return { ready: true, message: localized(EXTRA_COPY.readyBody) };
}

function graphViewData(graph: FateGraph): GraphViewData {
  const semanticColumn = (chapter: ChapterId): number => chapter === "context" ? 0 : chapter === "characters" ? 1 : chapter === "relationship" ? 2 : 3;
  const columnFor = (chapter: ChapterId): number => semanticColumn(chapter) * 2;
  const optionColumn = (optionId: string): number => {
    const axisId = getOption(optionId)?.axisId;
    const chapter = axisId ? getAxis(axisId)?.chapter : undefined;
    return chapter ? columnFor(chapter) : 0;
  };
  const junctions = (graph.junctions ?? []).flatMap((junction) => {
    const targetColumn = optionColumn(junction.target);
    const sourceColumn = Math.max(...junction.sources.map(optionColumn));
    return targetColumn > sourceColumn
      ? [{ junction, column: targetColumn - 1 }]
      : [];
  });
  const visibleJunctions = new Map(junctions.map((item) => [item.junction.relationId, item]));
  const edges = graph.edges.flatMap((edge) => {
    const junction = edge.relationId ? visibleJunctions.get(edge.relationId) : undefined;
    if (edge.sourceCount && edge.sourceCount > 1) {
      return junction ? [{
        id: `${edge.id}:prerequisite`,
        source: edge.source,
        target: junction.junction.id,
        kind: edge.kind,
        label: localized(junction.junction.label),
        directed: false,
      }] : [];
    }
    return [{ id: edge.id, source: edge.source, target: edge.target, kind: edge.kind, label: localized(edge.label), directed: true }];
  });
  for (const { junction } of junctions) {
    edges.push({
      id: `${junction.id}:result`,
      source: junction.id,
      target: junction.target,
      kind: junction.kind,
      label: localized(junction.label),
      directed: true,
    });
  }
  return {
    columns: [localized(UI_COPY.graphColumns.context), "", localized(UI_COPY.graphColumns.characters), "", localized(UI_COPY.graphColumns.relationship), "", localized(UI_COPY.graphColumns.fate)],
    nodes: [
      ...graph.nodes.filter((node) => node.chapter !== "palette").map((node) => ({
        id: node.id,
        code: `${String((getAxis(node.axisId)?.order ?? 0) + 1).padStart(2, "0")} · ${localized(node.axisLabel)}`,
        label: localized(node.label),
        column: columnFor(node.chapter),
        axisId: node.axisId,
        kind: "option" as const,
      })),
      ...junctions.map(({ junction, column }) => ({
        id: junction.id,
        code: localized(EXTRA_COPY.allRequired),
        label: localized(EXTRA_COPY.convergence),
        column,
        kind: "junction" as const,
      })),
    ],
    edges,
    emptyText: localized(UI_COPY.fateEmpty),
    onNodeSelect: (axisId) => navigateToAxis(axisId as AxisId),
  };
}

function createFateColumn(
  graph: FateGraph,
  compact = false,
  registerGraph: (handle: GraphViewHandle) => void = (handle) => graphHandles.push(handle),
): HTMLElement {
  const column = element("aside", compact ? "drawer-fate-content" : "fate-column");
  if (!compact) column.setAttribute("aria-label", localized(UI_COPY.fateMap));
  const panel = element("section", "fate-panel");
  const heading = element("div", "panel-heading");
  const badge = element("span", `closure-badge${graph.closure.status === "closed" ? " is-closed" : graph.closure.status === "blocked" ? " is-blocked" : ""}`, localized(EXTRA_COPY[graph.closure.status]));
  heading.append(element("h2", "", localized(UI_COPY.fateMap)), badge);
  append(panel, heading, element("p", "fate-summary", localized(EXTRA_COPY.graphSummary)));
  const legend = element("div", "graph-legend");
  (["causal", "support", "tension", "open"] as const).forEach((kind) => {
    const item = element("span", "graph-legend-item");
    item.append(element("i", `graph-legend-line is-${kind}`), document.createTextNode(localized(UI_COPY.relationKind[kind])));
    legend.append(item);
  });
  panel.append(legend);
  const graphView = createFateGraph(graphViewData(graph));
  registerGraph(graphView);
  panel.append(graphView.root);
  panel.append(createFindingSection(localized(UI_COPY.established), graph.relations.filter((item) => item.kind !== "conflict").map((relation) => {
    const sources = relation.sources?.map((optionId) => getOption(optionId)).filter((option) => option !== undefined) ?? [];
    const target = relation.target ? getOption(relation.target) : undefined;
    const prerequisite = sources.length > 1 && target
      ? `${localized(EXTRA_COPY.allRequired)}：${sources.map((option) => localized(option.label)).join(" + ")} → ${localized(target.label)}。`
      : "";
    return {
      id: relation.id,
      title: `${localized(UI_COPY.relationKind[relation.kind])} · ${localized(relation.label)}`,
      body: `${prerequisite}${localized(relation.rationale)}`,
      tone: relation.kind === "tension" ? "tension" : "relation",
    };
  })));
  panel.append(createFindingSection(localized(UI_COPY.conflicts), graph.conflicts.map((conflict) => ({ id: conflict.id, title: localized(conflict.label), body: localized(conflict.rationale), tone: "conflict" }))));
  panel.append(createFindingSection(localized(UI_COPY.gaps), graph.gaps.map((gap) => {
    const current = gap.selectedOption ? getOption(gap.selectedOption) : undefined;
    const path = graph.paths?.find((candidate) => candidate.id === gap.pathId);
    const acceptable = gap.acceptableOptions
      ?.map((optionId) => getOption(optionId))
      .filter((option) => option !== undefined)
      .map((option) => localized(option.label));
    const details = [
      current ? `${localized(EXTRA_COPY.incompatibleSelection)} ${localized(current.label)}` : localized(gap.message),
      acceptable?.length ? `${localized(EXTRA_COPY.acceptableLabel)}：${acceptable.join(" / ")}` : "",
    ].filter(Boolean).join(" ");
    return {
      id: gap.id,
      title: `${localized(path?.label ?? EXTRA_COPY.pathLabel)} · ${localized(getAxis(gap.requiredAxis)?.label ?? UI_COPY.gaps)}`,
      body: details,
      tone: "gap",
    };
  })));
  const reasons = element("div", "closure-reasons");
  graph.closure.reasons.forEach((reason) => reasons.append(element("p", "fate-summary", localized(reason))));
  panel.append(reasons);
  column.append(panel, createSelectionOverview());
  return column;
}

interface FindingView { readonly id: string; readonly title: string; readonly body: string; readonly tone: "relation" | "tension" | "conflict" | "gap"; }

function createFindingSection(title: string, findings: readonly FindingView[]): HTMLElement {
  const section = element("section", "finding-section");
  section.append(element("h3", "micro-label", title));
  const list = element("ul", "finding-list");
  if (findings.length === 0) list.append(element("li", "finding-item", localized(EXTRA_COPY.noFindings)));
  else findings.forEach((finding) => {
    const item = element("li", `finding-item is-${finding.tone}`);
    append(item, element("strong", "", finding.title), document.createTextNode(finding.body));
    list.append(item);
  });
  section.append(list);
  return section;
}

function createSelectionOverview(): HTMLElement {
  const section = element("section", "selection-overview");
  const heading = element("div", "panel-heading");
  heading.append(element("h3", "", localized(UI_COPY.selectedOverview)));
  const selected = AXES.flatMap((axis) => {
    const optionId = state.selections[axis.id];
    const option = optionId ? getOption(optionId) : undefined;
    return option ? [{ axis, option }] : [];
  });
  heading.append(element("span", "progress-count", String(selected.length)));
  section.append(heading);
  if (selected.length === 0) {
    section.append(element("p", "fate-summary", localized(EXTRA_COPY.noSelectionsOverview)));
    return section;
  }
  const list = element("ul", "selection-list");
  selected.forEach(({ axis, option }) => {
    const item = element("li", "selection-item");
    const edit = button(localized(UI_COPY.edit), "", () => navigateToAxis(axis.id));
    edit.setAttribute("aria-label", `${localized(UI_COPY.edit)}：${localized(axis.label)}`);
    item.append(element("code", "", String(axis.order + 1).padStart(2, "0")), element("span", "", `${localized(axis.shortLabel)} · ${localized(option.label)}`), edit);
    list.append(item);
  });
  section.append(list);
  return section;
}

function createFooter(): HTMLElement {
  const footer = element("footer", "app-footer");
  append(footer, element("span", "", localized(UI_COPY.footer)), element("span", "", "OC FATE LOOM · 0.1.0"));
  return footer;
}

function createEditorView(): HTMLElement {
  const shell = element("div", "app-shell");
  shell.append(createTopbar(), createThesis());
  const workspace = element("main", "workspace-frame");
  workspace.id = "workspace";
  const grid = element("div", "workspace-grid");
  const graph = deriveFateGraph(state.selections);
  grid.append(createChapterRail(), createChapterPanel(graph), createFateColumn(graph));
  workspace.append(grid, createMobileActionBar(graph));
  shell.append(workspace, createFooter(), createLiveRegion());
  return shell;
}

function createMobileTools(): HTMLElement {
  const tools = element("div", "mobile-tools");
  tools.setAttribute("aria-label", state.locale === "zh" ? "快捷工具" : "Quick tools");
  const random = button(localized(UI_COPY.randomStart), "quiet-button", fillRandomStart);
  random.dataset.focusKey = "mobile-random-start";
  tools.append(
    button(localized(UI_COPY.help), "quiet-button", showHelpDialog),
    random,
    button(localized(UI_COPY.clearAll), "quiet-button", showClearDialog),
  );
  return tools;
}

function createMobileActionBar(graph: FateGraph): HTMLElement {
  const readiness = getReadiness(graph);
  const bar = element("div", "mobile-action-bar");
  const summary = element("div", "mobile-action-summary");
  const message = element("span", "", readiness.message);
  message.id = "mobile-readiness-message";
  append(summary, element("strong", "", readiness.ready ? localized(EXTRA_COPY.readyTitle) : localized(EXTRA_COPY.notReadyTitle)), message);
  const action = button(localized(UI_COPY.preview), "primary-button", () => openPreview(graph));
  action.disabled = !readiness.ready;
  action.setAttribute("aria-describedby", message.id);
  bar.append(summary, action);
  return bar;
}

function createLiveRegion(): HTMLElement {
  const live = element("div", "sr-only");
  live.dataset.liveRegion = "";
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");
  return live;
}

function openPreview(graph: FateGraph): void {
  const readiness = getReadiness(graph);
  if (!readiness.ready || state.route !== "offline") { announce(readiness.message); return; }
  const result = generateStructurePreview(state, graph);
  if (!result.ok) { announce(localized(result.issues[0]?.message ?? UI_COPY.fullNeedsClosure)); return; }
  currentPreview = result.preview;
  view = "result";
  focusAfterRender = "result-title";
  window.scrollTo({ top: 0, behavior: "auto" });
  render();
}

function createResultView(preview: StructurePreview): HTMLElement {
  const shell = element("div", "result-shell app-shell");
  shell.append(createTopbar());
  const head = element("header", "result-head");
  const copy = element("div");
  append(copy, element("p", "eyebrow", localized(UI_COPY.resultEyebrow)), element("h1", "result-title", localized(preview.name)), element("p", "result-subtitle", `${localized(preview.disclaimer)} · ${localized(EXTRA_COPY.resultMode[preview.mode])} · ${preview.seed}`));
  const resultTitle = copy.querySelector<HTMLElement>(".result-title");
  if (resultTitle) {
    resultTitle.tabIndex = -1;
    resultTitle.dataset.focusKey = "result-title";
  }
  const actions = element("div", "result-actions");
  actions.append(button(localized(UI_COPY.adjust), "secondary-button", returnToEditor), button(localized(UI_COPY.copy), "secondary-button", () => void copyPreview(preview)), button(localized(UI_COPY.export), "primary-button", exportConfiguration));
  head.append(copy, actions);
  shell.append(head);
  const metrics = element("section", "result-metrics");
  const overallStatus = preview.status === "closed" ? EXTRA_COPY.closed : preview.status === "conflicted" ? EXTRA_COPY.blocked : EXTRA_COPY.open;
  const metricValues: readonly [LocalizedText, string][] = [[EXTRA_COPY.previewMetrics.edges, String(preview.metrics.edgeCount)], [EXTRA_COPY.previewMetrics.conflicts, String(preview.metrics.conflictCount)], [EXTRA_COPY.previewMetrics.gaps, String(preview.metrics.gapCount)], [EXTRA_COPY.previewMetrics.structure, localized(overallStatus)]];
  metricValues.forEach(([label, value]) => {
    const metric = element("div", "metric-card");
    append(metric, element("strong", "", value), element("span", "", localized(label)));
    metrics.append(metric);
  });
  shell.append(metrics);
  const grid = element("main", "result-grid");
  grid.id = "workspace";
  const outline = element("nav", "result-outline");
  outline.setAttribute("aria-label", localized(preview.name));
  preview.sections.forEach((section) => {
    const link = element("a", "", localized(section.title));
    link.href = `#result-${section.id}`;
    outline.append(link);
  });
  const content = element("div", "result-content");
  preview.sections.forEach((section) => {
    const card = element("section", "result-section");
    card.id = `result-${section.id}`;
    append(card, element("h2", "", localized(section.title)), element("p", "result-section-summary", localized(section.summary)));
    const list = element("ul", "result-list");
    section.items.forEach((item) => {
      const li = element("li", `result-item is-${item.tone}`);
      append(li, element("span", "", localized(item.text)));
      if (item.meta) li.append(element("small", "", localized(item.meta)));
      list.append(li);
    });
    card.append(list);
    content.append(card);
  });
  grid.append(outline, content);
  shell.append(grid, createFooter(), createLiveRegion());
  return shell;
}

function returnToEditor(): void { view = "editor"; currentPreview = null; focusAfterRender = "open-preview"; render(); }

function fillRandomStart(): void {
  const axisIds: readonly AxisId[] = ["context.pressure", "roleA.goal", "roleB.goal", "relationship.bond"];
  let nextState = state;
  let added = 0;
  for (const axisId of axisIds) {
    if (nextState.selections[axisId]) continue;
    const selected = seededOrder(getOptionsForAxis(axisId), `${state.seed}:${axisId}`, (option) => option.id)[0];
    if (selected) {
      nextState = reduceAppState(nextState, { type: "select", axisId, optionId: selected.id });
      added += 1;
    }
  }
  state = nextState;
  safePersist();
  currentPreview = null;
  render();
  announce(state.locale === "zh" ? `这次补进了 ${added} 个起点。` : `${added} starting ${added === 1 ? "point was" : "points were"} added.`);
}

function fillRuleBackedGap(graph: FateGraph): void {
  const blocking = graph.gaps.filter((candidate) => candidate.blocking);
  if (blocking.length === 0) { announce(localized(UI_COPY.noGap)); return; }

  const byAxis = new Map<AxisId, typeof blocking>();
  for (const gap of blocking) {
    byAxis.set(gap.requiredAxis, [...(byAxis.get(gap.requiredAxis) ?? []), gap]);
  }
  const ranked = [...byAxis.entries()].map(([axisId, gaps]) => {
    const allowedSets = gaps.flatMap((gap) => gap.acceptableOptions ? [new Set(gap.acceptableOptions)] : []);
    const candidates = getOptionsForAxis(axisId).filter((option) => allowedSets.every((set) => set.has(option.id)));
    return { axisId, gaps, candidates };
  }).sort((left, right) => left.candidates.length - right.candidates.length || (getAxis(left.axisId)?.order ?? 99) - (getAxis(right.axisId)?.order ?? 99));

  const target = ranked[0];
  if (!target) { announce(localized(UI_COPY.noGap)); return; }
  const axis = getAxis(target.axisId);
  if (axis) { activeChapter = axis.chapter; if (axis.role) activeRole = axis.role; }

  if (state.selections[target.axisId] !== undefined) {
    focusAfterRender = `axis-${target.axisId}`;
    render();
    announce(localized(EXTRA_COPY.noSafeGapFill));
    return;
  }

  const ordered = seededOrder(target.candidates, `${state.seed}:${target.gaps.map((gap) => gap.id).join(":")}`, (option) => option.id);
  const evaluated = ordered.map((option, seedOrder) => {
    const nextGraph = deriveFateGraph({ ...state.selections, [target.axisId]: option.id });
    return {
      option,
      seedOrder,
      conflicts: nextGraph.conflicts.length,
      blockingGaps: nextGraph.gaps.filter((gap) => gap.blocking).length,
      allGaps: nextGraph.gaps.length,
    };
  }).filter((candidate) => candidate.conflicts <= graph.conflicts.length)
    .sort((left, right) => left.conflicts - right.conflicts || left.blockingGaps - right.blockingGaps || left.allGaps - right.allGaps || left.seedOrder - right.seedOrder);
  const selected = evaluated[0]?.option;
  if (!selected) {
    focusAfterRender = `axis-${target.axisId}`;
    render();
    announce(localized(EXTRA_COPY.noSafeGapFill));
    return;
  }

  state = reduceAppState(state, { type: "select", axisId: target.axisId, optionId: selected.id });
  safePersist();
  focusAfterRender = `axis-${target.axisId}`;
  currentPreview = null;
  render();
  announce(localized(EXTRA_COPY.gapComplete));
}

function toggleDraftSaving(): void {
  if (state.draftSavingEnabled) { if (browserStorage) state = disableDraftSaving(browserStorage, state); }
  else if (browserStorage) { state = reduceAppState(state, { type: "set-draft-saving", enabled: true }); safePersist(); }
  focusAfterRender = "draft-toggle";
  render();
}

function clearDraftOnly(): void {
  if (!browserStorage) return;
  clearSavedDraft(browserStorage);
  announce(localized(APP_COPY.draft.cleared));
}

function exportConfiguration(): void {
  downloadText(exportFileName(state), serializeConfiguration(state), "application/json;charset=utf-8");
  announce(localized(EXTRA_COPY.exported));
}

function previewAsText(preview: StructurePreview): string {
  const lines = [localized(preview.name), localized(preview.disclaimer), ""];
  for (const section of preview.sections) {
    lines.push(`# ${localized(section.title)}`, localized(section.summary));
    section.items.forEach((item) => lines.push(`- ${localized(item.text)}${item.meta ? ` — ${localized(item.meta)}` : ""}`));
    lines.push("");
  }
  return lines.join("\n");
}

async function copyPreview(preview: StructurePreview): Promise<void> {
  try { await navigator.clipboard.writeText(previewAsText(preview)); announce(localized(UI_COPY.copied)); }
  catch { announce(localized(EXTRA_COPY.previewCopyFailed)); }
}

function showDialog(title: string, body: HTMLElement, className = "modal"): HTMLDialogElement {
  const dialog = element("dialog", className);
  const head = element("div", className === "drawer" ? "drawer-head" : "modal-head");
  const close = button("×", "icon-button", () => dialog.close());
  close.setAttribute("aria-label", localized(UI_COPY.close));
  const heading = element("h2", "", title);
  heading.id = `dialog-title-${crypto.randomUUID()}`;
  dialog.setAttribute("aria-labelledby", heading.id);
  head.append(heading, close);
  const content = element("div", className === "drawer" ? "drawer-body" : "modal-body");
  content.append(body);
  dialog.append(head, content);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}

function showHelpDialog(): void {
  const body = element("div");
  body.append(element("p", "", localized(UI_COPY.helpIntro)));
  const list = element("ol", "help-list");
  EXTRA_COPY.helpSteps.forEach((step) => list.append(element("li", "", localized(step))));
  const privacy = element("section", "help-privacy");
  append(
    privacy,
    element("h3", "", localized(EXTRA_COPY.helpPrivacyTitle)),
    element("p", "", localized(EXTRA_COPY.helpPrivacyDraft)),
    element("p", "", localized(EXTRA_COPY.helpPrivacyKey)),
  );
  body.append(list, privacy);
  showDialog(localized(UI_COPY.helpTitle), body);
}

function showAxisDialog(axis: Axis): void {
  const body = element("div");
  append(body, element("p", "micro-label", localized(axis.label)), element("p", "", localized(axis.description)), element("p", "", localized(EXTRA_COPY.axisModalIntro)));
  const list = element("div", "modal-option-list");
  axis.options.forEach((option) => {
    const item = element("section", "modal-option");
    append(item, element("h3", "", localized(option.label)), element("p", "", localized(option.detail)));
    if (option.riskTags.length > 0) item.append(element("small", "", `${localized(EXTRA_COPY.riskPrefix)}${option.riskTags.map((risk) => localized(RISK_COPY[risk])).join(state.locale === "zh" ? "、" : ", ")}`));
    list.append(item);
  });
  body.append(list);
  showDialog(localized(axis.question), body);
}

function showFateDrawer(graph: FateGraph): void {
  let drawerGraph: GraphViewHandle | null = null;
  const drawer = showDialog(
    localized(UI_COPY.fateMap),
    createFateColumn(graph, true, (handle) => { drawerGraph = handle; }),
    "drawer",
  );
  drawer.addEventListener("close", () => {
    drawerGraph?.dispose();
    drawerGraph = null;
  }, { once: true });
}

function showClearDialog(): void {
  const body = element("div");
  body.append(element("p", "", localized(UI_COPY.confirmClearBody)));
  const actions = element("div", "result-actions");
  const dialog = showDialog(localized(UI_COPY.confirmClearTitle), body);
  actions.append(button(localized(UI_COPY.cancel), "secondary-button", () => dialog.close()), button(localized(UI_COPY.confirmClear), "danger-button", () => {
    transientKey.clear();
    state = reduceAppState(state, { type: "clear-all" });
    if (browserStorage) { clearSavedDraft(browserStorage); safePersist(); }
    activeChapter = "context";
    activeRole = "roleA";
    currentPreview = null;
    dialog.close();
    render();
  }));
  body.append(actions);
}

function disposeGraphs(): void { graphHandles.forEach((handle) => handle.dispose()); graphHandles = []; }

function render(): void {
  disposeGraphs();
  document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
  document.title = state.locale === "zh" ? "命运织机 · OC Fate Loom" : "OC Fate Loom · Structure Check";
  const skipLink = document.querySelector<HTMLAnchorElement>(".skip-link");
  if (skipLink) skipLink.textContent = localized(EXTRA_COPY.skipWorkspace);
  appRoot.replaceChildren(view === "result" && currentPreview ? createResultView(currentPreview) : createEditorView());
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-chapter-tab="${activeChapter}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
    if (focusAfterRender) {
      document.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focusAfterRender)}"]`)?.focus({ preventScroll: true });
      focusAfterRender = null;
    }
  });
}

render();
