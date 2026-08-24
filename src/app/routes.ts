import type { LocalizedText } from "./contracts";
import { APP_COPY } from "./copy";
import type { AppState, GenerationRoute } from "./state";

export interface RouteStatus {
  readonly id: GenerationRoute;
  readonly label: LocalizedText;
  readonly description: LocalizedText;
  readonly privacy: LocalizedText;
  readonly available: boolean;
  readonly unavailableReason?: LocalizedText;
}

export interface RouteAvailability {
  readonly default?: {
    readonly available: boolean;
    readonly unavailableReason?: LocalizedText;
  };
  readonly byok?: {
    readonly available: boolean;
    readonly unavailableReason?: LocalizedText;
  };
}

export type RouteCatalog = Readonly<Record<GenerationRoute, RouteStatus>>;

export function createRouteCatalog(availability: RouteAvailability = {}): RouteCatalog {
  const hosted = availability.default;
  const byok = availability.byok;
  return {
    offline: {
      id: "offline",
      ...APP_COPY.route.offline,
      available: true,
    },
    default: {
      id: "default",
      label: APP_COPY.route.default.label,
      description: APP_COPY.route.default.description,
      privacy: APP_COPY.route.default.privacy,
      available: hosted?.available ?? false,
      unavailableReason: hosted?.available
        ? undefined
        : (hosted?.unavailableReason ?? APP_COPY.route.default.unavailable),
    },
    byok: {
      id: "byok",
      label: APP_COPY.route.byok.label,
      description: APP_COPY.route.byok.description,
      privacy: APP_COPY.route.byok.privacy,
      available: byok?.available ?? false,
      unavailableReason: byok?.available ? undefined : (byok?.unavailableReason ?? APP_COPY.route.byok.unavailable),
    },
  };
}

export type RouteBlockCode =
  | "ROUTE_UNAVAILABLE"
  | "PROVIDER_REQUIRED"
  | "MODEL_REQUIRED"
  | "EPHEMERAL_KEY_REQUIRED";

export interface RouteBlock {
  readonly code: RouteBlockCode;
  readonly message: LocalizedText;
}

export interface RoutePlan {
  readonly route: GenerationRoute;
  readonly ready: boolean;
  readonly blocks: readonly RouteBlock[];
}

const routeMessage = {
  provider: { zh: "请选择已审核的供应商。", en: "Choose an approved provider." },
  model: { zh: "请输入该供应商的模型 ID。", en: "Enter a model ID for that provider." },
  key: {
    zh: "请为本次页面会话输入 API Key；专用输入框只在当前页使用。",
    en: "Enter an API key for this page session; the dedicated field is used only in the current page.",
  },
} satisfies Record<string, LocalizedText>;

export function planRoute(
  state: AppState,
  catalog: RouteCatalog = createRouteCatalog(),
  hasEphemeralKey = false,
): RoutePlan {
  const status = catalog[state.route];
  const blocks: RouteBlock[] = [];
  if (!status.available) {
    blocks.push({
      code: "ROUTE_UNAVAILABLE",
      message: status.unavailableReason ?? APP_COPY.route.default.unavailable,
    });
  }
  if (state.route === "byok" && status.available) {
    if (!state.connection.providerId) blocks.push({ code: "PROVIDER_REQUIRED", message: routeMessage.provider });
    if (!state.connection.modelId) blocks.push({ code: "MODEL_REQUIRED", message: routeMessage.model });
    if (!hasEphemeralKey) blocks.push({ code: "EPHEMERAL_KEY_REQUIRED", message: routeMessage.key });
  }
  return { route: state.route, ready: blocks.length === 0, blocks };
}

export const getGenerationReadiness = planRoute;
