// ════════════════════════════════════════════════════════════════
// FILE: src/lib/sounds.ts
// أصوات واجهة المستخدم — تُولَّد بـ Web Audio API (بدون ملفات صوتية)
// للتعديل: عدّل freq/duration في كل وظيفة
//   playClick   — نقرة زر
//   playHover   — مرور الماوس فوق عنصر
//   playNav     — انتقال لصفحة جديدة
//   playSuccess — عملية ناجحة
//   playError   — خطأ أو رفض
// ════════════════════════════════════════════════════════════════
let ctx: AudioContext | null = null

async function getCtx() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx
}

async function play(freq: number, freq2: number, duration: number, vol = 0.15) {
  try {
    const c = await getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq2, c.currentTime + duration)
    gain.gain.setValueAtTime(vol, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch { /* ignore */ }
}

// نقرة زر
export function playClick() { play(700, 350, 0.09, 0.22) }

// تمرير فوق عنصر
export function playHover() { play(900, 800, 0.04, 0.08) }

// انتقال صفحة
export function playNav() { play(440, 700, 0.13, 0.18) }

// نجاح
export function playSuccess() {
  play(523, 784, 0.15, 0.2)
  setTimeout(() => play(784, 1046, 0.15, 0.15), 170)
}

// خطأ
export function playError() { play(300, 140, 0.22, 0.2) }
