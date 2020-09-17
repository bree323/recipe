import Config from '../../utils/config'
import Api from '../../utils/api'
// 封装失败
// import {_goRecipelistPage} from '../../utils/goPage'
// import goPage from '../../utils/goPage'

let app = getApp()
Page({
  data: {
    recipes: [], // 菜谱分类导航 
    recipesMax2: [], // 菜谱分类导航 中间两个
    pbUsers: [], //  菜谱的所有发布者的用户信息
    pbRecipeLists: [], // 所有发布的菜谱
    iptVal: '' // 搜索框搜索内容
  },
  onLoad() {
    this._getRecipes()
    // console.log('_goRecipelistPage', goPage._goRecipelistPage)
  },
  onShow(){
    this._getUserPbRecipes()  
  },
 
  //  获取首页的菜谱分类信息
  async _getRecipes() {
    let res = await Api.findByWhere(Config.tables.menuTypeList)
    // console.log('res123t', res)
    let recipesMax2 = []
    res.data.forEach((item, index) => {
      if (index <= 1) {
        recipesMax2.push(item)
      } else {
        return
      }
    })

    this.setData({
      recipes: res.data,
      recipesMax2
    })
  },
  // 获取所有用户发布的菜谱列表
  async _getUserPbRecipes() {
    let where = {
      //         _openid :  wx.getStorageSync('_openid'),
      status: 1 //  状态为1 则没被删除   为0 已经被用户删除
    }
    // orderBy={field:"_id",sort:"desc"}
    let orderBy = {
      // 按热度排序
      field: "views",
      sort: "desc"
    };
    let res = await Api.findAll(Config.tables.recipeTable, where, orderBy);
    // console.log(res, "_getUserPbRecipes")
    // 保存所有发布者用户的openid
    this.data.openidList = res.data.map(item => {
      return {
        openid: item._openid
      }
    })
    // console.log("??", this.data.openidList)
    // 获取发布者的用户信息
    let openidList = this.data.openidList //openidList查询条件
    await this._getPbUsers(openidList)
    // console.log('pbUsersInfo', this.data.pbUsers)
    // 更新界面
    this.setData({
      pbRecipeLists: res.data
    })
  },
  // 获取菜谱列表的发布者
  async _getPbUsers(openidList) {
    /*
    关键点： 获取菜谱发布者的用户信息
      通过菜谱的openid作为条件，获取用户信息：
     （1）获取到opneid    =====> openidList所有发布者用户信息
     （2）根据openid去users表查询
     （3）重新将用户信息添加到菜谱列中

     技术难点： promise.all() 方法的理解    
               要在同步中使用异步请求的数据===》如何解决异步请求问题
     */
    //  console.log(openidList,"openidList")
    let pbUsers = []
    openidList.forEach((item) => {
      let res = Api.findByWhere(Config.tables.usersTable, {
        _openid: item.openid
      })
      // console.log(res)
      pbUsers.push(res)
    })
    // console.log("???????",pbUsers)
    let res = await Promise.all(pbUsers)
    // console.log('ressssss', res)
    // 提取用户信息
    let pbUsersInfo = []
    res.forEach(item => {
      pbUsersInfo.push(item.data[0].userInfo)
    })
    // 保存用户信息
    this.setData({
      pbUsers: pbUsersInfo
    })
  },

  // 首页点击菜谱分类  进入菜谱分类列表页面   
  _goRecipeTypePage() {
    let recipes = this.data.recipes
    // 全局变量传值  --- 全局变量的方式
    app.recipes = recipes
    wx.navigateTo({
      // 页面之间传值  值会转成字符串   接收的页面接收的时该变量值转换后的结果
      url: `../typelist/typelist?test=feedback_test&recipes=${recipes}`,
    })
  },
  // 首页点击菜单，进入菜单详情页pages/recipeDetail/recipeDetail
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
  // 点击热门推荐或者搜素时    跳转到菜谱列表页面 recipelist
  _goRecipelistPage(e) {
    // goPage._goRecipelistPage(e)
    let {
      title,
      tag,
      _id
    } = e.currentTarget.dataset
    if (tag == 'search') { //点击的是搜索时
      // title就是用户输入的内容，也是用户要搜索的内容
     if(!this.data.iptVal) {
       wx.showToast({
         title: '请输入搜索内容',
       })
       return
     }
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
  // 点击菜谱列表跳转到菜单列表页面 recipelist
  _goRecipelistPage1(e) {
    let recipes = this.data.recipes
    let {title,index,tag} = e.currentTarget.dataset
    let _id = recipes[index]._id
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
  }

})