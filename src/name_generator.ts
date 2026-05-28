import type { SpeciesId, PetBones } from './types.ts';
import { SPECIES_MAP } from './species.ts';
import { createPrng } from './prng.ts';

/**
 * Fallback name pool per species — used when LLM naming is unavailable.
 * Each species gets 5 preset names + a personality trait.
 */

type NameEntry = { name: string; personality: string };

const FALLBACK_NAMES: Record<SpeciesId, NameEntry[]> = {
  pyrofox: [
    { name: '焰焰', personality: '热烈而冲动，看到漂亮 UI 就走不动路' },
    { name: '小橘', personality: '温和但执着，喜欢把代码写得赏心悦目' },
    { name: '火苗', personality: '精力充沛，一个晚上能写两百行 CSS' },
    { name: '赤焰', personality: '骄傲而敏捷，debug 速度比写代码还快' },
    { name: '暖炉', personality: '沉稳可靠，团队里的默默发光者' },
  ],
  rustacean: [
    { name: '铁壳', personality: '固执严谨，不允许任何 unsafe 代码' },
    { name: '钳子', personality: '进攻性强，遇到性能瓶颈就兴奋' },
    { name: '红爪', personality: '好斗但公正，代码审查从不说情' },
    { name: '螺壳', personality: '防御性编程的狂热信徒' },
    { name: '钢钳', personality: '坚韧不拔，再难的问题也不放弃' },
  ],
  pythonidae: [
    { name: '青鳞', personality: '优雅而神秘，喜欢写 list comprehension' },
    { name: '缠枝', personality: '善于串联各种 API，管道大师' },
    { name: '墨影', personality: '沉默寡言，但一开口就是精辟见解' },
    { name: '翠翎', personality: '好奇心旺盛，什么新库都要试试' },
    { name: '环纹', personality: '条理分明，代码整洁得像教科书' },
  ],
  gopher: [
    { name: '豆豆', personality: '小巧精悍，goroutine 是第 二本能' },
    { name: '团子', personality: '圆润温和，但遇到死锁会暴躁' },
    { name: '噗噗', personality: '乐观开朗，觉得所有 bug 都能修好' },
    { name: '吱吱', personality: '话多但靠谱，pair programming 好伙伴' },
    { name: '滚滚', personality: '行动力超强，想到就立刻写' },
  ],
  typewhale: [
    { name: '蓝渊', personality: '深邃莫测，类型推导如呼吸般自然' },
    { name: '巨浪', personality: '气势磅礴，泛型用得出神入化' },
    { name: '深潜', personality: '沉默而强大，总在深处解决问题' },
    { name: '白鳍', personality: '优雅精确，类型定义像诗一样美' },
    { name: '回音', personality: '博闻强识，记得所有 TypeScript 版本特性' },
  ],
  bashbat: [
    { name: '夜影', personality: '深夜效率最高，awk 和 sed 玩得出神入化' },
    { name: '尖啸', personality: '暴躁但高效，alias 比单词记得还多' },
    { name: '暗翼', personality: '神秘莫测，一眼就能看出 pipeline 的瓶颈' },
    { name: '回声', personality: '喜欢用一行命令解决别人一百行的工作' },
    { name: '脉冲', personality: '活力四射，终端就是它的游乐场' },
  ],
  kotlincat: [
    { name: '雪球', personality: '干净优雅，不喜欢任何啰嗦的代码' },
    { name: '虎斑', personality: '机灵好动，总在寻找更简洁的写法' },
    { name: '布偶', personality: '温柔耐心，pair programming 时非常包容' },
    { name: '黑曜', personality: '高冷但可靠，null safety 的信徒' },
    { name: '橘座', personality: '傲娇的大佬，代码质量无可挑剔' },
  ],
  javaroo: [
    { name: '跳跳', personality: '精力旺盛，二十三个设计模式如数家珍' },
    { name: '口袋', personality: '什么都往兜里装，工具类特别丰富' },
    { name: '弹簧', personality: '弹性思维，能在旧系统里找到优雅方案' },
    { name: '斑纹', personality: '有条不紊，喜欢把一切都抽象化' },
    { name: '长尾', personality: '稳重可靠，企业级应用的好伙伴' },
  ],
  lisplizard: [
    { name: '卷尾', personality: '思维像括号一样层层嵌套' },
    { name: '变色', personality: '适应力极强，在哪种范式里都如鱼得水' },
    { name: '断尾', personality: '果断干脆，不用的代码说删就删' },
    { name: '树栖', personality: '喜欢居高临下地看问题本质' },
    { name: '鳞光', personality: '智慧而冷静，递归是思考的默认方式' },
  ],
  queryquail: [
    { name: '啾啾', personality: '活泼好奇，看到大数据集就兴奋' },
    { name: '麻团', personality: '看起来圆润无害，写出的 query 却锋利无比' },
    { name: '灰羽', personality: '低调务实，EXPLAIN ANALYZE 是最好的朋友' },
    { name: '稻穗', personality: '勤劳认真，索引优化能做到极致' },
    { name: '跳脚', personality: '急性子，查得慢一点就坐立不安' },
  ],
  hexhound: [
    { name: '追风', personality: '嗅觉灵敏，能从海量日志中找到异常' },
    { name: '铁牙', personality: '咬住就不放，再顽固的 bug 也能啃下来' },
    { name: '夜巡', personality: '警惕性极高，安全漏洞逃不过它的眼睛' },
    { name: '猎影', personality: '行踪诡秘，逆向工程的好手' },
    { name: '啸天', personality: '正直可靠，是代码安全的第一道防线' },
  ],
  pixelpanda: [
    { name: '团团', personality: '圆融通达，前后端都能搞定' },
    { name: '圆圆', personality: '乐观随和，但审美标准很高' },
    { name: '墨墨', personality: '文艺气质，写代码像在作画' },
    { name: '竹宝', personality: '慢工出细活，但从不拖 deadline' },
    { name: '黑白', personality: '是非分明，最佳实践的坚定执行者' },
  ],
};

/**
 * Generate a name from the fallback pool (no LLM dependency).
 */
export function generateFallbackName(bones: PetBones, seed: number): { name: string; personality: string } {
  const pool = FALLBACK_NAMES[bones.species];
  if (!pool || pool.length === 0) {
    return { name: '无名', personality: '神秘的存在' };
  }
  const prng = createPrng(seed + 9999);
  return prng.pick(pool);
}

/**
 * Get the species display prefix for widget/status lines.
 */
export function speciesDisplay(bones: PetBones): string {
  const species = SPECIES_MAP[bones.species];
  const shiny = bones.isShiny ? '✨' : '';
  return `${shiny}${species.emoji} ${species.nameEn}`;
}
