<template>
	<div class="table-info clearfix" v-loading="loading">
		<el-button>默认按钮</el-button>
	</div>
</template>

<script>
	//用来序列化对象，提交http请求时使用
	import qs from "qs"
	export default {
		name: "editTable",
		/*
		 	@props {queryUrl} 父组件传过需要去获取表格数据的地址
		 	@props {queryParams} 父组件传过需要去获取表格数据时附带的参数
		 	@props {loadState} 首次加载页面时是否去动态加载表格数据
		 * */
		props: {
			queryUrl: {
				type: String,
				required: true
			},
			multiple: {
				type: Boolean,
				default: false
			},
			queryParams: {
				type: Object
			},
			loadStat: {
				type: Boolean,
				default: false
			},
			initState: {
				type: Boolean,
				default: false
			},
			paginationShow:{
				type: Boolean,
				default: true
			},
			initData: {
				type: Object
			},
			beforeInitTable: {
				type: Function
			}
		},
		/*
		 	表格组件内的数据
		 	loadUrl:父组件传过需要去获取表格数据的地址
		 	multipleSelection:所有选中数据的集合
		 	tableData：表格数据
		 	loading：初始loading状态
		 	pageInfo：分页信息
		 		page：当前的页码
		 		rows：当前每页显示的条数
		 * */
		data() {
			return {
				loadUrl: this.queryUrl,
				multipleSelection: [],
				tableData: {},
				loading: false,
				pagination:true,
				pageInfo: {
					page: 1,
					rows: 10,
				},
			}
		},
		/*
		 	表格和分页是基于element-ui提供的组件进行动态地封装
		 * */
		methods: {
			/*
			 	对外提供的接口加载表格数据使用
			 	逻辑为：
			 	当前页面为第一页时，需要手动获取数据
			 	当页面不为1时，只要改变页码为1自动触发handleCurrentChange函数
			 * */
			loadTableData() {
				if(this.pageInfo.page == 1) {
					this.getData();
				} else {
					this.pageInfo.page = 1
				}

			},
			/*表格展开*/
			expand(row, expandState) {
				this.$emit("expand", row, expandState)
			},
			/*
			 	表格内部获取数据的函数
			 * */
			getData() {
				this.loading = true
				var data = Object.assign({}, this.queryParams, this.pageInfo)
				axios.post(this.loadUrl, qs.stringify(data)).then((response) => {
					if(this.beforeInitTable) {
						this.beforeInitTable(response.data);

					}
					this.tableData = response.data;
					debugger
					if(this.initState){
						if(!this.tableData.rows.length){
							this.tableData.rows.push(this.initData)
						}
					}
				/*	if(this.pageInfo.page == 1 && response.data.rows.length < 10)
						this.pagination = false
					else
						this.pagination = true*/
						if(response.data.total<=5){
							this.pagination = false
						}
					this.loading = false
				})
			},
			/*
			 	改变选择的数据到当前表格组件
			 	当改变选择项时触发
			 	@param {val} 当前选中的列集合
			 * */
			handleSelectionChange(val) {
				this.multipleSelection = val;
			},
			/*
			 	动态绑定@class current-row 当该列为所有选中行的子集时，动态给该行添加class
			 * */
			showcheck(row, index) {
				if(this.multipleSelection.indexOf(row) != -1)
					return "current-row"
			},
			/*
			 	切换某行数据的选中状态
			 * */
			selectRow(rowdata) {
				if(!this.multiple) {
					this.$refs.tableS.clearSelection()
					this.$refs.tableS.toggleRowSelection(rowdata)
				}
				var index = this.tableData.rows.indexOf(rowdata)
				this.$emit("row-click", rowdata, index)
				return false
			},
			/*
			 	显示某行数据详情
			 * */
			showDetail(row) {
				this.$emit("row-dblclick", row)
			},
			/*
			 	切换每页显示条数时，执行的回调
			 	//包括重新加载数据以及赋值
			 * */
			handleSizeChange(pagesize) {
				this.pageInfo.rows = pagesize
				this.loadTableData();

			},
			/*
			 	切换分页码时动态调用的回调函数
			 * */
			handleCurrentChange(page) {
				this.pageInfo.page = page
				this.getData();
			}
		},
		/*
		 	计算属性
		 	totalLength：动态地根据值来改变当前表格的数据的总条数
		 * */
		computed: {
			totalLength() {
				return this.tableData.total
			}
		},
		/*
		 	vue周期函数
		 	当组件加载完成时的回调
		 * */
		created() {
			if(this.loadState)
				this.getData();
		},
		mounted() {
			this.$emit("table-mounted");
		},
	}
</script>
