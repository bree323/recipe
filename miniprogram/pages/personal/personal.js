// pages/personal/personal.js
import Api from '../../utils/api'
import Config from '../../utils/config'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    //判断小程序的API，回调，参数，组件等是否在当前版本可用。
    // canIUse: wx.canIUse('button.open-type.getUserInfo'),
    isLogin: false, //  登录状态
    userInfo: {}, // 用户信息
    isAdmin: false, // 管理员权限
    acctiveIndex: "0", // 选项卡初始值
    selfRecipeList: [],  //个人发布的菜单对应的菜谱列表
    followsRecipeList: [1,1]      //用户自己关注的菜单列表followsRecipeList
  },
  // 用户授权登录
  bindGetUserInfo: function (e) {
    if (e.detail.userInfo) {
      //用户按了允许授权按钮
      let that = this;
      // 获取用户的信息
      let userInfo = e.detail.userInfo
      // console.log(userInfo, "登录用户信息")
      // 保存用户信息到本地，用户下次打开小程序时，在页面进行判断，已授权则不需再次授权登录
      try {
        wx.setStorageSync('userInfo', userInfo)
      } catch (e) {
        console.log(e)
      }
      //调用云函数   将首次登录用户数据存储到云端
      wx.cloud.callFunction({
        name: "cl-users", // 云函数的名字，在控制台云函数列表中查询
        async success(res) {
          // console.log(res, "云函数执行成功了")
          let _openid = res.result.openid; //获取用户唯一标识openid

          // 4.查询当前用户是否在用户表中，如果在，直接什么都不做
          let allUsers = await Api.findAll(Config.tables.usersTable, {
            _openid
          })
          // console.log(allUsers,"获取所有的用户")
          // 用户首次登录
          if (allUsers.data.length <= 0) {
            // 首次登录的用户添加用户信息
            Api.add(Config.tables.usersTable, {
              userInfo
            })
          }
          //5.判断是为管理员登录
          let isAdmin = Config.tables.isAdminOpenid.some(item => {
            return item === _openid
          })
          // console.log(isAdmin,"管理员")
          // 把openid ， userinfo 插入到缓存中
          wx.setStorageSync('_openid', _openid);
          wx.setStorageSync('userInfo', userInfo);
          wx.setStorageSync('isAdmin', isAdmin);
          wx.showToast({
            title: '登录成功',
          })
          // 所有数据相关的操作完成后渲染页面 
          that.setData({
            isLogin: true,
            userInfo,
            isAdmin
          })
        }
      })
    } else {

      //用户按了拒绝按钮
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，将无法完美体验，请授权之后再进入!!!',
        showCancel: false,
        confirmText: '返回授权',
        success: function (res) {
          // 用户没有授权成功，不需要改变 isLogin 的值
          if (res.confirm) {
            console.log('用户点击了“返回授权”');
          }
        }
      });
    }
  },
  // 管理员权限，进入到商品管理界面
  _gomenuTypePage() {
    if (!this.data.isAdmin) return
    wx.navigateTo({
      url: '../pbmenutype/pbmenutype',
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.isLoginFn()
    this._getSelfRecipes()
  },
  // 检测是否登录授权方式一   wx.getSetting
  isLoginFn() {
    let that = this;

    // wx.cloud.callFunction({
    //  name: "user",
    //  success(res) {
    //     console.log("cloudFn", res)
    //  }
    // })

    // 查看是否授权
    wx.getSetting({
      success: function (res) {
        console.log("wx.getSetting检测是否是否授权")
        console.log(res)
        // 用户授权，获取用户信息
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: function (res) {
              // 获取已登录的用户信息
              let userInfo = wx.getStorageSync('userInfo')
              let isAdmin = wx.getStorageSync('isAdmin')
              // console.log(userInfo,"???")
              // 更新登录状态
              that.setData({
                isLogin: true,
                userInfo,
                isAdmin
              })
              // 用户授权成功后，调用微信的 wx.login 接口，从而获取code
              wx.login({
                success: res => {
                  // 获取到用户的 code 之后：res.code
                  console.log("用户的code:" + res.code);
                  // 可以传给后台，再经过解析获取用户的 openid
                }
              });
            }
          });
        } else {
          // 用户没有授权
          // 改变 isLogin 的值，显示授权页面
          that.setData({
            isLogin: false
          });
        }
      }
    });
  },
  // 检测是否登录授权方式二
  isLoginFn1() {

  },
  // 跳转到发布菜谱页面
  _goRecipePage() {
    wx.navigateTo({
      url: '../pbmenu/pbmenu',
    })
  },
  // 切换顶部导航 切换选项卡
  tabNav(e) {
    let acctiveIndex = e.currentTarget.dataset.acctiveindex
    this.setData({
      acctiveIndex
    })
    switch (acctiveIndex) {
      case "0":
        // console.log(0)
        // this._getSelfRecipes()
        break
      case "1":
        this._getSelfRecipeList()
        break
      case "2":
        this._getFollow()
        break
      default:
        break
    }
  },

  // 获取自己发布的菜谱信息(选项卡”菜谱对应内容)
  async _getSelfRecipes() {
    let where = {
      _openid: wx.getStorageSync('_openid'),
      status: 1 //  状态为1 则没被删除   为0 已经被用户删除
    }
    // orderBy={field:"_id",sort:"desc"}
    let orderBy = {
      field: "time",
      sort: "desc"
    };
    let result = await Api.findAll(Config.tables.recipeTable, where, orderBy);
    // console.log(result,"async _getSelfRecipes")
    this.setData({
      selfRecipeLists: result.data
    })
  },
  // 删除自己发布的菜谱信息(更新)
  _removeSelfRecipes(e) {
    let _this = this
    //删除不是真正的删除  而是通过修改status =0来改变在获取请求时是否能被获取， 根据id修改   
    let id = e.currentTarget.dataset.id
    let index = e.currentTarget.dataset.index
    wx.showModal({
      title: '确认删除',
      content: "真的要说再见了",
      async success(e1) {
        // 用户点击了确定删除
        if (e1.confirm) {
          // 发送删除请求
          console.log('Api', Api)

          let res = await Api.updateById(Config.tables.recipeTable, id, {
            status: 0
          })
          // console.log("删除后", res)
          // 删除成功后本地更新视图页面
          if (res.stats.updated) {
            _this.data.selfRecipeLists.splice(index, 1)
            let selfRecipeLists = _this.data.selfRecipeLists
            _this.setData({
              selfRecipeLists
            })
            wx.showToast({
              title: '再见吧再见吧',
            })
          }
        }
      },
      fail() {
        wx.showToast({
          title: '网络错误，删除失败',
        })
      }
    })
  },
// 获取自己发布的菜单对应的菜谱信息
  async _getSelfRecipeList() {
      let where = {
        _openid : wx.getStorageSync('_openid'),
        status: 1
      }
      // console.log(where)
      let recipeTypeIdList = []
      
      let SelfRecipe = await Api.findAll(Config.tables.recipeTable,where)
      // console.log('SelfRecipe',SelfRecipe) 
      SelfRecipe.data.forEach(item => {
        recipeTypeIdList.push(item.recipeTypeId)
      })
      // console.log('recipeTypeIdList去重，',recipeTypeIdList)
      // recipeTypeIdList去重，   不同菜单可能对应同一个菜谱
      let newrecipeTypeIdList = [...new Set(recipeTypeIdList)]
      // console.log('newrecipeTypeIdList',newrecipeTypeIdList)
      // 并发请求
      let recipeTypeIdPromiseList = []
      newrecipeTypeIdList.forEach(item => {
        let res = Api.findById(Config.tables.menuTypeList,item)
        
        recipeTypeIdPromiseList.push(res)
      })
      let res =await Promise.all(recipeTypeIdPromiseList)
      let selfRecipeList = []
      console.log('12345678',res)
      res.forEach(item => {
        selfRecipeList.push(item.data)
      })
      // console.log('selfRecipeList',selfRecipeList)
     this.setData({
      selfRecipeList
     })
  },

  // 获取用户自己关注的菜单信息
  async _getFollow() {
    //  在根据用户标识去关注表中找到用户关注的菜单标识，再根据菜单标识到菜单表中找菜单信息
    let where = {
      _openid: wx.getStorageSync('_openid'),
    }
    let follows = await Api.findAll(Config.tables.followTable,where)
    // console.log('follows',follows)
    let followsRecipeIDList = follows.data.map(item => {
      return item.recipeID
    })
    // console.log('followsRecipeID,',followsRecipeID)
   let followsRecipePromiseList = []
  //  使用promise.all()处理并发请求
  followsRecipeIDList.forEach( async (item) => {

      let followsRecipePromise =  Api.findByWhere(Config.tables.recipeTable,{_id:item,status: 1})

      followsRecipePromiseList.push(followsRecipePromise)
    })

  let followsRecipeList = []
  let res  = await Promise.all(followsRecipePromiseList)
   res.forEach(item => {
    followsRecipeList.push(item.data[0])
   })
    this.setData({
      followsRecipeList
    })
    console.log('this.data.followsRecipeList',this.data.followsRecipeList)
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
// 点击菜谱列表跳转到菜单列表页面 recipelist
_goRecipelistPage(e) {
  let {title,id,tag} = e.currentTarget.dataset
  wx.navigateTo({
    url: `../recipelist/recipelist?title=${title}&tag=${tag}&id=${id}`,
  })
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
    // 解决从添加页面回来，   页面刷新，数据也更新
    this._getSelfRecipes()
    
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