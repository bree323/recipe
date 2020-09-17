import Config from '../../utils/config'
import Api from '../../utils/api'
// pages/pbmenu/pbmenu.js
Page({

  /**
   * 页面的初始数据
   */
  /* 
  提交数据
    recipeName 菜谱名称               ok
  ​		recipeTypeId 分类ID 
  ​		fields:[] 图片地址
  ​		recipeMakes：string  菜谱做法
  ​		follows: 收藏个数
  ​		views：  浏览次数
  (不存)nickName ： 发布菜谱的用户  【可以存储，还有头像问题，也可以不存储，因为有openid，到时候可以利用openid，使用promise.all去用户表查询】
  ​		status: 是否删除  （1正常  2删除）
  ​		time: 添加时间
   */
  data: {
    recipeName: '',
    typeNameValList: [], // 所有的菜谱分类信息
    files: [], // 是所有上传的图片（显示出来）[{url:"XXX.jog"},{url:"xxx.jpg"}]  
  },


  //1、 界面  菜单名称
  recipeNameIpt(e) {
    this.setData({
      recipeName: e.detail.value
    })
  },

  // 2、界面 图片选择
  _selectImg(e) {
    // 获取到上传的图片路径
    //  console.log("chose", e.detail)
    let imgUrlList = e.detail.tempFilePaths
    // 将路径数组转化成 [{url:"XXX.jog"},{url:"xxx.jpg"}] 格式 这样可以在页面渲染
    let files = imgUrlList.map(item => {
      return {
        url: item
      }
    })
    // 后续选择添加照片时，不覆盖之前的
    files = this.data.files.concat(files)
    this.setData({
      files
    })
  },
  // 3 界面  删除图片（无接口请求）
  _delImg(e) {
    // console.log(e.detail.index)
    // 获取删除图片的下标
    let index = e.detail.index
    // 更新数据
    this.data.files.splice(index, 1)
    this.setData({
      files: this.data.files
    })
  },
  // 5、菜单发布
  async _submit(e) {
    // console.log(e)
    // 搜集表单数据
    let {
      recipeName,
      recipeTypeId,
      recipeMake
    } = e.detail.value
    // console.log({recipeName, recipeTypeid, recipesMake})
    let fields = await this._uploaderFile(this.data.files)
    // console.log('duo', fields)
    // fields = fields[]
    let data = {
      follows: 0, // 粉丝
      views: 0, // 热度 （首页热度排名需要用到这个）
      status: 1, //  状态
      time: new Date().getTime(), // 时间戳  用于图片 唯一标识命名
      recipeName, // 菜谱名
      recipeMake, // 菜谱做法
      recipeTypeId, // 菜谱id
      fields //fields  图片的上传路径
    }
    // console.log(data)
    // 执行添加
    let result = await Api.add(Config.tables.recipeTable, data);
    // console.log(result,'插入成功')
    if (result._id) {
      wx.showToast({
        title: '菜谱发布成功',
      })
      setTimeout(() => {
        wx.navigateBack({
          delta: 1,
        })
      }, 1500)
    }

  },
  // ★★★★ 多图上传
  async _uploaderFile(files) {
    //files的格式： [{url:"xxx"},{url:"xxx"}]
    let allFilesPromise = []; // 全部的promise对象  一张图片的对应一个promise
    files.forEach((item, index) => {
      let extName = item.url.split('.').pop(); //获取拓展名
      let fileName = new Date().getTime() + '_' + index + '.' + extName; //图片文件名，不能重名，这里加时间戳和index下标作为唯一标识
      // 调用云函数   小程序wx.cloud.uploadFile用于上传文件
      let promise = wx.cloud.uploadFile({
        cloudPath: "c-recipes/" + fileName, // 上传至云端的路径  "c-recipes/": 创建一个c-recipes文件夹
        filePath: item.url, // 小程序临时文件路径
      })
      allFilesPromise.push(promise)
    })
    return await Promise.all(allFilesPromise)
  },
  // 获取菜谱分类
  async _menuTypeList() {
    let res = await Api.findAll(Config.tables.menuTypeList)
    // console.log(res, "请求回来的的列表")
    this.setData({
      typeNameValList: res.data
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this._menuTypeList()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})