// 成果占位封面：本地生成的高级感 SVG（渐变 + 光斑 + 纹理 + 玻璃圆盘 + 大图标）
// 不依赖任何外部图片，离线可用，按成果 id 稳定生成不同配色。

const PALETTES = [
  ['#6366F1', '#8B5CF6', '#EC4899'],
  ['#0EA5E9', '#22D3EE', '#14B8A6'],
  ['#F59E0B', '#F97316', '#EF4444'],
  ['#10B981', '#34D399', '#0EA5E9'],
  ['#F43F5E', '#FB7185', '#FBBF24'],
  ['#8B5CF6', '#6366F1', '#22D3EE'],
  ['#0F766E', '#14B8A6', '#5EEAD4'],
  ['#1E3A8A', '#3B82F6', '#93C5FD'],
  ['#7C3AED', '#A855F7', '#F0ABFC'],
  ['#B45309', '#F59E0B', '#FDE68A'],
  ['#BE123C', '#F43F5E', '#FDA4AF'],
  ['#065F46', '#10B981', '#6EE7B7'],
  ['#312E81', '#4F46E5', '#818CF8'],
  ['#9A3412', '#EA580C', '#FDBA74'],
  ['#155E75', '#0891B2', '#67E8F9'],
  ['#4C1D95', '#7C3AED', '#C4B5FD']
]

const ICONS = {
  软件: '💻', 论文: '📄', 文创: '🎨', 发明: '💡', 实践: '🔧',
  艺术: '🎭', 创业: '🚀', 竞赛: '🏆', 调查: '📊', 其他: '📦',
  专利: '📜', 学术: '📚', 设计: '✨', 公益: '🤝', 体育: '⚽'
}

export function getPlaceholderCover(id, type) {
  const numericId = Number(id) || 1
  const [c1, c2, c3] = PALETTES[Math.abs(numericId) % PALETTES.length]
  const icon = ICONS[type] || '📦'
  const blobX = 300 + (numericId * 13) % 90
  const blobY = 60 + (numericId * 7) % 70
  const dotX = 60 + (numericId * 17) % 120
  const dotY = 40 + (numericId * 11) % 60

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="0.55" stop-color="${c2}"/>
      <stop offset="1" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="shine" cx="0.82" cy="0.12" r="0.85">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="#ffffff" fill-opacity="0.16"/>
    </pattern>
  </defs>
  <rect width="480" height="320" fill="url(#bg)"/>
  <rect width="480" height="320" fill="url(#shine)"/>
  <circle cx="${blobX}" cy="${blobY}" r="120" fill="#ffffff" opacity="0.20" filter="url(#soft)"/>
  <circle cx="${dotX}" cy="${260 - dotY}" r="96" fill="#0b1020" opacity="0.14" filter="url(#soft)"/>
  <rect width="480" height="320" fill="url(#dots)"/>
  <path d="M0 252 L480 138 L480 320 L0 320 Z" fill="#ffffff" opacity="0.06"/>
  <circle cx="240" cy="160" r="86" fill="#ffffff" opacity="0.16"/>
  <circle cx="240" cy="160" r="86" fill="none" stroke="#ffffff" stroke-opacity="0.30" stroke-width="2"/>
  <circle cx="${blobX - 30}" cy="${blobY + 40}" r="7" fill="#ffffff" opacity="0.5"/>
  <text x="240" y="160" text-anchor="middle" dominant-baseline="central"
        font-size="104" font-family="'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif">${icon}</text>
</svg>`

  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}
