// src/lib/local-store.ts
// 本地数据层（Astro dev/preview）
// 统一产品状态：available / upcoming / planned / archived

export type ProductStatus =
  | "available"   // 在售（可下单）
  | "upcoming"    // 预告（不下单：仅关注/询问）
  | "planned"     // 规划中（关注/询问）
  | "archived";   // 归档（默认不展示）

export type ProductMedia = {
  label?: string;
  alt?: string;
  ratio?: "4:3" | "16:9" | string;
  displayW?: number;
  displayH?: number;
};

export type ProductName = {
  zh?: string;
  en?: string;
};

export type ProductPack = {
  titleZh?: string;
  includesZh?: string[];
};

export type Product = {
  id?: string;
  slug?: string;

  name?: ProductName;

  version?: string;
  status?: ProductStatus;

  // 首页推荐位：主推/预告（产品页全量目录）
  homeSlot?: "primary" | "preview" | null;

  // 推荐候选（未来可做自动轮换）
  homeEligible?: boolean;
  featureRank?: number;
  featureWindow?: string;

  line1?: { zh?: string; en?: string };
  line2?: { zh?: string; en?: string };

  priceText?: { zh?: string; en?: string } | string;

  buyHref?: string;
  inquiryHref?: string;

  image?: ProductMedia | ProductMedia[];
  media?: ProductMedia | ProductMedia[];

  heroSetMedia?: ProductMedia;

  pack?: ProductPack;

  note?: { zh?: string; en?: string } | string;
};

export type LocalStore = {
  site: {
    brand: string;
    localeDefault: "zh";
  };
  homeRotation?: {
    manual?: boolean;
    strategy?: "rank" | "window" | "random";
  };
  products: Product[];
};

export function getLocalStore(): LocalStore {
  return {
    site: {
      brand: "ORDO",
      localeDefault: "zh",
    },

    homeRotation: {
      manual: true,
      strategy: "rank",
    },

    products: [
      // =========================
      // 在售（主卖产品）
      // =========================
      {
        id: "cfm-reading-v1-1",
        slug: "continuous-fact-marker-reading-scenario-v1-1",

        name: {
          zh: "阅读定位器",
          en: "Reading Locator",
        },

        version: "v1.1",
        status: "available",

        homeSlot: "primary",
        homeEligible: true,
        featureRank: 1,
        featureWindow: "2026-01",

        line1: { zh: "风火雷电系列", en: "Wind · Fire · Thunder · Lightning" },
        line2: { zh: "滑道式 · 碳纤维", en: "Slide · Carbon Fiber" },

        priceText: { zh: "", en: "" },

        buyHref: "/zh#buy",
        inquiryHref: "/zh/support",

        heroSetMedia: {
          label: "主卖产品主图（占位）",
          ratio: "4:3",
          displayW: 1100,
          displayH: 825,
        },

        media: [
          { label: "产品图（占位）", ratio: "4:3", displayW: 640, displayH: 480 },
        ],

        pack: {
          titleZh: "套装（四枚）",
          includesZh: ["阅读定位器 × 4（风 / 火 / 雷 / 电）"],
        },

        note: { zh: "用于标定阅读过程中“当前停留位置”的实体器具。", en: "" },
      },

      // =========================
      // 预告（不下单：仅关注/询问）
      // =========================
      {
        id: "preview-01",
        slug: "preview-01",
        name: { zh: "预告产品 01", en: "" },
        version: "—",
        status: "upcoming",

        homeSlot: "preview",
        homeEligible: true,
        featureRank: 10,

        line1: { zh: "预告阶段", en: "" },
        line2: { zh: "信息逐步公开", en: "" },

        inquiryHref: "/zh/support",

        media: [
          { label: "预告产品图（占位）", ratio: "4:3", displayW: 640, displayH: 480 },
        ],

        note: "预告阶段不开放下单。",
      },
      {
        id: "preview-02",
        slug: "preview-02",
        name: { zh: "预告产品 02", en: "" },
        version: "—",
        status: "upcoming",

        homeSlot: "preview",
        homeEligible: true,
        featureRank: 11,

        line1: { zh: "预告阶段", en: "" },
        line2: { zh: "信息逐步公开", en: "" },

        inquiryHref: "/zh/support",

        media: [
          { label: "预告产品图（占位）", ratio: "4:3", displayW: 640, displayH: 480 },
        ],

        note: "预告阶段不开放下单。",
      },

      // =========================
      // 规划中（8 个）
      // =========================
      {
        id: "planned-start-end-boundary-marker",
        slug: "start-end-boundary-marker",
        name: { zh: "开始 / 结束边界标定器", en: "" },
        version: "—",
        status: "planned",
        homeEligible: true,
        featureRank: 100,
        inquiryHref: "/zh/support",
        media: [{ label: "产品示意图（占位）", ratio: "4:3", displayW: 900, displayH: 675 }],
        note: "标定一项活动是否已经开始或结束。建立清晰边界，不计时、不提醒、不评估效率。适用场景：工作、阅读、创作、任务切换",
      },
      {
        id: "planned-responsibility-state-marker",
        slug: "responsibility-state-marker",
        name: { zh: "责任履行状态标定器", en: "" },
        version: "—",
        status: "planned",
        homeEligible: true,
        featureRank: 101,
        inquiryHref: "/zh/support",
        media: [{ label: "产品示意图（占位）", ratio: "4:3", displayW: 900, displayH: 675 }],
        note: "将责任是否已履行外显为可被承认的事实。减少重复确认，而非监督行为。适用场景：家庭责任、照护事项、维护任务",
      },
      {
        id: "planned-turn-handover-marker",
        slug: "turn-handover-marker",
        name: { zh: "轮值与交接标定器", en: "" },
        version: "—",
        status: "planned",
        homeEligible: true,
        featureRank: 102,
        inquiryHref: "/zh/support",
        media: [{ label: "产品示意图（占位）", ratio: "4:3", displayW: 900, displayH: 675 }],
        note: "明确当前轮值与交接是否完成。降低多人协作中的责任模糊。适用场景：家庭轮值、小团队协作",
      },
      {
        id: "planned-process-node-marker",
        slug: "process-node-marker",
        name: { zh: "流程关键节点标定器", en: "" },
        version: "—",
        status: "planned",
        homeEligible: true,
        featureRank: 103,
        inquiryHref: "/zh/support",
        media: [{ label: "产品示意图（占位）", ratio: "4:3", displayW: 900, displayH: 675 }],
        note: "将流程中的关键节点外显为事实状态。显示进度，不进行评分或评价。适用场景：服务流程、检查节点、现场操作",
      },
      {
        id: "planned-trace-anchor",
        slug: "trace-anchor",
        name: { zh: "回溯锚定器", en: "" },
        version: "—",
        status: "planned",
        homeEligible: true,
        featureRank: 104,
        inquiryHref: "/zh/support",
        media: [{ label: "产品示意图（占位）", ratio: "4:3", displayW: 900, displayH: 675 }],
        note: "标定上一次被确认的位置或状态。提供低成本回溯入口，不记录历史。适用场景：维护周期、学习进度、项目阶段",
      },
      {
        id: "planned-repeat-count-marker",
        slug: "repeat-count-marker",
        name: { zh: "重复次数标定器", en: "" },
        version: "—",
        status: "planned",
        homeEligible: true,
        featureRank: 105,
        inquiryHref: "/zh/support",
        media: [{ label: "产品示意图（占位）", ratio: "4:3", displayW: 900, displayH: 675 }],
        note: "将已完成的重复次数外显为事实。支持持续执行，不设目标、不作判断。适用场景：训练、练习、康复、学习重复任务",
      },
      {
        id: "planned-parameter-recall-marker",
        slug: "parameter-recall-marker",
        name: { zh: "参数复现标定器", en: "" },
        version: "—",
        status: "planned",
        homeEligible: true,
        featureRank: 106,
        inquiryHref: "/zh/support",
        media: [{ label: "产品示意图（占位）", ratio: "4:3", displayW: 900, displayH: 675 }],
        note: "保留关键参数位置，便于复现经验。不计算最优解，不提供建议。适用场景：咖啡、烘焙、创作、实验操作",
      },
      {
        id: "planned-scene-rule-kit",
        slug: "scene-rule-kit",
        name: { zh: "场景规则包（器具组合）", en: "" },
        version: "—",
        status: "planned",
        homeEligible: true,
        featureRank: 107,
        inquiryHref: "/zh/support",
        media: [{ label: "组合示意图（占位）", ratio: "4:3", displayW: 900, displayH: 675 }],
        note: "将多个标定器组合为可部署的场景系统。只提供事实层，不形成管理或监控系统。适用场景：照护场景、课堂流程、小型组织或工作室",
      },
    ],
  };
}
