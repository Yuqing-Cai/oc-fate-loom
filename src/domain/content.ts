import type {
  Axis,
  AxisId,
  AxisOption,
  Chapter,
  CharacterDimension,
  LocalizedText,
  RiskTag,
  RoleId,
  RolePresentation,
} from "./types";

const text = (zh: string, en: string): LocalizedText => ({ zh, en });

export const DEFAULT_ROLE_PRESENTATION: Readonly<Record<RoleId, RolePresentation>> = {
  roleA: {
    id: "roleA",
    name: text("她", "her"),
    subject: text("她", "she"),
    possessive: text("她的", "her"),
  },
  roleB: {
    id: "roleB",
    name: text("他", "him"),
    subject: text("他", "he"),
    possessive: text("他的", "his"),
  },
};

export const CHAPTERS: readonly Chapter[] = [
  {
    id: "context",
    order: 0,
    label: text("境遇", "Context"),
    eyebrow: text("01 · 压力从何而来", "01 · Where pressure begins"),
    description: text(
      "先确定故事施加于两个人的共同压力，以及时间如何限制他们。",
      "Set the pressure shared by both characters and the clock that limits them.",
    ),
  },
  {
    id: "characters",
    order: 1,
    label: text("双角色", "Two characters"),
    eyebrow: text("02 · 两个人都拥有命运", "02 · Both people own a fate"),
    description: text(
      "她与他分别拥有目标、立场、边界、脆弱点和真正的抉择权。",
      "She and he each have a goal, a stance, boundaries, vulnerabilities, and real authority to choose.",
    ),
  },
  {
    id: "relationship",
    order: 2,
    label: text("关系", "Relationship"),
    eyebrow: text("03 · 关系如何运作", "03 · How the relationship works"),
    description: text(
      "权力并不等于爱，亲密也不能取消边界；在这里决定两者如何协商。",
      "Power is not love, and intimacy does not erase boundaries; decide how the pair negotiates both.",
    ),
  },
  {
    id: "fate",
    order: 3,
    label: text("命运", "Fate"),
    eyebrow: text("04 · 代价如何落地", "04 · Where the cost lands"),
    description: text(
      "结局必须承担此前的选择与代价，而不是自动把失守解释为浪漫。",
      "The ending must carry earlier choices and costs instead of treating every surrender as romantic.",
    ),
  },
  {
    id: "palette",
    order: 4,
    label: text("文字质感", "Prose palette"),
    eyebrow: text("05 · 故事如何被讲述", "05 · How the story is told"),
    description: text(
      "质感只改变语言的温度、节奏与观察距离，不篡改事件本身。",
      "The palette changes temperature, rhythm, and narrative distance without rewriting the events.",
    ),
  },
];

interface OptionSeed {
  readonly key: string;
  readonly label: LocalizedText;
  readonly summary: LocalizedText;
  readonly detail: LocalizedText;
  readonly tags?: readonly string[];
  readonly riskTags?: readonly RiskTag[];
}

const option = (axisId: AxisId, seed: OptionSeed): AxisOption => ({
  id: `${axisId}.${seed.key}`,
  axisId,
  semanticKey: seed.key,
  label: seed.label,
  summary: seed.summary,
  detail: seed.detail,
  tags: seed.tags ?? [],
  riskTags: seed.riskTags ?? [],
});

const axis = (
  value: Omit<Axis, "options" | "selectionMode"> & { readonly options: readonly OptionSeed[] },
): Axis => ({
  ...value,
  selectionMode: "single",
  options: value.options.map((seed) => option(value.id, seed)),
});

const CONTEXT_AXES: readonly Axis[] = [
  axis({
    id: "context.pressure",
    chapter: "context",
    order: 0,
    role: null,
    dimension: null,
    label: text("共同压力", "Shared pressure"),
    shortLabel: text("压力", "Pressure"),
    question: text("什么迫使他们现在就行动？", "What forces them to act now?"),
    description: text(
      "这里选择的是主导压力，而不是唯一的世界类型。",
      "Choose the dominant pressure, not the story's only genre or setting.",
    ),
    options: [
      {
        key: "siege",
        label: text("生存围困", "Survival siege"),
        summary: text("资源与退路同时减少，拖延本身就是决定。", "Resources and exits are shrinking; delay is itself a decision."),
        detail: text("适合战争、灾变、追捕或任何迫使双方分配有限资源的处境。", "Works for war, disaster, pursuit, or any situation that forces the pair to allocate scarce resources."),
        tags: ["survival", "scarcity"],
        riskTags: ["violence", "death"],
      },
      {
        key: "institution",
        label: text("制度绞索", "Institutional bind"),
        summary: text("身份、誓约与规则让每个私人选择产生公共后果。", "Status, oaths, and rules give every private choice a public consequence."),
        detail: text("适合朝堂、宗门、组织或家族，不预设制度必然正当或必然邪恶。", "Works for courts, orders, institutions, or families without assuming the system is wholly just or evil."),
        tags: ["institution", "duty"],
        riskTags: ["control", "power-imbalance"],
      },
      {
        key: "exposure",
        label: text("秘密将破", "Imminent exposure"),
        summary: text("一个足以改变关系与身份的真相正在失去掩护。", "A truth capable of changing both identity and relationship is losing its cover."),
        detail: text("压力来自知情者、证据或期限；秘密揭开后仍需让角色承担反应。", "Pressure comes from witnesses, evidence, or a deadline; once revealed, the characters must still own their responses."),
        tags: ["secret", "truth"],
      },
      {
        key: "crossing",
        label: text("不可回头的旅程", "Point-of-no-return journey"),
        summary: text("每前进一步都关闭一条旧生活的退路。", "Every step forward closes one route back to the old life."),
        detail: text("可以是地理远行、潜入、逃亡或社会身份的越界。", "The crossing may be travel, infiltration, flight, or a move beyond an old social identity."),
        tags: ["journey", "transformation"],
        riskTags: ["separation"],
      },
    ],
  }),
  axis({
    id: "context.clock",
    chapter: "context",
    order: 1,
    role: null,
    dimension: null,
    label: text("时间结构", "Time structure"),
    shortLabel: text("时间", "Clock"),
    question: text("他们拥有同一种时间吗？", "Do they live on the same clock?"),
    description: text(
      "寿命与期限是叙事约束，不把任何身体状态写成道德高低。",
      "Lifespan and deadlines are narrative constraints, never a moral ranking of bodies.",
    ),
    options: [
      {
        key: "shared_mortal",
        label: text("共同的有限一生", "One finite lifetime"),
        summary: text("两人都会衰老与受伤，没有超自然再生能力。", "Both age and can be injured, with no supernatural regeneration."),
        detail: text("时间大致对称，但阶层、健康与风险仍可能让他们拥有不同的未来。", "Time is broadly symmetrical, though class, health, and risk may still give them unequal futures."),
        tags: ["mortal", "finite"],
      },
      {
        key: "a_long_b_mortal",
        label: text("她的时间更长", "Her time runs longer"),
        summary: text("她将面对留下，他将面对有限。", "She faces being left behind; he faces finitude."),
        detail: text("不自动规定谁更强，也不替双方决定是否值得相守。", "This does not decide who is stronger or whether staying together is worth the cost."),
        tags: ["lifespan-gap", "roleA-long"],
        riskTags: ["death", "separation"],
      },
      {
        key: "a_mortal_b_long",
        label: text("他的时间更长", "His time runs longer"),
        summary: text("她将面对有限，他将面对留下。", "She faces finitude; he faces being left behind."),
        detail: text("寿命差会给两人不同的问题，而不是只为长生者制造悲情。", "The lifespan gap gives each person a distinct problem instead of existing only to make the long-lived one tragic."),
        tags: ["lifespan-gap", "roleB-long"],
        riskTags: ["death", "separation"],
      },
      {
        key: "borrowed",
        label: text("共同借来的时间", "Shared borrowed time"),
        summary: text("两人的未来都依赖一项会到期、反噬或被收回的条件。", "Both futures depend on a condition that can expire, recoil, or be revoked."),
        detail: text("条件应可被具体追踪，例如契约期限、药物供应、封印或政治庇护。", "Make the condition traceable: a contract term, medicine supply, seal, or political protection."),
        tags: ["deadline", "conditional-life"],
        riskTags: ["death", "dependency"],
      },
    ],
  }),
];

const CHARACTER_OPTIONS: Readonly<Record<CharacterDimension, readonly OptionSeed[]>> = {
  goal: [
    {
      key: "protect",
      label: text("守住具体的人与地方", "Protect people and place"),
      summary: text("目标可以被看见、失去，也会与更大的胜利发生冲突。", "The goal is tangible, losable, and capable of conflicting with a larger victory."),
      detail: text("明确要保护谁、什么地方，以及角色愿意和不愿意支付的代价。", "Name who or what place matters, plus the costs the character will and will not pay."),
      tags: ["care", "home"],
    },
    {
      key: "truth",
      label: text("让真相获得后果", "Give truth consequences"),
      summary: text("不仅要知道真相，还要让隐瞒者与受害者都无法回到原位。", "Knowing is not enough; neither those who hid the truth nor those harmed by it can return unchanged."),
      detail: text("适合调查、作证、公开或迫使共同体重新记忆一段历史。", "Fits investigation, testimony, disclosure, or forcing a community to remember its history differently."),
      tags: ["truth", "accountability"],
    },
    {
      key: "freedom",
      label: text("取得可持续的自由", "Secure durable freedom"),
      summary: text("离开控制只是第一步，目标还包括拥有之后的生活。", "Escaping control is only the first step; the goal includes having a life afterward."),
      detail: text("自由需要资源、关系与自我定义，而不是由另一个保护者接管。", "Freedom requires resources, relationships, and self-definition rather than transfer to another protector."),
      tags: ["freedom", "agency"],
      riskTags: ["control"],
    },
    {
      key: "belonging",
      label: text("建立不以服从为价的归属", "Build belonging without obedience"),
      summary: text("角色需要共同体，但拒绝以消失自我换取接纳。", "The character needs community but refuses acceptance bought by self-erasure."),
      detail: text("归属可以来自亲密关系，也应有关系之外的社会支点。", "Belonging may include intimacy, but should also have social supports beyond the relationship."),
      tags: ["belonging", "community"],
      riskTags: ["dependency", "identity-loss"],
    },
  ],
  stance: [
    {
      key: "uphold",
      label: text("守住秩序", "Uphold the order"),
      summary: text("相信制度仍有值得保护的部分，并愿意为其承担责任。", "Believes parts of the system remain worth protecting and accepts responsibility for them."),
      detail: text("写清楚所守的是人、程序还是价值，避免把服从本身当作美德。", "Specify whether the character protects people, process, or principle; obedience alone is not a virtue."),
      tags: ["order", "duty"],
    },
    {
      key: "reform",
      label: text("从内部改变", "Reform from within"),
      summary: text("仍在体系中行动，却拒绝让忠诚成为沉默。", "Works within the system while refusing to let loyalty require silence."),
      detail: text("改革需要盟友、筹码与妥协边界，不能只靠职位便利。", "Reform needs allies, leverage, and limits on compromise—not merely the convenience of rank."),
      tags: ["reform", "compromise"],
    },
    {
      key: "break",
      label: text("拆除旧秩序", "Break the old order"),
      summary: text("认为现有结构无法修补，但仍须回答废墟之后由谁承受。", "Believes the structure cannot be repaired, yet must answer who bears the aftermath."),
      detail: text("破坏不是免罪牌；角色要面对替代方案、无辜者与权力真空。", "Destruction grants no immunity from consequences; address alternatives, bystanders, and the vacuum left behind."),
      tags: ["rupture", "revolution"],
      riskTags: ["violence"],
    },
    {
      key: "withdraw",
      label: text("拒绝被双方征用", "Refuse both camps"),
      summary: text("不把中立伪装成无代价，而是主动守住不被代表的空间。", "Does not pretend neutrality is costless, but actively protects a space neither side may claim."),
      detail: text("适合对二元阵营都不信任的角色；退出仍会留下责任与后果。", "Fits a character who distrusts both camps; withdrawal still leaves responsibilities and consequences."),
      tags: ["refusal", "independence"],
    },
  ],
  boundary: [
    {
      key: "body",
      label: text("身体与行动归自己", "Bodily and practical autonomy"),
      summary: text("保护、治疗、标记或限制都不能绕过本人的同意。", "Protection, treatment, marking, and restraint cannot bypass the person's consent."),
      detail: text("危险处境可以压缩选择，但不能让强迫在叙事中自动变成爱。", "Danger may narrow choices, but it does not automatically turn coercion into love."),
      tags: ["consent", "autonomy"],
      riskTags: ["body-autonomy", "coercion"],
    },
    {
      key: "truth",
      label: text("亲密不能以欺骗维持", "Intimacy cannot depend on deception"),
      summary: text("可以暂缓披露，但不能剥夺对方据实选择的权利。", "Disclosure may be delayed, but the other person's right to choose with the facts cannot be removed."),
      detail: text("写明什么信息构成知情选择，以及延迟揭露会产生什么补偿义务。", "Define what informed choice requires and what repair delayed disclosure creates."),
      tags: ["truth", "informed-choice"],
    },
    {
      key: "shared_command",
      label: text("共同决定共同风险", "Shared command over shared risk"),
      summary: text("任何人都不能以更强、更懂或更爱为理由替双方做完决定。", "No one may decide for both merely by being stronger, better informed, or more loving."),
      detail: text("紧急决定仍须在事后接受质询、解释与权力归还。", "Emergency decisions remain answerable to later scrutiny, explanation, and restoration of authority."),
      tags: ["negotiation", "shared-power"],
      riskTags: ["power-imbalance"],
    },
    {
      key: "independence",
      label: text("保留关系之外的自我", "Keep a self beyond the bond"),
      summary: text("爱不能要求放弃姓名、事业、友人、记忆或独处的权利。", "Love cannot require surrendering name, work, friends, memory, or the right to solitude."),
      detail: text("亲密可以改变自我，但改变需要可选择、可表达且不由单方定义。", "Intimacy may change the self, but that change must be chosen, expressible, and not defined by one side alone."),
      tags: ["identity", "independence"],
      riskTags: ["identity-loss", "control"],
    },
  ],
  vulnerability: [
    {
      key: "attachment",
      label: text("无法轻易放下的人", "Someone they cannot easily leave"),
      summary: text("牵挂会改变判断，但不等于失去全部伦理能力。", "Attachment changes judgment without erasing all ethical capacity."),
      detail: text("让角色知道自己被牵动，并决定要坦白、补偿还是承担偏袒。", "Let the character recognize the pull and decide whether to disclose, repair, or own the partiality."),
      tags: ["attachment", "care"],
      riskTags: ["dependency"],
    },
    {
      key: "identity",
      label: text("身份与记忆可能动摇", "Identity or memory can be shaken"),
      summary: text("威胁落在自我连续性，而不是把认知困难写成邪恶。", "The threat targets continuity of self without treating cognitive difficulty as moral corruption."),
      detail: text("明确记忆、名字、角色或归属哪一层受损，并保留角色表达经验的空间。", "Specify whether memory, name, role, or belonging is threatened, and preserve room for the character to express the experience."),
      tags: ["identity", "memory"],
      riskTags: ["identity-loss"],
    },
    {
      key: "debt",
      label: text("力量带着追索权", "Power carries a debt"),
      summary: text("能力越被依赖，债权人、身体或世界越接近收账。", "The more the ability is used, the closer its creditor, body, or world comes to collecting."),
      detail: text("债务应有可追踪的触发条件与上限，避免临时添加万能反噬。", "Give the debt traceable triggers and limits instead of inventing a convenient backlash later."),
      tags: ["power", "debt"],
      riskTags: ["body-autonomy"],
    },
    {
      key: "time",
      label: text("可用的时间正在减少", "Usable time is running out"),
      summary: text("期限会迫使取舍，却不能替角色完成取舍。", "A deadline forces tradeoffs but cannot make the choice for the character."),
      detail: text("时间压力可以来自寿命、伤势、追捕、任期或机会窗口。", "The clock may be lifespan, injury, pursuit, a term of office, or a closing opportunity."),
      tags: ["deadline", "finitude"],
      riskTags: ["death"],
    },
  ],
  choice: [
    {
      key: "mission",
      label: text("选择职责或共同体", "Choose duty or community"),
      summary: text("可能不选择爱，但必须亲自承担失去与解释。", "May choose against the bond, but must personally bear the loss and account for it."),
      detail: text("职责必须具体到受益者和后果，不能只是逃避亲密的高尚借口。", "Duty must name beneficiaries and consequences rather than serve as a noble excuse to avoid intimacy."),
      tags: ["duty", "sacrifice"],
      riskTags: ["separation"],
    },
    {
      key: "bond",
      label: text("选择这段关系", "Choose the bond"),
      summary: text("选择对方不自动证明正确，还要面对第三方与长期代价。", "Choosing the other person does not prove the choice right; third parties and long-term costs remain."),
      detail: text("让角色说清选择了什么共同生活，而不是只说愿意为爱放弃一切。", "Have the character name the shared life being chosen, not merely a willingness to give up everything for love."),
      tags: ["bond", "commitment"],
    },
    {
      key: "third_path",
      label: text("创造第三条路", "Make a third path"),
      summary: text("拒绝预设的二选一，但必须付出创造新条件的成本。", "Rejects the given binary while paying the cost of creating new conditions."),
      detail: text("第三条路需要行动、资源与失败可能，不能是最后一刻凭空出现的奖励。", "A third path needs action, resources, and a chance of failure—not a last-minute reward from nowhere."),
      tags: ["agency", "invention"],
    },
    {
      key: "refuse",
      label: text("拒绝替别人完成选择", "Refuse to choose for someone else"),
      summary: text("把被强加的决定归还给真正承担后果的人。", "Returns an imposed decision to the person who will actually bear its consequences."),
      detail: text("拒绝可以是有力行动，也会承担延误、关系破裂或失去控制的后果。", "Refusal can be decisive action while still bearing delay, rupture, or loss of control."),
      tags: ["refusal", "agency"],
    },
  ],
};

const DIMENSION_COPY: Readonly<Record<CharacterDimension, {
  readonly zh: string;
  readonly en: string;
  readonly questionZh: string;
  readonly questionEn: string;
  readonly description: LocalizedText;
}>> = {
  goal: {
    zh: "目标",
    en: "goal",
    questionZh: "真正想让什么在故事结束后仍然存在？",
    questionEn: "What should still exist when the story ends?",
    description: text("目标属于角色本人，不只是对另一人的功能。", "The goal belongs to the character rather than serving only the other person."),
  },
  stance: {
    zh: "立场",
    en: "stance",
    questionZh: "面对现有秩序，会守、改、拆，还是退出？",
    questionEn: "Will they uphold, reform, break, or leave the current order?",
    description: text("立场决定角色如何解释责任，不等于善恶标签。", "Stance shapes how the character understands responsibility; it is not a morality label."),
  },
  boundary: {
    zh: "边界",
    en: "boundary",
    questionZh: "即使相爱，什么也不能被对方擅自决定？",
    questionEn: "Even in love, what may the other person never decide unilaterally?",
    description: text("边界不是降低亲密度，而是让同意和修复可见。", "Boundaries do not reduce intimacy; they make consent and repair visible."),
  },
  vulnerability: {
    zh: "脆弱点",
    en: "vulnerability",
    questionZh: "什么会压缩判断空间，并要求角色付出代价？",
    questionEn: "What narrows their room to judge and demands a cost?",
    description: text("这里描述压力与限制，不把痛苦、创伤或认知差异等同于危险人格。", "This describes pressure and limits without equating pain, trauma, or cognitive difference with dangerous character."),
  },
  choice: {
    zh: "抉择权",
    en: "choice",
    questionZh: "到了无法兼得的时刻，会如何行使自己的决定权？",
    questionEn: "When not everything can be kept, how will they exercise their authority to choose?",
    description: text("每个选项都可能对爱说是、说不或改写问题。", "Every option may say yes, no, or change the question love has posed."),
  },
};

const CHARACTER_AXIS_ORDER: readonly CharacterDimension[] = [
  "goal",
  "stance",
  "boundary",
  "vulnerability",
  "choice",
];

const characterAxis = (role: RoleId, dimension: CharacterDimension, order: number): Axis => {
  const copy = DIMENSION_COPY[dimension];
  const isA = role === "roleA";
  const pronounZh = isA ? "她" : "他";
  const possessiveEn = isA ? "Her" : "His";
  const subjectEn = isA ? "she" : "he";

  return axis({
    id: `${role}.${dimension}` as AxisId,
    chapter: "characters",
    order,
    role,
    dimension,
    label: text(`${pronounZh}的${copy.zh}`, `${possessiveEn} ${copy.en}`),
    shortLabel: text(`${pronounZh}·${copy.zh}`, `${isA ? "Her" : "His"} ${copy.en}`),
    question: text(`${pronounZh}${copy.questionZh}`, `${subjectEn[0]?.toUpperCase()}${subjectEn.slice(1)}: ${copy.questionEn}`),
    description: copy.description,
    options: CHARACTER_OPTIONS[dimension],
  });
};

const CHARACTER_AXES: readonly Axis[] = (["roleA", "roleB"] as const).flatMap((role, roleIndex) =>
  CHARACTER_AXIS_ORDER.map((dimension, dimensionIndex) =>
    characterAxis(role, dimension, 2 + roleIndex * CHARACTER_AXIS_ORDER.length + dimensionIndex),
  ),
);

const RELATIONSHIP_AXES: readonly Axis[] = [
  axis({
    id: "relationship.power",
    chapter: "relationship",
    order: 12,
    role: null,
    dimension: null,
    label: text("权力分布", "Power distribution"),
    shortLabel: text("权力", "Power"),
    question: text("谁能更轻易改变另一人的处境？", "Who can more easily alter the other's circumstances?"),
    description: text("权力指资源与后果控制，不等于情感高低，也不必永远静止。", "Power means control over resources and consequences, not emotional worth, and it need not remain static."),
    options: [
      {
        key: "balanced",
        label: text("大致对等", "Broadly balanced"),
        summary: text("双方拥有不同筹码，但都能拒绝并让拒绝产生现实效果。", "Their leverage differs, but both can refuse and make refusal materially effective."),
        detail: text("对等不是能力相同，而是协商、退出和追责不由单方垄断。", "Balance does not mean identical ability; negotiation, exit, and accountability are not monopolized by one side."),
        tags: ["balance", "mutuality"],
      },
      {
        key: "a_holds",
        label: text("她掌握更多筹码", "She holds more leverage"),
        summary: text("她更能决定资源、身份或安全，因此也承担更高的克制义务。", "She can more readily determine resources, status, or safety and therefore bears a greater duty of restraint."),
        detail: text("不把她的强大自动写成正当；要保留他拒绝、谈判与离开的路径。", "Her strength is not automatic legitimacy; preserve his routes to refuse, negotiate, and leave."),
        tags: ["asymmetry", "roleA-power"],
        riskTags: ["power-imbalance", "control"],
      },
      {
        key: "b_holds",
        label: text("他掌握更多筹码", "He holds more leverage"),
        summary: text("他更能决定资源、身份或安全，因此也承担更高的克制义务。", "He can more readily determine resources, status, or safety and therefore bears a greater duty of restraint."),
        detail: text("不把他的保护自动写成同意；要保留她拒绝、谈判与离开的路径。", "His protection is not automatic consent; preserve her routes to refuse, negotiate, and leave."),
        tags: ["asymmetry", "roleB-power"],
        riskTags: ["power-imbalance", "control"],
      },
      {
        key: "contested",
        label: text("权力持续易手", "Power keeps changing hands"),
        summary: text("情报、地位、力量与公众信任在事件中不断重新分配。", "Information, rank, force, and public trust are repeatedly redistributed by events."),
        detail: text("每次易手都应改变可做之事，而不只是制造表面的攻守反转。", "Each shift should alter what can actually be done rather than merely reversing surface dominance."),
        tags: ["shifting-power", "uncertainty"],
        riskTags: ["power-imbalance"],
      },
    ],
  }),
  axis({
    id: "relationship.bond",
    chapter: "relationship",
    order: 13,
    role: null,
    dimension: null,
    label: text("关系机制", "Bond mechanism"),
    shortLabel: text("关系", "Bond"),
    question: text("两个人靠什么维持接近？", "What keeps the two people close?"),
    description: text("关系机制描述可观察的协作方式，不用占有替代亲密。", "The bond describes observable cooperation rather than substituting possession for intimacy."),
    options: [
      {
        key: "negotiated",
        label: text("反复协商的同盟", "Negotiated alliance"),
        summary: text("他们靠更新承诺、分配风险与允许反对维持合作。", "They cooperate by renewing commitments, allocating risk, and permitting dissent."),
        detail: text("协商并不冷淡；它让改变主意、表达不满与修复背叛都可发生。", "Negotiation is not coldness; it makes changed minds, dissent, and repair after betrayal possible."),
        tags: ["negotiation", "alliance"],
      },
      {
        key: "protective_dependency",
        label: text("互相保护，也互相依赖", "Protective interdependence"),
        summary: text("双方在不同领域需要对方，风险是保护逐渐替代选择。", "Each needs the other in different domains; the risk is protection replacing choice."),
        detail: text("写出双方各自能做的事，以及依赖失衡时如何重新分配能力。", "Show what each person can do and how ability is redistributed when dependence becomes unequal."),
        tags: ["care", "interdependence"],
        riskTags: ["dependency"],
      },
      {
        key: "possession",
        label: text("以占有确认关系", "Possession as proof"),
        summary: text("一方或双方试图用标记、监控或排他控制消除不确定。", "One or both try to eliminate uncertainty through marking, surveillance, or exclusive control."),
        detail: text("这是高风险冲突机制，不是默认的爱情表达；故事必须呈现同意、反抗与后果。", "This is a high-risk conflict mechanism, not a default love language; the story must show consent, resistance, and consequences."),
        tags: ["possession", "conflict-mechanism"],
        riskTags: ["coercion", "control", "body-autonomy"],
      },
      {
        key: "mutual_change",
        label: text("共同改变生活结构", "Mutual structural change"),
        summary: text("亲密通过改变工作、阵营、居所或责任分配得到证明。", "Intimacy is proven by changing work, allegiance, home, or the allocation of responsibility."),
        detail: text("双方都要付出可见行动，并保留对改变方式提出异议的能力。", "Both contribute visible action and retain the ability to object to how change happens."),
        tags: ["change", "commitment"],
      },
    ],
  }),
];

const FATE_AXES: readonly Axis[] = [
  axis({
    id: "fate.cost",
    chapter: "fate",
    order: 14,
    role: null,
    dimension: null,
    label: text("不可抹去的代价", "Irreducible cost"),
    shortLabel: text("代价", "Cost"),
    question: text("即使他们得到想要的，也有什么不能恢复？", "Even if they get what they want, what cannot be restored?"),
    description: text("代价应改变之后的生活，而不是结局前的一次性疼痛。", "A cost changes life afterward instead of supplying one burst of pain before the ending."),
    options: [
      {
        key: "status",
        label: text("失去身份与位置", "Loss of status and place"),
        summary: text("名字、职位、继承权或共同体承认无法原样恢复。", "Name, office, inheritance, or communal recognition cannot be restored as before."),
        detail: text("结局要回答他们靠什么生活，以及旧关系如何看待这次坠落。", "The ending must answer how they live and how old relationships interpret the fall."),
        tags: ["status", "exile"],
        riskTags: ["separation"],
      },
      {
        key: "power",
        label: text("失去力量或能力", "Loss of power or ability"),
        summary: text("曾经解决问题的能力不再可靠，生活必须重新分工。", "The ability that once solved problems is no longer reliable, forcing a new division of life."),
        detail: text("避免把能力丧失等同于人格价值下降；真正变化的是资源与行动方式。", "Do not equate lost ability with reduced human worth; what changes is access and method of action."),
        tags: ["ability", "adaptation"],
        riskTags: ["body-autonomy"],
      },
      {
        key: "time",
        label: text("未来被缩短", "A shortened future"),
        summary: text("寿命、机会窗口或共同生活的时间已被永久削减。", "Lifespan, opportunity, or shared time has been permanently reduced."),
        detail: text("不要只写倒计时的悲情；让时间减少改变优先级与日常安排。", "Do more than mourn a countdown; let less time change priorities and daily arrangements."),
        tags: ["time", "finitude"],
        riskTags: ["death", "separation"],
      },
      {
        key: "memory",
        label: text("记忆或身份出现断层", "A break in memory or identity"),
        summary: text("某段共同经验无法被完整取回，关系必须接受不对称的记得。", "Part of their shared experience cannot be fully recovered; the bond must live with asymmetrical memory."),
        detail: text("保留受影响者的当下人格与决定权，不把遗忘写成一具等待认领的空壳。", "Preserve the affected person's present identity and authority; forgetting does not make them an empty vessel to reclaim."),
        tags: ["memory", "identity"],
        riskTags: ["identity-loss"],
      },
      {
        key: "separation",
        label: text("不可逆的离散", "Irreversible separation"),
        summary: text("死亡、流放、不同时间线或主动离开使共同生活不再可能。", "Death, exile, divergent timelines, or a chosen departure makes shared life impossible."),
        detail: text("离散不是自动的爱情认证；要写清是谁选择、谁承受，以及是否还有其他价值被保住。", "Separation does not automatically prove love; name who chose, who bears it, and what else was preserved."),
        tags: ["separation", "irreversible"],
        riskTags: ["death", "separation"],
      },
    ],
  }),
  axis({
    id: "fate.ending",
    chapter: "fate",
    order: 15,
    role: null,
    dimension: null,
    label: text("终局形态", "Ending form"),
    shortLabel: text("终局", "Ending"),
    question: text("代价落下后，他们如何继续或结束？", "After the cost lands, how do they continue or end?"),
    description: text("终局描述关系与生活的新结构，不以是否在一起单独判定好坏。", "The ending describes a new structure of relationship and life; being together alone does not decide its value."),
    options: [
      {
        key: "shared_life",
        label: text("有边界的共同生活", "A bounded shared life"),
        summary: text("他们继续在一起，同时保留各自目标、关系与退出协商的能力。", "They remain together while retaining separate goals, relationships, and the power to renegotiate or leave."),
        detail: text("所谓日常不是奖励画面，而是新分工如何经受旧问题的检验。", "Everyday life is not a reward tableau; show how the new arrangement survives old problems."),
        tags: ["together", "daily-life"],
      },
      {
        key: "transformed",
        label: text("重写后的伙伴关系", "A transformed partnership"),
        summary: text("他们仍彼此承诺，但关系名称、职责或亲密方式已经改变。", "They remain committed, but the bond's name, duties, or form of intimacy has changed."),
        detail: text("可以从恋人变盟友、从主从变共同治理，或承认关系不能恢复原状。", "They may become allies, move from hierarchy to co-governance, or admit the bond cannot return to its former form."),
        tags: ["transformation", "partnership"],
      },
      {
        key: "parting",
        label: text("经过选择的告别", "A chosen parting"),
        summary: text("分开不是惩罚，而是至少一方用清醒决定保住更重要之物。", "Parting is not punishment; at least one person consciously preserves something more important."),
        detail: text("让双方对告别拥有不同但有效的理解，不强迫留下者替离开者认证高尚。", "Allow both to understand the parting differently without making the one left behind certify the other's nobility."),
        tags: ["parting", "agency"],
        riskTags: ["separation"],
      },
      {
        key: "unresolved",
        label: text("带着未决问题共存", "Coexist with unresolved questions"),
        summary: text("冲突暂未解决，但新的边界让伤害不再按旧方式重复。", "The conflict remains unresolved, but new boundaries stop harm from repeating in the old form."),
        detail: text("开放结局也需要已经发生的改变，不能只在高潮前切断叙事。", "An open ending still needs completed change; it cannot simply cut away before the climax."),
        tags: ["open-ending", "coexistence"],
      },
      {
        key: "sacrifice",
        label: text("一人的终局性牺牲", "One person's final sacrifice"),
        summary: text("死亡或不可回返的选择完成目标，但不能替幸存者决定如何理解它。", "Death or an irreversible act completes the goal without deciding how the survivor must interpret it."),
        detail: text("牺牲应来自角色一贯的价值和知情选择，不是证明爱意的快捷方式。", "Sacrifice should arise from established values and informed choice, not serve as a shortcut to proving love."),
        tags: ["sacrifice", "finality"],
        riskTags: ["death", "separation"],
      },
      {
        key: "rewrite_cycle",
        label: text("改写时间或循环", "Rewrite the cycle"),
        summary: text("他们改变重复发生的规则，同时失去原本时间线的一部分。", "They change the rule of recurrence while losing part of the original timeline."),
        detail: text("改写必须有机制、代价和残留记忆，不能无条件撤销此前所有选择。", "A rewrite needs mechanism, cost, and residual memory; it cannot erase every prior choice for free."),
        tags: ["time", "cycle"],
        riskTags: ["identity-loss"],
      },
    ],
  }),
];

const PALETTE_AXIS: Axis = axis({
  id: "prose.palette",
  chapter: "palette",
  order: 16,
  role: null,
  dimension: null,
  label: text("叙述质感", "Narrative palette"),
  shortLabel: text("质感", "Palette"),
  question: text("用怎样的距离、节奏与温度观察这一切？", "At what distance, rhythm, and temperature should the story observe all this?"),
  description: text("质感不是题材标签；生成时必须落实到句法、意象密度与叙述距离。", "A palette is not a genre label; generation must realize it through syntax, image density, and narrative distance."),
  options: [
    {
      key: "restrained",
      label: text("冷静克制", "Cool restraint"),
      summary: text("少解释情绪，让动作、停顿与遗漏承担余味。", "Explain little emotion; let action, pauses, and omission carry the aftertaste."),
      detail: text("句式清楚，修辞节制，关键处允许沉默而不把沉默解释成温柔。", "Use clear syntax and sparse figures; allow silence at key moments without automatically calling it tenderness."),
      tags: ["restrained", "subtext"],
    },
    {
      key: "lyrical",
      label: text("缓慢抒情", "Slow lyricism"),
      summary: text("长句允许感官与回忆互相牵引，但不替人物总结人生。", "Long sentences let sensation and memory pull on each other without summarizing a life for the characters."),
      detail: text("意象来自现场物质，抒情必须被行动或代价压住。", "Images arise from physical circumstance, and lyricism remains answerable to action and cost."),
      tags: ["lyrical", "sensory"],
    },
    {
      key: "rough",
      label: text("粗砺纪实", "Rough realism"),
      summary: text("身体、劳动、天气与资源先于漂亮判断进入句子。", "Bodies, labor, weather, and resources enter the sentence before elegant judgment."),
      detail: text("词语具体，动作有重量；温情若出现，也从照料的成本中长出。", "Use concrete words and weighted action; tenderness, if present, grows from the cost of care."),
      tags: ["material", "concrete"],
    },
    {
      key: "ceremonial",
      label: text("庄严史诗", "Ceremonial grandeur"),
      summary: text("公共语言、誓约与反复意象让私人决定获得历史重量。", "Public language, vows, and recurring images give private decisions historical weight."),
      detail: text("宏大来自责任尺度，不靠堆叠抽象词；个人损失始终可见。", "Grandeur comes from the scale of responsibility, not piles of abstraction; personal loss remains visible."),
      tags: ["epic", "oath"],
    },
    {
      key: "uncanny",
      label: text("清醒异质", "Lucid uncanny"),
      summary: text("世界规则略微偏转，但动作与空间关系始终可以追踪。", "The world's rules tilt slightly while action and spatial relations remain traceable."),
      detail: text("陌生感来自因果或知觉的精确错位，不用含混代替神秘。", "Uncanniness comes from precise dislocation of cause or perception, never vagueness standing in for mystery."),
      tags: ["uncanny", "precise"],
    },
  ],
});

export const AXES: readonly Axis[] = [
  ...CONTEXT_AXES,
  ...CHARACTER_AXES,
  ...RELATIONSHIP_AXES,
  ...FATE_AXES,
  PALETTE_AXIS,
];

const AXIS_BY_ID = new Map<AxisId, Axis>(AXES.map((item) => [item.id, item]));
const OPTION_BY_ID = new Map<string, AxisOption>(
  AXES.flatMap((item) => item.options).map((item) => [item.id, item]),
);

export const NARRATIVE_AXIS_IDS: readonly AxisId[] = AXES
  .filter((item) => item.chapter !== "palette")
  .map((item) => item.id);

export const NARRATIVE_OPTION_IDS: readonly string[] = AXES
  .filter((item) => item.chapter !== "palette")
  .flatMap((item) => item.options.map((itemOption) => itemOption.id));

export const getAxis = (id: AxisId): Axis | undefined => AXIS_BY_ID.get(id);

export const getOption = (id: string): AxisOption | undefined => OPTION_BY_ID.get(id);

export const getChapter = (id: Chapter["id"]): Chapter | undefined =>
  CHAPTERS.find((chapter) => chapter.id === id);

export const getOptionsForAxis = (id: AxisId): readonly AxisOption[] =>
  getAxis(id)?.options ?? [];

export const isValidSelection = (axisId: AxisId, optionId: string): boolean =>
  getOption(optionId)?.axisId === axisId;
