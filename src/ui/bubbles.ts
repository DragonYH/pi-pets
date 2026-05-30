import type { EmotionState } from '../types.ts';

/**
 * Random bubble messages per emotion state.
 * Used in the widget panel.
 */

const BUBBLES: Record<EmotionState, string[]> = {
  happy: [
    '今天代码写得不错！',
    '这个实现很优雅~',
    '好想写代码啊！',
    '我的主人最棒了！',
    '又修复了一个 bug，开心！',
  ],
  curious: [
    '这个 API 是什么？',
    '咦，新的框架？',
    '这个写法没见过...',
    '让我看看这个库怎么用~',
    '嗯？有更新了？',
  ],
  excited: [
    '哇！测试全绿！',
    '太棒了！又升级了！',
    '这个功能太酷了！',
    '今天的效率爆表！',
    '我觉得我能写一整天！',
  ],
  tired: [
    '有点累了...',
    '想睡一会儿...',
    '这个 bug 改了好久...',
    '眼睛有点花了...',
    '需要休息一下...',
  ],
  hungry: [
    '好饿啊...',
    '投喂！投喂！',
    '代码不能当饭吃...',
    '有吃的吗？',
    '饿得写不动了...',
  ],
  frustrated: [
    '这个 bug 怎么回事！',
    '为什么又报错了...',
    '我真的会谢...',
    '重构？不如重写！',
    '这代码是谁写的？！（是我写的...）',
  ],
  sick: [
    '难受...',
    '感觉不太对劲...',
    '需要照顾...',
    '状态不太好...',
    '好想休息...',
  ],
  working: [
    '正在写代码...',
    '让我想想这个设计...',
    '查一下文档...',
    '这个 bug 有点意思...',
    '专注工作模式！',
    '正在努力搬砖...',
  ],
};

export function getRandomBubble(state: EmotionState): string {
  const messages = BUBBLES[state] ?? BUBBLES.happy;
  return messages[Math.floor(Math.random() * messages.length)];
}
