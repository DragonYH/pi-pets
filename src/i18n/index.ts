/**
 * 轻量级 i18n 模块
 *
 * 支持：
 * - 自动检测系统语言（LANG / LC_ALL 环境变量）
 * - 运行时语言切换（setLanguage）
 * - 插值参数（{name} 占位符）
 */
import zhCN from "./zh-CN.js";
import en from "./en.js";

export type Language = "zh-CN" | "en";

const dictionaries: Record<Language, Record<string, string>> = {
  "zh-CN": zhCN,
  en,
};

/** 检测系统语言 */
function detectSystemLanguage(): Language {
  const langEnv =
    process.env.LANG ||
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    "";
  if (langEnv.toLowerCase().startsWith("zh")) return "zh-CN";
  return "en";
}

let currentLanguage: Language = detectSystemLanguage();

/** 获取当前语言 */
export function getLanguage(): Language {
  return currentLanguage;
}

/** 设置语言 */
export function setLanguage(lang: Language): void {
  if (dictionaries[lang]) {
    currentLanguage = lang;
  }
}

/** 获取支持的语言列表 */
export function getSupportedLanguages(): Language[] {
  return Object.keys(dictionaries) as Language[];
}

/**
 * 翻译函数
 * @param key 翻译 key
 * @param params 插值参数，如 { name: "my-pet" }
 * @returns 翻译后的字符串
 */
export function t(key: string, params?: Record<string, string>): string {
  const dict = dictionaries[currentLanguage];
  let template = dict[key];

  // 回退：如果当前语言没有翻译，尝试英文
  if (template === undefined) {
    template = dictionaries["en"][key];
  }

  // 最终回退：返回 key 本身
  if (template === undefined) {
    return key;
  }

  // 插值替换
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      template = template.replaceAll(`{${k}}`, v);
    }
  }

  return template;
}
