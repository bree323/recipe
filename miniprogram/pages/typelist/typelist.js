// pages/typelist/typelist.js
import Config from '../../utils/config'
import Api from '../../utils/api'
let app = getApp()
Page({
   
  /**
   * 页面的初始数据
   */
  data: {
    recipes: [] //菜谱分类信息 
  },

// 点击菜谱列表跳转到菜单列表页面 recipelist
   _goRecipelistPage(e) {
    let recipes = this.data.recipes
    let {title,index,tag} = e.currentTarget.dataset
    let _id = recipes[index]._id
    wx.navigateTo({
      url: `../recipelist/recipelist?title=${title}&tag=${tag}&id=${_id}`,
    })
   },

 // 点击热门推荐或者搜素时    跳转到菜谱列表页面 recipelist
 _goRecipelistPageFromSearch(e) {
  // goPage._goRecipelistPage(e)
  let {
    title,
    tag,
    _id
  } = e.currentTarget.dataset
//点击的是搜索时
    // title就是用户输入的内容，也是用户要搜索的内容
    // 清空搜素内容
    this.setData({
      iptVal: ""
    })
    // 记录当前的搜索记录 将搜索内容 recipename 存入缓存
    //格式为： ["123"，“345，”5678“]
    let search = wx.getStorageSync('search') || []
    let findSearchIndex = search.findIndex(item => {
      return item == title
    })
    //  如果第一次搜索  
    if (findSearchIndex == -1) {
      search.unshift(title)
    } else { // 不是第一次搜索
      // 将他的位置移动到首位
      search.splice(findSearchIndex, 1)
      search.unshift(title)
    }
    //  将搜素内容存入缓存
    wx.setStorageSync('search', search)
  wx.navigateTo({
    url: `../recipelist/recipelist?title=${title}&tag=${tag}&id=${_id}`,
  })
},
  //  搜索框输入搜索内容
  _iptVal(e) {
    //  console.log(e.detail.value)
    this.setData({
      iptVal: e.detail.value
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log(options)

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
    // 组件传值 ----全局变量的方式  接受由首页跳转过来的值
    // console.log('app',app.recipes)
    let recipes = app.recipes
    this.setData({
      recipes
    })
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