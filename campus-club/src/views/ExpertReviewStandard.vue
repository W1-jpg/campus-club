<template>
  <PageLayout userType="expert">
    <div class="view-content">
      <div class="page-hero">
        <h1>评审标准</h1>
        <p>双盲评审规则与多维度评分说明</p>
      </div>
      <el-card shadow="never" header="评分维度与权重">
        <el-table :data="dimensions">
          <el-table-column prop="name" label="评分维度" width="160" />
          <el-table-column prop="weight" label="权重" width="100">
            <template #default="s">{{ s.row.weight }}%</template>
          </el-table-column>
          <el-table-column prop="desc" label="评分说明" min-width="360" />
        </el-table>
      </el-card>
      <el-card shadow="never" header="评分规则" style="margin-top: 20px">
        <ul class="rules">
          <li>每个维度按 0–100 分打分，系统按权重自动计算综合得分。</li>
          <li>综合得分 = Σ（维度分数 × 权重）/ 100。</li>
          <li>评分维度必须全部填写，分数不得超出 0–100。</li>
          <li>双盲评审：专家端不显示学生姓名、学院、学号，只依据成果材料评审。</li>
          <li>评审结论分为优秀、良好、合格、不合格，需填写评审意见。</li>
          <li>如存在利益关系，可在“评审申诉/复核”中说明并申请回避。</li>
        </ul>
      </el-card>
      <el-card shadow="never" header="综合得分参考" style="margin-top: 20px">
        <el-table :data="levels">
          <el-table-column prop="range" label="分数区间" width="160" />
          <el-table-column prop="level" label="等级" width="120" />
          <el-table-column prop="desc" label="说明" />
        </el-table>
      </el-card>
    </div>
  </PageLayout>
</template>

<script setup>
import PageLayout from '../components/PageLayout.vue'
const dimensions = [
  { name: '创新性', weight: 30, desc: '选题、方法或成果是否具有新意，是否区别于已有成果' },
  { name: '完成度', weight: 25, desc: '成果材料是否完整，目标是否完成，工作量是否充分' },
  { name: '实用性', weight: 20, desc: '成果是否具有实际应用价值或推广前景' },
  { name: '规范性', weight: 15, desc: '文档、代码、附件是否规范，是否符合提交要求' },
  { name: '整体评价', weight: 10, desc: '对成果整体质量、难度和展示效果的综合判断' }
]
const levels = [
  { range: '90–100', level: '优秀', desc: '成果质量高，创新性和实用性突出' },
  { range: '80–89', level: '良好', desc: '成果完整，达到预期目标' },
  { range: '60–79', level: '合格', desc: '基本完成，仍有一定改进空间' },
  { range: '0–59', level: '不合格', desc: '未达到基本要求，需要修改或打回' }
]
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.rules { margin: 0; padding-left: 20px; line-height: 2; color: var(--text-secondary); }
</style>
