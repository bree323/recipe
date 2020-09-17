// pages/recipeDetail/recipeDetail.js
import Api from "../../utils/api"
import Config from "../../utils/config"
import watch from '../../utils/watch'
const _ = Api.db.command;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    recipeDetailInfo: {}, // 菜谱详情
    isFollows: false, // 当前用户，是否关注当前菜谱 ，默认未关注
    totalFollows: 0,  // 总关注数
    followNum : 0, // 用户点击关注，通过监听
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let {
      id,
      recipeName
    } = options
    // console.log({id,recipeName})
    wx.setNavigationBarTitle({
      title: recipeName,
    })
    this.data.id = id //不渲染，只赋值，不设置值
  // 开启监听
  //  console.log('watch',watch)
    watch.setWatcher(this)
  },
  watch: {
    followNum: function(newVal, oldVal) {
      // console.log('???????????',newVal, oldVal);
      if(newVal !== oldVal) {
        this.data.totalFollows += newVal
        this.setData({
          totalFollows:this.data.totalFollows
        })
      }
    }
  },
  watchFollows() {
    this.data.totalFollows += this.data.followNum
    this.setData({
      totalFollows:this.data.totalFollows
    })
  },
  // 获取菜谱详情的方法
  async _getRecipeDetail() {
    let _id = this.data.id; //获取条件id
    let result = await Api.findById(Config.tables.recipeTable, _id);
    // console.log('菜谱详情', result)
    // 根据当前菜谱的openid，去用户表中查询对应发布人的信息
    let users = await Api.findByWhere(Config.tables.usersTable, {
      _openid: result.data._openid
    });
    result.data.userInfo = users.data[0].userInfo;
    this.setData({
      recipeDetailInfo: result.data
    })
    // console.log('菜谱详情00', this.data.recipeDetailInfo)
    let totalFollows = this.data.recipeDetailInfo.follows  // 关注总数
    this.setData({
      totalFollows
    })
    // 修改数据库中views热度值，每次+1  
    let updateViews = await Api.updateById(Config.tables.recipeTable, _id, {
      views: _.inc(1)
    })
    // 操作当前视图
    result.data.views++;
    // 判断一下，当前菜谱，当前用户是否关注了  根据用户的_openid到关注表中查询
    // 查询followTable 
    let where = {
      _openid: wx.getStorageSync('_openid'), //自己的openid
      recipeID: _id // 当前菜单id
    }
    let followResult = await Api.findByWhere(Config.tables.followTable, where)
    console.log('关注度', followResult)
    this.setData({
      recipe: result.data,
      // 反之，没有关注
      isFollows: followResult.data.length > 0 ? true : false
    })
  },

  // 处理关注操作和取消关注操作
  /* 需求
  1-  用户登录了才能进行关注操作
  2-  数据库新建关注表，没关注一个，就添加到该表中
  3-   关注操作    已经关注的，点击取消关注，  未关注的点击加入关注
   */
  async _followRecipe() {
    //1- 判断用户是否登录 使用缓存中的openid进行判断是否登录
    let _openid = wx.getStorageSync('_openid') || null;
    if (_openid == null) { 
      wx.showToast({
        title: '登录后才能关注哦!',
        icon: "none",
      })
      setTimeout(() => {
        wx.switchTab({
          url: '../personal/personal',
        })
      }, 1000)
      return;
    }
    // 已经登录了
    //3- 关注操作
     console.log('this.data.isFollows',this.data.isFollows)
    //  let bool = this.data.isFollows?true:false
    //  console.log(bool)
    //  if(bool) {console.log("??")}
    if (this.data.isFollows) { // 当前是关注状态
      //  console.log('????????????')
     let followNum = -1
     this.setData({
      followNum
     })
      //取消关注
      // 删除follows表中的对应的数据
      // 删除条件 （删除多条数据，不能再小程序端进行，必须在云端运行）
      let where = {
        _openid: wx.getStorageSync('_openid'), //自己的openid
        recipeID: this.data.id
      }

      wx.cloud.callFunction({  // 调用云函数删除云端数据库followTable表中对应的关注者信息
        name: "remove",
        data: {
          table: Config.tables.followTable,
          where,
        },
        success: async (res) => {
          // console.log('取消关注', res)
          // res.result.stats.removed == 1   === 》成功掉用云函数的返回的字段及值，如没能成功调用云函数，则不会返回该字段及字段值
          if(res.result.stats.removed != 1) return
          // 更新 recipr菜谱表中的字段follows  -1
          let updateViews = await Api.updateById(Config.tables.recipeTable, this.data.id, {
            follows: _.inc(-1)
          })
            // console.log('取消成功',updateViews)
          if (updateViews.stats.updated == 1) {
            wx.showToast({
              title: '取消成功',
            })
            this.setData({
              isFollows: false
            })
          } else {
            wx.showToast({
              title: '网络错误',
            })
          }
        }
      })
    } else {
      // 进行关注
      let followNum = 1
     this.setData({
      followNum
     })
      // recipeID
      // 插入follow表
      let addres = await Api.add(Config.tables.followTable, {
        recipeID: this.data.id
      })
      // console.log('插入follow表返回结果',addres)
      // 菜谱表更新 follows字段
      let updateViews = await Api.updateById(Config.tables.recipeTable, this.data.id, {
        follows: _.inc(1)
      })
    
      wx.showToast({
        title: '关注成功！',
      })
      this.setData({
        isFollows: true
      })
    }
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
    this._getRecipeDetail()
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