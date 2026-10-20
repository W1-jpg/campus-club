<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-header"><div><h2 class="page-header__title">企业管理</h2><p class="page-header__subtitle">管理合作企业账户</p></div><el-button type="primary" @click="add"><el-icon><Plus /></el-icon>添加企业</el-button></div>
      <div class="content-card" style="margin-bottom:var(--spacing-lg);"><el-input v-model="search" placeholder="搜索企业名称/行业/联系人" class="search-input" clearable @clear="load"><template #append><el-button type="primary" @click="load">搜索</el-button></template></el-input></div>
      <div class="content-card" style="padding:0;overflow:hidden;">
        <el-table :data="list" v-loading="loading" style="width:100%">
          <el-table-column prop="id" label="编号" width="70"/><el-table-column prop="username" label="用户名" width="100"/><el-table-column prop="company_name" label="企业名称" min-width="150" show-overflow-tooltip/><el-table-column prop="industry" label="行业" width="100"/><el-table-column prop="phone" label="电话" width="130"/><el-table-column prop="email" label="邮箱" width="180"/><el-table-column prop="create_time" label="创建时间" width="170"/>
          <el-table-column label="操作" width="140" fixed="right"><template #default="s"><el-button type="primary" size="small" link @click="edit(s.row)">编辑</el-button><el-button type="danger" size="small" link @click="del(s.row.id)">删除</el-button></template></el-table-column>
        </el-table>
        <div style="padding:var(--spacing-lg);display:flex;justify-content:flex-end;"><el-pagination v-model:current-page="pg" v-model:page-size="ps" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next" :total="total" @size-change="load" @current-change="load"/></div>
      </div>
      <el-dialog v-model="dlg" :title="title" width="550px" :close-on-click-modal="false">
        <el-form :model="form" label-width="80px">
          <el-form-item label="用户名"><el-input v-model="form.username"/></el-form-item>
          <el-form-item label="密码" v-if="isAdd"><el-input v-model="form.password" type="password"/></el-form-item>
          <el-form-item label="企业名称"><el-input v-model="form.company_name"/></el-form-item>
          <el-form-item label="电话"><el-input v-model="form.phone"/></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="form.email"/></el-form-item>
          <el-form-item label="行业"><el-select v-model="form.industry" style="width:100%"><el-option v-for="t in inds" :key="t" :label="t" :value="t"/></el-select></el-form-item>
          <el-form-item label="地址"><el-input v-model="form.address"/></el-form-item>
        </el-form>
        <template #footer><el-button @click="dlg=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
      </el-dialog>
    </div>
  </PageLayout>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
const list=ref([]),search=ref(''),pg=ref(1),ps=ref(10),total=ref(0),loading=ref(false),dlg=ref(false),title=ref(''),isAdd=ref(false),form=ref({username:'',password:'',company_name:'',phone:'',email:'',industry:'',address:''})
const inds=['信息技术','互联网','金融','教育','制造业','医疗健康','能源环保','其他']
onMounted(()=>{load()})
const load=async()=>{loading.value=true;try{const r=await request({url:'/api/admin/enterprises',params:{page:pg.value,pageSize:ps.value,search:search.value}});if(r.code===200){list.value=r.data.enterprises;total.value=r.data.total}}catch{ElMessage.error('获取失败')}finally{loading.value=false}}
const add=()=>{title.value='添加企业';isAdd.value=true;form.value={username:'',password:'',company_name:'',phone:'',email:'',industry:'',address:''};dlg.value=true}
const edit=(row)=>{title.value='编辑企业';isAdd.value=false;form.value={...row,password:''};dlg.value=true}
const save=async()=>{if(!form.value.username||(isAdd.value&&!form.value.password)||!form.value.company_name){ElMessage.warning('请填写必要字段');return};try{const u=isAdd.value?'/api/admin/enterprises':'/api/admin/enterprises/'+form.value.id;const m=isAdd.value?'post':'put';const r=await request({url:u,method:m,data:form.value});if(r.code===200){ElMessage.success(isAdd.value?'添加成功':'编辑成功');dlg.value=false;load()}else ElMessage.error(r.msg)}catch{ElMessage.error('操作失败')}}
const del=async(id)=>{try{await ElMessageBox.confirm('确定删除该企业？','确认',{type:'warning'})}catch{return};try{await request.delete('/api/admin/enterprises/'+id);ElMessage.success('删除成功');load()}catch{ElMessage.error('删除失败')}}
</script>
<style scoped>.manage-content{max-width:var(--content-max-width-wide);margin:0 auto;padding:var(--spacing-xl)}.search-input{max-width:420px}</style>
