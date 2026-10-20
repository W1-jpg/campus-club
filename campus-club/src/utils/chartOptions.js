// 图表配置工厂：统一浅色（后台）与深色（大屏）两套主题，供统计页与大屏复用

export const PALETTE = [
  '#2B5AED', '#36CFC9', '#FAAD14', '#FF7875', '#9254DE',
  '#40A9FF', '#52C41A', '#FF9C6E', '#597EF7', '#F759AB'
]

const theme = (dark) => ({
  text: dark ? '#d6ecff' : '#1F2329',
  sub: dark ? 'rgba(150,200,255,0.75)' : '#8F959E',
  axis: dark ? 'rgba(120,180,255,0.28)' : '#E5E6EB',
  split: dark ? 'rgba(120,180,255,0.12)' : '#F0F2F5',
  tooltipBg: dark ? 'rgba(8,20,40,0.94)' : 'rgba(255,255,255,0.97)',
  tooltipText: dark ? '#e6f2ff' : '#1F2329',
  legend: dark ? 'rgba(180,215,255,0.85)' : '#646A73',
  itemBorder: dark ? 'rgba(6,16,34,0.9)' : '#FFFFFF'
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
  extraCssText: 'border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.18);'
})

const legendCommon = (t) => ({
  bottom: 0,
  icon: 'circle',
  itemWidth: 8,
  itemHeight: 8,
  itemGap: 14,
  textStyle: { color: t.legend, fontSize: 12 }
})

// 饼图 / 玫瑰图
export function pieOption(data, { dark = false, rose = false, unit = '' } = {}) {
  const t = theme(dark)
  return {
    color: PALETTE,
    tooltip: { trigger: 'item', ...tooltipCommon(t), formatter: `{b}<br/>{c} ${unit}（{d}%）` },
    legend: legendCommon(t),
    series: [
      {
        type: 'pie',
        radius: rose ? ['18%', '66%'] : ['46%', '68%'],
        center: ['50%', '44%'],
        roseType: rose ? 'radius' : false,
        avoidLabelOverlap: true,
        itemStyle: { borderColor: t.itemBorder, borderWidth: 2, borderRadius: 4 },
        label: { color: t.text, fontSize: 12, formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: t.axis } },
        data: data || []
      }
    ]
  }
}

// 柱状图（支持横向 / 彩色）
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
  const items = colorful
    ? values2.map((v, i) => ({ value: v, itemStyle: { color: PALETTE[i % PALETTE.length] } }))
    : values2

  const categoryAxis = {
    type: 'category',
    data: categories,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: t.axis } },
    axisLabel: {
      color: t.sub,
      fontSize: 11,
      interval: 0,
      rotate: !horizontal && categories.length > 6 ? 28 : 0
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
      axisPointer: { type: 'shadow' },
      ...tooltipCommon(t),
      valueFormatter: (v) => `${v} ${unit}`
    },
    grid: { left: 8, right: 20, top: 26, bottom: 6, containLabel: true },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: [
      {
        type: 'bar',
        data: items,
        barMaxWidth: 26,
        itemStyle: {
          borderRadius: horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0],
          ...(color ? { color } : {})
        },
        label: {
          show: true,
          position: horizontal ? 'right' : 'top',
          color: t.sub,
          fontSize: 11
        }
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
  color = '#2B5AED',
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
        lineStyle: { width: 3, color },
        itemStyle: { color },
        areaStyle: area
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: hexToRgba(color, dark ? 0.45 : 0.28) },
                  { offset: 1, color: hexToRgba(color, 0) }
                ]
              }
            }
          : undefined
      }
    ]
  }
}

// 漏斗图
export function funnelOption(data, { dark = false } = {}) {
  const t = theme(dark)
  return {
    color: PALETTE,
    tooltip: { trigger: 'item', ...tooltipCommon(t), formatter: '{b}: {c}' },
    legend: legendCommon(t),
    series: [
      {
        type: 'funnel',
        left: '10%',
        right: '10%',
        top: 16,
        bottom: 34,
        minSize: '22%',
        gap: 2,
        label: { color: t.text, fontSize: 12, formatter: '{b}: {c}' },
        itemStyle: { borderColor: t.itemBorder, borderWidth: 2 },
        data: data || []
      }
    ]
  }
}

// 仪表盘（用于孵化进度等百分比指标）
export function gaugeOption(value = 0, { dark = false, name = '', color = '#2B5AED' } = {}) {
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
