// 成果封面：本地真实图片，按成果类型匹配，答辩演示不依赖外网。
// 图片位于 public/images/covers/，由 Vite 原样复制到 dist/images/covers/。

const CATEGORY_COVERS = {
  软件: '/images/covers/software.jpg',
  论文: '/images/covers/paper.jpg',
  文创: '/images/covers/design.jpg',
  发明: '/images/covers/invention.jpg',
  实践: '/images/covers/practice.jpg',
  艺术: '/images/covers/art.jpg',
  创业: '/images/covers/startup.jpg',
  竞赛: '/images/covers/competition.jpg',
  调查: '/images/covers/data.jpg',
  其他: '/images/covers/other.jpg'
}

export function getPlaceholderCover(id, type) {
  return CATEGORY_COVERS[type] || CATEGORY_COVERS.其他
}
