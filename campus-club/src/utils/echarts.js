// ECharts 按需引入：只注册项目用到的图表与组件，避免打包全量体积
import * as echarts from 'echarts/core'
import {
  BarChart,
  LineChart,
  PieChart,
  FunnelChart,
  GaugeChart,
  RadarChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  GraphicComponent
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  FunnelChart,
  GaugeChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  TransformComponent,
  GraphicComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer
])

export default echarts
