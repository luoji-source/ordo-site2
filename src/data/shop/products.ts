export type ShopImage = { src: string; alt: string };

export type ShopFAQ = { q: string; a: string };

export type ShopVariant = { id: string; label: string; note: string };

export type ShopDeliveryStep = { t: string; name: string; desc: string };

export type ShopProduct = {
  slug: string;
  name: string;
  series?: string;
  /** Full HTML <title> value (without site suffix). */
  title: string;
  /** Meta description. */
  description: string;

  statusBadge: string;
  sku: string;

  /** One-paragraph lead under the product title. */
  lead: string;
  /** “Why” cards: problem framing. */
  whyIntro: string;
  whyCards: { no: string; title: string; desc: string }[];

  /** Short, outward-facing points (same tone as /zh/shop). */
  points: string[];

  /** How to use (kept short). */
  usageIntro?: string;
  usageSteps?: { title: string; desc: string }[];

  /** Scenario guidance (kept factual, not "万能"). */
  scenarios?: { title: string; problem: string; does: string; image: ShopImage }[];

  /** Series meanings (wind/fire/thunder/lightning). */
  seriesIntro?: string;
  seriesMeanings?: { label: string; title: string; desc: string }[];

  images: ShopImage[];
  variants: ShopVariant[];

  deliveryIntro: string;
  delivery: ShopDeliveryStep[];

  checklist: string[];
  boundaries: string[];

  faq: ShopFAQ[];
};

export const ORDER_EMAIL = "orders@ordoinc.com";

export const ZH_PRODUCTS: ShopProduct[] = [
  {
    slug: "reading-locator",
    name: "阅读定位器",
    series: "风火雷电系列",
    title: "阅读定位器 · 风火雷电系列 · 商城详情",
    description:
      "ORDO 阅读定位器（风火雷电系列）详情页：滑块定位行/段落；包含使用与多场景说明、风火雷电寓意，以及交付节点、到手核对与售后口径。",

    statusBadge: "在售 / 小批量批次",
    sku: "RL-FHLD",

    lead:
      "阅读定位器是‘责任事实’的个人级入口器具：用滑块把位置落到行/段落。你停在哪里，下一次就从哪里继续——它不提醒、不评价，只把‘我停在这里’固定成可回到的事实。系列提供四个外观款式：风 / 火 / 雷 / 电。",

    whyIntro:
      "阅读定位器不替你做判断，也不替你做提醒。它只把“你现在在哪里”变成可核对事实：在连续过程中标定一个你承认的起点，减少丢失、反复、回读的成本。",
    whyCards: [
      {
        no: "01",
        title: "回到原位",
        desc: "当你被打断、停读、跨天继续时，你需要的不是提醒，而是一个可核对的位置事实。",
      },
      {
        no: "02",
        title: "减少反复确认",
        desc: "你不再需要“我读到哪了”的心理消耗——位置在器具上。",
      },
      {
        no: "03",
        title: "让交付可追溯",
        desc: "版本与批次用于核对与售后：发生变化时你能回到同一事实底座。",
      },
    ],

    points: [
      "滑块定位行/段落：把‘页’升级为‘行’",
      "被打断也能回到同一判断点：位置是事实，不靠记忆",
      "四款外观：风/火/雷/电（流动/专注/中断/顿悟）",
    ],

    usageIntro:
      "三步定位：放置 → 设定 → 复归。你不需要学习一套方法，只需要在中断发生时给出一个可回到的边界点。",
    usageSteps: [
      {
        title: "放置",
        desc: "夹在当前页（或当前段落所在页）。",
      },
      {
        title: "设定",
        desc: "把滑块推到你停下时的行/段落附近（不追求‘正确’，只追求你承认的当前位置）。",
      },
      {
        title: "复归",
        desc: "下次打开书，先回到滑块所示位置，再继续往下读。",
      },
    ],

    scenarios: [
      {
        title: "深度阅读 / 长周期阅读",
        problem: "上次停在什么位置？",
        does: "把中断点固定成事实，避免回读与反复确认。",
        image: {
          src: "/images/shop/reading-locator/scene-reading-960x640.png",
          alt: "场景：深度阅读（占位图）",
        },
      },
      {
        title: "工作资料 / 规范 / 合同",
        problem: "执行前，我最后确认到哪一条？",
        does: "标定‘看到并承认’的位置，把‘我看过’与‘我应该知道’分离。",
        image: {
          src: "/images/shop/reading-locator/scene-workdocs-960x640.png",
          alt: "场景：工作资料（占位图）",
        },
      },
      {
        title: "学习 / 训练",
        problem: "流程进行到哪一段？",
        does: "只标定中断点，避免进度幻觉；继续时回到同一边界。",
        image: {
          src: "/images/shop/reading-locator/scene-learning-960x640.png",
          alt: "场景：学习训练（占位图）",
        },
      },
      {
        title: "多任务切换",
        problem: "我是主动中断还是被打断？",
        does: "给出边界点：切换回来时不需要重新‘找状态’，先回到原位置。",
        image: {
          src: "/images/shop/reading-locator/scene-multitask-960x640.png",
          alt: "场景：多任务切换（占位图）",
        },
      },
    ],

    seriesIntro:
      "风火雷电不是玄学，而是四种‘连续性被改变的方式’。你按偏好选择外观，它们共同服务于同一个事实：回到原位置继续。",
    seriesMeanings: [
      {
        label: "风",
        title: "流动与节奏",
        desc: "翻页、扫读、回看会改变方向，但你仍需要一个能回到的位置锚点。",
      },
      {
        label: "火",
        title: "专注与燃点",
        desc: "进入状态推进很快；退出状态时更需要把中断点钉住，避免‘以为记得’。",
      },
      {
        label: "雷",
        title: "被打断的瞬间",
        desc: "消息、会议像雷一样切开连续性；定位器负责留下边界点，便于复归。",
      },
      {
        label: "电",
        title: "顿悟与决断",
        desc: "灵感来得快、走得也快；你不必记录灵感本身，但要能立刻标定当下位置。",
      },
    ],

    images: [
      { src: "/images/home/reading-locator-hero.jpg", alt: "阅读定位器·风火雷电系列" },
      { src: "/images/home/slide-structure-960.png", alt: "滑道与滑块结构示意" },
      { src: "/images/explain-reading-scene-960.png", alt: "阅读场景：滑块定位行" },
      // Placeholders (replace later with real photos, keep sizes stable)
      { src: "/images/shop/reading-locator/detail-placeholder-960x640.png", alt: "细节占位图（960×640）" },
      { src: "/images/shop/reading-locator/detail-placeholder-960x720.png", alt: "使用占位图（960×720）" },
      { src: "/images/shop/reading-locator/detail-placeholder-1100x825.png", alt: "包装/套装占位图（1100×825）" },
    ],

    variants: [
      { id: "wind", label: "风", note: "流动 / 节奏" },
      { id: "fire", label: "火", note: "专注 / 燃点" },
      { id: "thunder", label: "雷", note: "打断 / 边界" },
      { id: "lightning", label: "电", note: "顿悟 / 决断" },
    ],

    deliveryIntro:
      "我们借鉴的是“节点透明”：你在下单前就能知道交付会经过什么；若节点变化，原因与影响会在更新页公开。",
    delivery: [
      { t: "T0", name: "邮件确认", desc: "确认：款式、数量、价格、批次与预计发货窗口。" },
      { t: "T1", name: "备货/生产", desc: "按批次：生成追溯信息（版本/批次）。" },
      { t: "T2", name: "质检与打包", desc: "形成到手核对清单；缺陷以事实核对后处理。" },
      { t: "T3", name: "发货/交付", desc: "提供物流与收货核对口径；必要时提供组织交付清单。" },
      { t: "T4", name: "售后窗口", desc: "修复/替换按事实处理，并写入记录，便于追溯。" },
    ],

    checklist: [
      "版本号 / 批次（与邮件确认一致）",
      "完整性（配件/包装/说明）",
      "外观款式（风/火/雷/电）",
    ],
    boundaries: [
      "它不采集行为数据、不评分、不强提醒",
      "它不替代阅读方法，只固定“位置事实”",
      "若你需要更细节说明，请走支持页核对通道",
    ],

    faq: [
      {
        q: "这是众筹吗？",
        a: "不是。我们借鉴的是“透明节点”的理念：下单前把交付批次与节点说清楚；节点变化公开原因与影响。",
      },
      {
        q: "为什么不直接在线支付？",
        a: "当前阶段优先保证交付与追溯口径一致。邮件确认能把版本/批次/节点写清楚，避免误购与误解。",
      },
      {
        q: "四个款式有什么区别？",
        a: "对外仅作为外观区分。我们不做对标式参数叙述；你按偏好选择即可。",
      },
      {
        q: "售后怎么处理？",
        a: "以事实核对为准：版本/批次/缺陷事实 → 修复/替换，并写入更新记录便于追溯。",
      },
    ],
  },
];

export function getZhProduct(slug: string): ShopProduct | undefined {
  return ZH_PRODUCTS.find((p) => p.slug === slug);
}
