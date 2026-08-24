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
    eyebrow: text("01 · 事情为什么偏在此刻发生", "01 · Why now"),
    description: text(
      "先摆出两个人共同躲不开的事，再看时间还给他们多少余地。",
      "Put down what neither person can avoid, then see how much time leaves them room to move.",
    ),
  },
  {
    id: "characters",
    order: 1,
    label: text("双角色", "Two characters"),
    eyebrow: text("02 · 她有她的路，他有他的", "02 · Her path, and his"),
    description: text(
      "两边各有自己的目标和底线，也可以做出不同选择。",
      "Each person has their own aims and limits, and they may choose differently.",
    ),
  },
  {
    id: "relationship",
    order: 2,
    label: text("关系", "Relationship"),
    eyebrow: text("03 · 靠近以后，谁能动谁的生活", "03 · What closeness lets them change"),
    description: text(
      "看他们怎样靠近，也看谁更有本事改变对方的日子。",
      "Look at how they stay close, and who has more power to change the other's life.",
    ),
  },
  {
    id: "fate",
    order: 3,
    label: text("命运", "Fate"),
    eyebrow: text("04 · 事情做成了，还剩什么", "04 · What remains afterward"),
    description: text(
      "到了结尾，先前的选择总要留下一点不能撤回的东西。",
      "By the ending, earlier choices should have left something that cannot be taken back.",
    ),
  },
  {
    id: "palette",
    order: 4,
    label: text("文字质感", "Prose palette"),
    eyebrow: text("05 · 最后才谈怎么写", "05 · Only then, how to tell it"),
    description: text(
      "先把结构放稳，再选叙述贴多近、句子走多快。",
      "Settle the structure first, then choose the distance and pace of the prose.",
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
      "选眼下最能逼动故事的那一项。世界当然可以比这更复杂。",
      "Choose what puts the most pressure on the story now; the world can still be more complicated than one option.",
    ),
    options: [
      {
        key: "siege",
        label: text("生存围困", "Survival siege"),
        summary: text("粮、钱、路或援手正在见底；等下去也会改变局面。", "Food, money, exits, or help are running out; waiting changes the situation too."),
        detail: text("不动也在失去东西：有人还能调动资源，有人已经没有退路。", "Inaction loses things too: one person can still move resources, while another has already run out of exits."),
        tags: ["survival", "scarcity"],
        riskTags: ["violence", "death"],
      },
      {
        key: "institution",
        label: text("制度绞索", "Institutional bind"),
        summary: text("规矩把私事拖到众人面前，身份与誓约都会来讨账。", "Rules drag private choices into public view, where status and oaths collect their due."),
        detail: text("一道批文，一句家训，都得有人执行，也得有人追究。", "An official order or a family rule needs someone to enforce it and someone to pursue the breach."),
        tags: ["institution", "duty"],
        riskTags: ["control", "power-imbalance"],
      },
      {
        key: "exposure",
        label: text("秘密将破", "Imminent exposure"),
        summary: text("证据、知情人或期限已经逼近，秘密藏不了多久。", "Evidence, a witness, or a deadline is closing in; the secret cannot stay buried much longer."),
        detail: text("真相落地以后，总有人换了位置，原来的关系也回不去。揭晓只是起头。", "Once the truth lands, someone changes position and the old relationship cannot simply resume. The reveal is only the beginning."),
        tags: ["secret", "truth"],
      },
      {
        key: "crossing",
        label: text("不可回头的旅程", "Point-of-no-return journey"),
        summary: text("他们每往前一步，旧生活就少一条回去的路。", "With every step forward, one road back to the old life disappears."),
        detail: text("路标已经落在身后，旧身份也不再好用；门是真的关了。", "The marker has fallen behind them, and the old identity no longer works; the door has truly closed."),
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
      "寿命、期限和供给，决定行动还能走多远。",
      "Lifespan, deadlines, and supply decide how much room remains to act.",
    ),
    options: [
      {
        key: "shared_mortal",
        label: text("共同的有限一生", "One finite lifetime"),
        summary: text("两人都会衰老与受伤，没有超自然再生能力。", "Both age and can be injured, with no supernatural regeneration."),
        detail: text("时间看起来对称，阶层、伤病和风险仍可能把未来分开。", "Their clocks look similar, while class, health, and risk may still split their futures."),
        tags: ["mortal", "finite"],
      },
      {
        key: "a_long_b_mortal",
        label: text("她的时间更长", "Her time runs longer"),
        summary: text("她要面对留下，他要在有限的时间里决定。", "She faces being left behind; he must choose within finite time."),
        detail: text("她会活过他的年月；他仍有自己的恐惧，也有自己的决定。", "She will outlive his years; his fears and his choices still belong to him."),
        tags: ["lifespan-gap", "roleA-long"],
        riskTags: ["death", "separation"],
      },
      {
        key: "a_mortal_b_long",
        label: text("他的时间更长", "His time runs longer"),
        summary: text("她要在有限的时间里决定，他要面对留下。", "She must choose within finite time; he faces being left behind."),
        detail: text("他会活过她的年月；她的有限时间仍由她自己支配。", "He will outlive her years; her finite time remains hers to direct."),
        tags: ["lifespan-gap", "roleB-long"],
        riskTags: ["death", "separation"],
      },
      {
        key: "borrowed",
        label: text("共同借来的时间", "Shared borrowed time"),
        summary: text("他们的未来押在一个会到期、反噬或被收回的条件上。", "Their future rests on a condition that may expire, recoil, or be revoked."),
        detail: text("借来的时间总有可查的尽头：契约到期，或药瓶见底。", "Borrowed time has a checkable end: a contract expires, or a medicine bottle runs dry."),
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
      summary: text("要守的东西有名字，也可能和更大的胜利撞在一起。", "What must be protected has a name and may collide with a larger victory."),
      detail: text("要守的地方有名字，要守的人也有；其中总有一样不能拿去交换。", "The place being guarded has a name, and so does the person; at least one of them cannot be traded away."),
      tags: ["care", "home"],
    },
    {
      key: "truth",
      label: text("让真相落到现实里", "Make truth alter reality"),
      summary: text("知道还不够；有人得失去位置，有人得重新做决定。", "Knowing is not enough; someone loses a position, and someone must choose again."),
      detail: text("调查与作证只是开头；最后得有人把旧事重新讲一遍。", "Investigation and testimony are only the beginning; in the end, someone has to tell the old story again."),
      tags: ["truth", "accountability"],
    },
    {
      key: "freedom",
      label: text("得到离开之后的自由", "Build a life after escape"),
      summary: text("逃出去只是开头，之后还要有钱、有住处，也有自己的名字。", "Escape is only the beginning; afterward come money, a place to live, and a name of one's own."),
      detail: text("如果只是从一个保护者手里转到另一个人手里，这条线还没走完。", "If control merely passes from one protector to another, this path is not finished."),
      tags: ["freedom", "agency"],
      riskTags: ["control"],
    },
    {
      key: "belonging",
      label: text("找到不以服从换来的归处", "Find belonging without obedience"),
      summary: text("想被接纳，又不肯把自己交出去。", "The character wants a place to belong without handing over the self."),
      detail: text("亲密是一处落脚地，门外还该有别的去处。", "Intimacy is one place to land; other doors should remain beyond it."),
      tags: ["belonging", "community"],
      riskTags: ["dependency", "identity-loss"],
    },
  ],
  stance: [
    {
      key: "uphold",
      label: text("守住秩序", "Uphold the order"),
      summary: text("仍相信旧秩序里有该保的人、程序或价值。", "The old order still contains people, procedures, or values worth protecting."),
      detail: text("守的是人和程序；只剩服从时，秩序已经空了。", "What survives should be people and procedures; an order reduced to obedience is already hollow."),
      tags: ["order", "duty"],
    },
    {
      key: "reform",
      label: text("从内部改变", "Reform from within"),
      summary: text("留在体系里办事，也准备让忠诚惹出麻烦。", "The character stays inside the system and lets loyalty become troublesome."),
      detail: text("盟友、筹码和不能退的那一步，决定改革能走多远。", "Allies, leverage, and the point that cannot be yielded decide how far reform can go."),
      tags: ["reform", "compromise"],
    },
    {
      key: "break",
      label: text("拆除旧秩序", "Break the old order"),
      summary: text("认定旧秩序无从修补，准备承担拆掉它之后的空缺。", "The old order cannot be repaired, and its absence will have to be carried."),
      detail: text("旧秩序一倒，最先遭殃的未必是掌权者；空出来的位置也不会一直空着。", "When the old order falls, those harmed first may not be those who held power; the vacant seat will not stay vacant."),
      tags: ["rupture", "revolution"],
      riskTags: ["violence"],
    },
    {
      key: "withdraw",
      label: text("拒绝被双方征用", "Refuse both camps"),
      summary: text("两边都不信，也不肯让任何一边替自己说话。", "The character trusts neither camp and lets neither speak in their name."),
      detail: text("退出以后，有人被留下，也有东西跟着丢了。后果并不退出。", "After the withdrawal, someone is left behind and something is lost. Consequences do not withdraw."),
      tags: ["refusal", "independence"],
    },
  ],
  boundary: [
    {
      key: "body",
      label: text("身体与行动归自己", "Bodily and practical autonomy"),
      summary: text("治疗、保护、留下印记或限制行动，都要经过本人。", "Treatment, protection, marking, and restraint all have to pass through the person concerned."),
      detail: text("危险可以逼人仓促决定；越权仍是越权，之后也有账可算。", "Danger may force a rushed decision; an overreach remains an overreach and must be dealt with afterward."),
      tags: ["consent", "autonomy"],
      riskTags: ["body-autonomy", "coercion"],
    },
    {
      key: "truth",
      label: text("亲密不能以欺骗维持", "Intimacy cannot depend on deception"),
      summary: text("可以晚说，不能让对方永远拿不到决定所需的事实。", "The truth may come late, but not so late that the other person never gets to choose with it."),
      detail: text("列出必须告知的那件事，再想迟说以后要补什么。", "Name the fact that must be told, then decide what repair the delay requires."),
      tags: ["truth", "informed-choice"],
    },
    {
      key: "shared_command",
      label: text("共同决定共同风险", "Shared command over shared risk"),
      summary: text("风险落在两个人身上，就不能由一个人把决定做完。", "When both bear the risk, one person cannot finish the decision for both."),
      detail: text("紧急时可以先动手；事后仍要回答，也要把决定权交回来。", "Someone may act first in an emergency, but must answer for it and return the authority afterward."),
      tags: ["negotiation", "shared-power"],
      riskTags: ["power-imbalance"],
    },
    {
      key: "independence",
      label: text("保留关系之外的自我", "Keep a self beyond the bond"),
      summary: text("名字、记忆和自己的生活，不因相爱便归对方所有。", "A name, a memory, and a life of one's own do not become the other person's property through love."),
      detail: text("亲密可以改人；由谁提出、能不能拒绝，要留在场上。", "Intimacy may change a person. Keep visible who asks for the change and whether it may be refused."),
      tags: ["identity", "independence"],
      riskTags: ["identity-loss", "control"],
    },
  ],
  vulnerability: [
    {
      key: "attachment",
      label: text("无法轻易放下的人", "Someone they cannot easily leave"),
      summary: text("一想到这个人，原来稳妥的判断就会偏。", "Thinking of this person bends what once looked like a sound judgment."),
      detail: text("偏心一旦藏不住，补偿和承认都会改变关系。", "Once the partiality shows, both amends and admission change the bond."),
      tags: ["attachment", "care"],
      riskTags: ["dependency"],
    },
    {
      key: "identity",
      label: text("身份与记忆可能动摇", "Identity or memory can be shaken"),
      summary: text("名字、记忆或归属一旦松动，角色就难以确认自己从哪里接着活。", "When name, memory, or belonging loosens, the character may not know where the self continues from."),
      detail: text("角色可能认不出旧地；眼下喜欢什么、要不要留下，仍由这个人决定。", "The character may no longer recognize old places; what they like now and whether they stay are still theirs to decide."),
      tags: ["identity", "memory"],
      riskTags: ["identity-loss"],
    },
    {
      key: "debt",
      label: text("力量带着追索权", "Power carries a debt"),
      summary: text("力量每用一次，债主、身体或世界就再近一步。", "Each use of power brings its creditor, the body, or the world one step closer."),
      detail: text("力量有触发条件，也有使用上限；债不会等到结尾才来收。", "The power has a trigger and a limit on its use; the debt does not wait until the ending to collect."),
      tags: ["power", "debt"],
      riskTags: ["body-autonomy"],
    },
    {
      key: "time",
      label: text("可用的时间正在减少", "Usable time is running out"),
      summary: text("可用的日子一天天少，取舍会提前到来。", "Usable days are dwindling, so the choice arrives early."),
      detail: text("它可能是一段寿命，也可能只是一扇快关上的门。", "It may be a lifespan, or simply a door about to close."),
      tags: ["deadline", "finitude"],
      riskTags: ["death"],
    },
  ],
  choice: [
    {
      key: "mission",
      label: text("认下自己的责任", "Claim a duty of one's own"),
      summary: text("可能舍下关系，去守一件只有自己能认下的事。", "The character may leave the bond to keep a duty only they can claim."),
      detail: text("受益的人和受伤的人都要有名字；“责任”两个字本身还不够。", "The people helped and hurt should have names; the word duty is not enough by itself."),
      tags: ["duty", "sacrifice"],
      riskTags: ["separation"],
    },
    {
      key: "bond",
      label: text("选择这段关系", "Choose the bond"),
      summary: text("选了对方以后，第三方、旧职责和长远生活仍会找上门。", "After choosing the other person, third parties, old duties, and the long future still arrive."),
      detail: text("这份选择要落到一整套日子里，远远长过一句“愿意放弃一切”。", "This choice has to enter a whole way of living, far longer than a promise to give up everything."),
      tags: ["bond", "commitment"],
    },
    {
      key: "third_path",
      label: text("创造第三条路", "Make a third path"),
      summary: text("不接现成的二选一，转而造出新的条件。", "Reject the given binary and build a new set of conditions."),
      detail: text("这条路要花钱、花时间，也应当有失败的可能。", "This path costs money and time, and it should be able to fail."),
      tags: ["agency", "invention"],
    },
    {
      key: "refuse",
      label: text("拒绝替别人完成选择", "Refuse to choose for someone else"),
      summary: text("不替那个真正承担后果的人点头或摇头。", "Do not say yes or no for the person who will bear the consequence."),
      detail: text("拒绝也会拖延、伤关系、让局面脱手；这些照样要算。", "Refusal may delay, damage the bond, or let the situation slip. Those costs still count."),
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
    questionZh: "真正想保到故事结束的是什么？",
    questionEn: "What should still exist when the story ends?",
    description: text("这个角色自己要什么，暂时与关系分开来看。", "Consider what this character wants on its own, apart from the bond for now."),
  },
  stance: {
    zh: "立场",
    en: "stance",
    questionZh: "面对现有秩序，会守、改、拆，还是退出？",
    questionEn: "Will they uphold, reform, break, or leave the current order?",
    description: text("同一件责任，在不同立场里会有不同答案。", "The same duty produces different answers from different positions."),
  },
  boundary: {
    zh: "边界",
    en: "boundary",
    questionZh: "即使相爱，哪件事也得由自己决定？",
    questionEn: "Even in love, what may the other person never decide unilaterally?",
    description: text("写下对方无权代办的那件事。", "Name the decision the other person cannot make on their behalf."),
  },
  vulnerability: {
    zh: "脆弱点",
    en: "vulnerability",
    questionZh: "什么一逼近，判断就会开始失准？",
    questionEn: "What narrows their room to judge and demands a cost?",
    description: text("这里记下让判断变窄的压力，以及它怎样逼近。", "Record the pressure that narrows judgment and how it closes in."),
  },
  choice: {
    zh: "抉择权",
    en: "choice",
    questionZh: "不能兼得时，会亲手放下哪一边？",
    questionEn: "When not everything can be kept, how will they exercise their authority to choose?",
    description: text("到了这里，让角色自己失去一样。", "At this point, let the character be the one who gives something up."),
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
    description: text("这里的权力看两件事：谁能改变生活，谁的拒绝能落地。", "Power here comes down to two things: who can change a life, and whose refusal has force."),
    options: [
      {
        key: "balanced",
        label: text("大致对等", "Broadly balanced"),
        summary: text("筹码不一样，但两边说“不”都真的会改变下一步。", "Their leverage differs, but either person's no can change what happens next."),
        detail: text("两边都有能走的门，也都能追责、重谈。", "Both have a door they can use, and both can demand answers or renegotiate."),
        tags: ["balance", "mutuality"],
      },
      {
        key: "a_holds",
        label: text("她掌握更多筹码", "She holds more leverage"),
        summary: text("资源、身份或安全更听她的；他的拒绝因而更难落地。", "Resources, status, or safety answer more readily to her, making his refusal harder to enforce."),
        detail: text("他的筹码也许只够换来一点时间，退路也可能已经封死。她怎样用手里的优势，会决定下一步。", "His leverage may buy only a little time, and his way out may already be closed. How she uses her advantage decides what happens next."),
        tags: ["asymmetry", "roleA-power"],
        riskTags: ["power-imbalance", "control"],
      },
      {
        key: "b_holds",
        label: text("他掌握更多筹码", "He holds more leverage"),
        summary: text("资源、身份或安全更听他的；她的拒绝因而更难落地。", "Resources, status, or safety answer more readily to him, making her refusal harder to enforce."),
        detail: text("她的拒绝若改变不了现实，这份失衡就已经落到生活里。他怎样用手里的优势，会留下后果。", "If her refusal cannot change reality, the imbalance has already entered daily life. How he uses his advantage leaves consequences behind."),
        tags: ["asymmetry", "roleB-power"],
        riskTags: ["power-imbalance", "control"],
      },
      {
        key: "contested",
        label: text("权力持续易手", "Power keeps changing hands"),
        summary: text("情报和地位会在事件里换手，众人的心也跟着偏转。", "Information and status change hands as events move, and public trust turns with them."),
        detail: text("每次换手都会改掉下一步：门能不能开，命令还听不听。", "Each shift changes the next move: whether a door opens, whether an order still carries."),
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
    label: text("相处方式", "How they relate"),
    shortLabel: text("关系", "Bond"),
    question: text("两个人靠什么维持接近？", "What keeps the two people close?"),
    description: text("选他们实际怎样相处：怎样分风险、怎样反对、怎样改主意。", "Choose how they actually live together: how risk is shared, dissent works, and minds change."),
    options: [
      {
        key: "negotiated",
        label: text("反复协商的同盟", "Negotiated alliance"),
        summary: text("承诺会重谈，风险会重分，反对不会自动结束合作。", "Promises are renegotiated, risks redistributed, and dissent does not automatically end the alliance."),
        detail: text("这也包括翻旧账、改主意，以及背叛之后还有没有修复的工夫。", "This includes old grievances, changed minds, and whether repair remains possible after betrayal."),
        tags: ["negotiation", "alliance"],
      },
      {
        key: "protective_dependency",
        label: text("互相保护，也互相依赖", "Protective interdependence"),
        summary: text("两人各有一处离不开对方，保护也可能慢慢变成代替选择。", "Each person depends on the other somewhere, and protection may slowly replace choice."),
        detail: text("两个人各有能做的事；失衡从一方替另一方做主开始。", "Each person can still do something; imbalance begins when one starts deciding for the other."),
        tags: ["care", "interdependence"],
        riskTags: ["dependency"],
      },
      {
        key: "possession",
        label: text("以占有确认关系", "Possession as proof"),
        summary: text("有人想用标记、监控或排他，把不确定压下去。", "Someone tries to crush uncertainty through marking, surveillance, or exclusivity."),
        detail: text("把它当冲突写：谁同意，谁反抗，控制又造成了什么后果。", "Write it as conflict: who agrees, who resists, and what the control does."),
        tags: ["possession", "conflict-mechanism"],
        riskTags: ["coercion", "control", "body-autonomy"],
      },
      {
        key: "mutual_change",
        label: text("共同改变生活结构", "Mutual structural change"),
        summary: text("因为这段关系，工作与住处已经变了，责任也重新分过。", "Because of this bond, work and home have changed, and responsibilities have been divided again."),
        detail: text("两边都要动，也都能对改变的方式提出异议。", "Both people have to move, and both may object to how the change happens."),
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
    description: text("这份代价会留到结尾以后，改掉往后的生活。", "This cost lasts beyond the ending and changes the life that follows."),
    options: [
      {
        key: "status",
        label: text("失去身份与位置", "Loss of status and place"),
        summary: text("旧名字或旧职位已经失效，曾经接纳他们的人也改了口。", "The old name or office no longer holds, and the people who once welcomed them speak differently now."),
        detail: text("谋生的办法换了，旧相识连称呼都要迟疑。", "Their way of making a living has changed; old acquaintances now hesitate over what to call them."),
        tags: ["status", "exile"],
        riskTags: ["separation"],
      },
      {
        key: "power",
        label: text("失去力量或能力", "Loss of power or ability"),
        summary: text("过去最管用的本事失灵了，生活也得重新分工。", "The ability that used to solve things has failed, so daily life must be divided again."),
        detail: text("原来由这个人做的事，现在要有人接手；新的分工会进入每一天。", "Someone now has to take over what this person used to do; the new division of work enters every day."),
        tags: ["ability", "adaptation"],
        riskTags: ["body-autonomy"],
      },
      {
        key: "time",
        label: text("未来被缩短", "A shortened future"),
        summary: text("寿命、机会或能一起生活的日子，永久少了一截。", "Lifespan, opportunity, or days together have been permanently cut short."),
        detail: text("少掉的时间先落在日常上：行李提前收好，明年的约定改到这个月。", "The lost time lands on daily life first: bags are packed early, and next year's promise moves into this month."),
        tags: ["time", "finitude"],
        riskTags: ["death", "separation"],
      },
      {
        key: "memory",
        label: text("记忆或身份出现断层", "A break in memory or identity"),
        summary: text("一段共同经历回不来了，两个人记得的关系从此不一样。", "A shared experience cannot be recovered, so the relationship now exists differently in each memory."),
        detail: text("受影响的人仍有现在的自我和决定权；别让旁人代为认领。", "The affected person still has a present self and present choices; others cannot claim them on memory's behalf."),
        tags: ["memory", "identity"],
        riskTags: ["identity-loss"],
      },
      {
        key: "separation",
        label: text("不可逆的离散", "Irreversible separation"),
        summary: text("死别、流放，或者干脆是自己走的——共同生活到此为止。", "Death, exile, or simply choosing to go brings shared life to an end."),
        detail: text("做决定的人走了，被留下的人还得把日子过完；这一走究竟保住了什么，会留在余下的生活里。", "The one who chose is gone, and the one left has to go on living; whatever the departure preserved remains part of that life."),
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
    description: text("先看他们此后怎么过，“在一起”的好坏留到故事里判断。", "Look first at how they live afterward; let the story decide what their togetherness means."),
    options: [
      {
        key: "shared_life",
        label: text("有边界的共同生活", "A bounded shared life"),
        summary: text("还在一起，各自仍有目标和朋友，也留着离开的路。", "They stay together, each with aims and friends, and keep a road out."),
        detail: text("新分工要过得了普通日子，也经得住旧问题再来。", "The new arrangement has to work on ordinary days and withstand the old problem's return."),
        tags: ["together", "daily-life"],
      },
      {
        key: "transformed",
        label: text("重写后的伙伴关系", "A transformed partnership"),
        summary: text("承诺还在，关系的名字、职责或亲密方式已经换了。", "The commitment remains, but the bond's name, duties, or form of intimacy has changed."),
        detail: text("有的恋人后来以盟友相称，有的主从学会一起做主；关系已经换了活法。", "Some lovers later call each other allies; some former superiors and subordinates learn to decide together. The bond now lives by different terms."),
        tags: ["transformation", "partnership"],
      },
      {
        key: "parting",
        label: text("经过选择的告别", "A chosen parting"),
        summary: text("至少一方清醒地选择离开，保住一件更重要的东西。", "At least one person chooses to leave in order to preserve something more important."),
        detail: text("两个人可以各自理解这场告别，留下的人也有自己的话。", "Each person may understand the parting differently, and the one left behind has words of their own."),
        tags: ["parting", "agency"],
        riskTags: ["separation"],
      },
      {
        key: "unresolved",
        label: text("带着未决问题共存", "Coexist with unresolved questions"),
        summary: text("问题没解决完，但伤害不再沿旧路重复。", "The problem remains, but the harm no longer repeats along the old route."),
        detail: text("高潮过去以后，至少有一件事已经改变；同样的争执再来，也不会得到原来的结果。", "After the climax, at least one thing has changed; the same dispute no longer reaches the same result."),
        tags: ["open-ending", "coexistence"],
      },
      {
        key: "sacrifice",
        label: text("一人的最后牺牲", "One person's final sacrifice"),
        summary: text("死亡或不可回返的行动完成了目标，幸存者仍可以不赞同。", "Death or an irreversible act completes the goal, and the survivor may still reject it."),
        detail: text("它应从角色一贯的选择里长出来，别临时拿来证明爱。", "Let it grow from the character's established choices rather than using it as sudden proof of love."),
        tags: ["sacrifice", "finality"],
        riskTags: ["death", "separation"],
      },
      {
        key: "rewrite_cycle",
        label: text("改写时间或循环", "Rewrite the cycle"),
        summary: text("他们改掉重复发生的规则，也丢失原时间线的一部分。", "They change the rule of recurrence and lose part of the original timeline."),
        detail: text("改动有来处，代价也留下痕迹；有人记得，或谁也不记得，都要算进新的时间线。", "The change has a cause and the cost leaves a trace; whether someone remembers or no one does belongs to the new timeline."),
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
  question: text("你想站多近，又想让句子走多快？", "How close do you want to stand, and how fast should the sentences move?"),
  description: text("这一项记下想要的写法，供导出和后续模型路线使用。", "This records the intended prose for exports and future model routes."),
  options: [
    {
      key: "restrained",
      label: text("冷静克制", "Cool restraint"),
      summary: text("少解释，让动作、停顿和没说出口的话留在场上。", "Explain less; leave action, pauses, and unsaid words in the scene."),
      detail: text("句子清楚，修辞收着；沉默是什么，交给前后动作决定。", "Keep syntax clear and figures restrained; let surrounding action decide what the silence means."),
      tags: ["restrained", "subtext"],
    },
    {
      key: "lyrical",
      label: text("缓慢抒情", "Slow lyricism"),
      summary: text("感官可以把回忆带进长句，人物不必因此得出人生结论。", "Sensation may draw memory into long sentences without forcing a verdict on a life."),
      detail: text("意象从当下的物件和身体来，别飘出现场。", "Let images come from present objects and bodies rather than drifting out of the scene."),
      tags: ["lyrical", "sensory"],
    },
    {
      key: "rough",
      label: text("粗砺纪实", "Rough realism"),
      summary: text("先看身体、活计、天气和手头还剩多少东西。", "Look first at the body, the work, the weather, and what remains at hand."),
      detail: text("词要具体，动作要能碰到；温情从谁替谁做了事里来。", "Keep words concrete and action tangible; let tenderness come from what one person does for another."),
      tags: ["material", "concrete"],
    },
    {
      key: "ceremonial",
      label: text("庄严史诗", "Ceremonial grandeur"),
      summary: text("誓约、公共语言与反复意象，把私人决定带进更长的历史。", "Vows, public speech, and recurring images carry private choices into a longer history."),
      detail: text("别用抽象大词撑场面；让个人损失一直看得见。", "Do not prop up grandeur with abstractions; keep the individual loss visible."),
      tags: ["epic", "oath"],
    },
    {
      key: "uncanny",
      label: text("清醒异质", "Lucid uncanny"),
      summary: text("世界偏了一点，人物却仍知道门在哪、手伸向什么。", "The world tilts, while the character still knows where the door is and what the hand reaches for."),
      detail: text("让陌生来自一处准确的因果或知觉错位，不靠含糊。", "Let strangeness come from a precise shift in cause or perception, not vagueness."),
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
