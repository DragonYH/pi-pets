import type { SpeciesDef, SpeciesId } from './types.ts';

export const SPECIES: SpeciesDef[] = [
  {
    id: 'pyrofox',
    name: '火狐',
    nameEn: 'Pyrofox',
    emoji: '🦊',
    domain: '前端开发',
    baseStats: { debugging: 45, patience: 40, chaos: 70, wisdom: 50, snark: 75 },
    description: '天生对 CSS 有第六感，但看到 IE 兼容就炸毛',
  },
  {
    id: 'rustacean',
    name: '铁甲蟹',
    nameEn: 'Rustacean',
    emoji: '🦀',
    domain: '系统编程',
    baseStats: { debugging: 60, patience: 75, chaos: 30, wisdom: 65, snark: 40 },
    description: '内存安全是信仰，编译通过就是最大的快乐',
  },
  {
    id: 'pythonidae',
    name: '灵蟒',
    nameEn: 'Pythonidae',
    emoji: '🐍',
    domain: '脚本/ML',
    baseStats: { debugging: 50, patience: 55, chaos: 55, wisdom: 70, snark: 45 },
    description: '缩进比命重要，import this 是人生哲学',
  },
  {
    id: 'gopher',
    name: '地鼠',
    nameEn: 'Gopher',
    emoji: '🐹',
    domain: '后端服务',
    baseStats: { debugging: 55, patience: 70, chaos: 40, wisdom: 60, snark: 50 },
    description: '并发是本能，接口设计是艺术',
  },
  {
    id: 'typewhale',
    name: '巨鲸',
    nameEn: 'TypeWhale',
    emoji: '🐋',
    domain: '类型系统',
    baseStats: { debugging: 70, patience: 65, chaos: 25, wisdom: 75, snark: 35 },
    description: '类型即文档，泛型即魔法',
  },
  {
    id: 'bashbat',
    name: '蝙蝠',
    nameEn: 'BashBat',
    emoji: '🦇',
    domain: 'DevOps/Shell',
    baseStats: { debugging: 40, patience: 30, chaos: 80, wisdom: 45, snark: 70 },
    description: '一行命令跑天下，管道才是真爱',
  },
  {
    id: 'kotlincat',
    name: '科猫',
    nameEn: 'Kotlincat',
    emoji: '🐱',
    domain: '移动端',
    baseStats: { debugging: 65, patience: 55, chaos: 45, wisdom: 55, snark: 55 },
    description: 'null safety 守护者，扩展函数是秘密武器',
  },
  {
    id: 'javaroo',
    name: '袋鼠',
    nameEn: 'Javaroo',
    emoji: '🦘',
    domain: '企业级 Java',
    baseStats: { debugging: 50, patience: 80, chaos: 20, wisdom: 70, snark: 30 },
    description: '设计模式倒背如流，XML 配置是刻在 DNA 里的',
  },
  {
    id: 'lisplizard',
    name: '蜥蜴',
    nameEn: 'LispLizard',
    emoji: '🦎',
    domain: '函数式编程',
    baseStats: { debugging: 55, patience: 60, chaos: 65, wisdom: 80, snark: 45 },
    description: '括号即生命，递归即本能',
  },
  {
    id: 'queryquail',
    name: '鹌鹑',
    nameEn: 'QueryQuail',
    emoji: '🐦',
    domain: '数据库',
    baseStats: { debugging: 75, patience: 50, chaos: 35, wisdom: 60, snark: 40 },
    description: '索引优化是呼吸，JOIN 是本能反应',
  },
  {
    id: 'hexhound',
    name: '猎犬',
    nameEn: 'HexHound',
    emoji: '🐕',
    domain: '安全/逆向',
    baseStats: { debugging: 80, patience: 45, chaos: 60, wisdom: 50, snark: 60 },
    description: '二进制里找线索，栈溢出是早餐',
  },
  {
    id: 'pixelpanda',
    name: '熊猫',
    nameEn: 'PixelPanda',
    emoji: '🐼',
    domain: '全栈/设计',
    baseStats: { debugging: 50, patience: 50, chaos: 50, wisdom: 50, snark: 50 },
    description: '前端后端通吃，设计编码全栈——均衡就是王道',
  },
];

export function getSpecies(id: SpeciesId): SpeciesDef {
  const s = SPECIES.find((sp) => sp.id === id);
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}

export const SPECIES_MAP: Record<SpeciesId, SpeciesDef> = Object.fromEntries(
  SPECIES.map((s) => [s.id, s]),
) as Record<SpeciesId, SpeciesDef>;
