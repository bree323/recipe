// pages/search/search.js
import Config from '../../utils/config'
import Api from '../../utils/api'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    hotSearch: [],   // 热门搜索
    lastSearch: [],  // 近期搜索
    iptVal: '', // 搜索框搜索内容
  },

  // 点击热门推荐或者搜素时    跳转到菜谱列表页面 recipelist
  _goRecipelistPage(e) {
    console.log('???',e)
    console.log(e.target.dataset.title)
    if(!e.target.dataset.title && !this.data.iptVal) {
      wx.showToast({
        title: '请输入搜索内容',
      })
      return
    }
    // goPage._goRecipelistPage(e)
    let {
      title,
      tag,
      _id
    } = e.currentTarget.dataset
    if (tag == 'search') { //点击的是搜索时
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
    }
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

  // 热门搜索，根据热度从数据库中请求  由条数限制
async _hotSearch() {
   let orderBy = {field: "views", sort: "desc"}
  //  collectionName, where = {}, limit = 5, page = 1, orderBy 
   let res = await Api.findByWhere(Config.tables.recipeTable,{status:1},6,1,orderBy)
  //  console.log('热门搜索，根据热度从数据库中请求', res)
  this.setData({
    hotSearch: res.data
  })
  // console.log('this.data.hotSearch',this.data.hotSearch)
},
  // 近期搜索，从本地缓存中获取，
_lastSearch() {
  let lastSearch =  wx.getStorageSync('search')
  this.setData({
    lastSearch
  })
},
  // 点击菜单，进入菜单详情页pages/recipeDetail/recipeDetail
  _gorecipeDetailPage(e) {
    //  传入菜单id，作为查询具体菜单的条件   菜单名--》作为顶部title
    console.log(e)
    let {
      id,
      recipename
    } = e.currentTarget.dataset
    console.log({
      id,
      recipename
    })
    wx.navigateTo({
      // 页面之间传值  值会转成字符串   接收的页面接收的时该变量值转换后的结果
      url: `../recipeDetail/recipeDetail?id=${id}&recipeName=${recipename}`,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   
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
    this._hotSearch()
    this._lastSearch()
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