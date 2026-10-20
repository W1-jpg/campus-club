// 图表配置工厂：统一浅色（后台）与深色（大屏）两套主题，供统计页与大屏复用

export const PALETTE = [
  '#3B82F6', '#06B6D4', '#F59E0B', '#EF4444', '#8B5CF6',
  '#10B981', '#F97316', '#6366F1', '#EC4899', '#14B8A6'
]

const theme = (dark) => ({
  text: dark ? '#d6ecff' : '#1F2329',
  sub: dark ? 'rgba(150,200,255,0.75)' : '#8F959E',
  axis: dark ? 'rgba(120,180,255,0.28)' : '#E5E6EB',
  split: dark ? 'rgba(120,180,255,0.12)' : '#F0F2F5',
  tooltipBg: dark ? 'rgba(8,20,40,0.94)' : 'rgba(255,255,255,0.97)',
  tooltipText: dark ? '#e6f2ff' : '#1F2329',
  legend: dark ? 'rgba(180,215,255,0.85)' : '#646A73',
  itemBorder: dark ? 'rgba(6,16,34,0.9)' : '#FFFFFF',
  track: dark ? 'rgba(120,180,255,0.08)' : '#F3F5FA'
})

const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const tooltipCommon = (t) => ({
  backgroundColor: t.tooltipBg,
  borderWidth: 0,
  padding: [8, 12],
  textStyle: { color: t.tooltipText, fontSize: 12 },
  extraCssText: 'border-radius:10px;box-shadow:0 10px 30px rgba(15,35,80,0.16);'
})

const legendCommon = (t, many = false) => ({
  bottom: 0,
  type: many ? 'scroll' : 'plain',
  icon: 'circle',
  itemWidth: 8,
  itemHeight: 8,
  itemGap: 14,
  textStyle: { color: t.legend, fontSize: 12 }
})

const truncate = (text, max = 10) => {
  const s = String(text ?? '')
  return s.length > max ? `${s.slice(0, max)}…` : s
}

// 纵向/横向渐变
const gradient = (color, horizontal = false, dark = false) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: horizontal ? 1 : 0,
  y2: horizontal ? 0 : 1,
  colorStops: [
    { offset: 0, color: hexToRgba(color, dark ? 0.95 : 0.92) },
    { offset: 1, color: hexToRgba(color, dark ? 0.55 : 0.5) }
  ]
})

// 饼图 / 环形图 / 玫瑰图
export function pieOption(data, { dark = false, rose = false, unit = '' } = {}) {
  const t = theme(dark)
  const rows = (data || []).map((d) => ({ ...d, value: Number(d.value) || 0 }))
  const total = rows.reduce((sum, item) => sum + item.value, 0)
  const many = rows.length > 6
  const showLabel = rows.length > 0 && rows.length <= 6

  return {
    color: PALETTE,
    tooltip: { trigger: 'item', ...tooltipCommon(t), formatter: `{b}<br/>{c} ${unit}（{d}%）` },
    legend: legendCommon(t, many),
    graphic: rose || !total
      ? []
      : [
          {
            type: 'text',
            left: 'center',
            top: '36%',
            silent: true,
            style: {
              text: String(total),
              fill: t.text,
              fontSize: 26,
              fontWeight: 700,
              fontFamily: 'DIN Alternate, Arial, sans-serif',
              textAlign: 'center'
            }
          },
          {
            type: 'text',
            left: 'center',
            top: '46%',
            silent: true,
            style: { text: '总计', fill: t.sub, fontSize: 11, textAlign: 'center' }
          }
        ],
    series: [
      {
        type: 'pie',
        radius: rose ? ['18%', '66%'] : ['52%', '72%'],
        center: ['50%', '44%'],
        roseType: rose ? 'radius' : false,
        avoidLabelOverlap: true,
        minAngle: 2,
        itemStyle: {
          borderColor: t.itemBorder,
          borderWidth: 3,
          borderRadius: 6,
          shadowBlur: dark ? 0 : 8,
          shadowColor: 'rgba(43,90,237,0.10)'
        },
        label: {
          show: showLabel,
          color: t.text,
          fontSize: 12,
          formatter: '{b}\n{d}%'
        },
        labelLine: { show: showLabel, length: 8, length2: 10, lineStyle: { color: t.axis } },
        emphasis: { scale: true, scaleSize: 6, label: { fontWeight: 700 } },
        data: rows
      }
    ]
  }
}

// 柱状图（支持横向 / 彩色 / 渐变）
export function barOption({
  categories = [],
  values = [],
  dark = false,
  horizontal = false,
  colorful = false,
  color,
  unit = ''
} = {}) {
  const t = theme(dark)
  const values2 = values.map((v) => (typeof v === 'string' ? Number(v) : v))
  const items = values2.map((v, i) => {
    const base = colorful ? PALETTE[i % PALETTE.length] : (color || '#3B82F6')
    return {
      value: v,
      itemStyle: { color: gradient(base, horizontal, dark) }
    }
  })

  const categoryAxis = {
    type: 'category',
    data: categories,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: t.axis } },
    axisLabel: {
      color: t.sub,
      fontSize: 11,
      interval: 0,
      rotate: !horizontal && categories.length > 6 ? 26 : 0,
      formatter: (value) => truncate(value, horizontal ? 12 : 10)
    }
  }
  const valueAxis = {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: t.sub, fontSize: 11 },
    splitLine: { lineStyle: { color: t.split } }
  }

  return {
    color: PALETTE,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: dark ? 'rgba(80,150,255,0.08)' : 'rgba(43,90,237,0.06)' } },
      ...tooltipCommon(t),
      valueFormatter: (v) => `${v} ${unit}`
    },
    grid: { left: 8, right: 22, top: 30, bottom: 8, containLabel: true },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: [
      {
        type: 'bar',
        data: items,
        barMaxWidth: 22,
        showBackground: true,
        backgroundStyle: { color: t.track, borderRadius: 8 },
        itemStyle: {
          borderRadius: horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0],
          ...(color && !colorful ? { color: gradient(color, horizontal, dark) } : {})
        },
        label: {
          show: true,
          position: horizontal ? 'right' : 'top',
          distance: 4,
          color: t.sub,
          fontSize: 11,
          formatter: ({ value }) => `${value}${unit ? ' ' + unit : ''}`
        },
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(43,90,237,0.25)' } },
        animationDuration: 900
      }
    ]
  }
}

// 折线 / 面积图
export function lineOption({
  labels = [],
  values = [],
  dark = false,
  area = true,
  smooth = true,
  color = '#3B82F6',
  unit = ''
} = {}) {
  const t = theme(dark)
  const values2 = values.map((v) => (typeof v === 'string' ? Number(v) : v))
  return {
    color: [color],
    tooltip: {
      trigger: 'axis',
      ...tooltipCommon(t),
      valueFormatter: (v) => `${v} ${unit}`
    },
    grid: { left: 8, right: 20, top: 26, bottom: 6, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: t.axis } },
      axisLabel: { color: t.sub, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: t.sub, fontSize: 11 },
      splitLine: { lineStyle: { color: t.split } }
    },
    series: [
      {
        type: 'line',
        data: values2,
        smooth,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 3, color, shadowBlur: 10, shadowColor: hexToRgba(color, 0.35) },
        itemStyle: { color, borderWidth: 2, borderColor: t.itemBorder },
        emphasis: { focus: 'series', scale: 1.6 },
        areaStyle: area
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: hexToRgba(color, dark ? 0.45 : 0.26) },
                  { offset: 1, color: hexToRgba(color, 0) }
                ]
              }
            }
          : undefined
      }
    ]
  }
}

// 漏斗图（用于孵化阶段）
export function funnelOption(data, { dark = false } = {}) {
  const t = theme(dark)
  const rows = (data || []).map((d) => ({ ...d, value: Number(d.value) || 0 }))
  return {
    color: PALETTE,
    tooltip: { trigger: 'item', ...tooltipCommon(t), formatter: '{b}: {c} 项' },
    legend: legendCommon(t),
    series: [
      {
        type: 'funnel',
        left: '8%',
        right: '8%',
        top: 14,
        bottom: 34,
        minSize: '24%',
        gap: 3,
        sort: 'descending',
        label: {
          color: t.text,
          fontSize: 12,
          formatter: '{b}: {c}'
        },
        itemStyle: { borderColor: t.itemBorder, borderWidth: 2, opacity: 0.92 },
        data: rows
      }
    ]
  }
}

// 仪表盘（用于孵化进度等百分比指标）
export function gaugeOption(value = 0, { dark = false, name = '', color = '#3B82F6' } = {}) {
  const t = theme(dark)
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        radius: '92%',
        progress: { show: true, width: 14, itemStyle: { color } },
        axisLine: { lineStyle: { width: 14, color: [[1, t.split]] } },
        axisTick: { show: false },
        splitLine: { length: 10, lineStyle: { color: t.axis } },
        axisLabel: { color: t.sub, fontSize: 10, distance: 14 },
        pointer: { itemStyle: { color } },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: t.text,
          fontSize: 22,
          offsetCenter: [0, '62%']
        },
        title: { color: t.sub, fontSize: 12, offsetCenter: [0, '88%'] },
        data: [{ value, name }]
      }
    ]
  }
}
