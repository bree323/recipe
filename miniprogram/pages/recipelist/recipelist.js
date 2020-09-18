// pages/recipelist/recipelist.js
import Config from '../../utils/config'
import Api from '../../utils/api'
let app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    recipesListInfo: [], // 对应菜谱列表的菜单信息
    pbUsersInfo: [],// 发布者的用户信息
    page:1,     // 默认显示页
    maxPage: 0     //  最大页数。。所有数据已请求完成
  },
  // 页面加载时   1、设置对应标题     2、判断进入那个菜谱页面     3、相应页面进行数据请求
  async _whichTypelist(tag, id, title) {
    /* title: 菜谱名称   值唯一   两个用处：借此判断进入到那个菜谱页面    而是作为顶部标题使用
     tag： 菜谱对应的标识
     recipeTypeId：点击菜谱对应的recipeTypeId   通过它去c-recipes表中找发布的菜单 */
    //  设置菜单列表头部标题
    /* console.log({
      tag,
      id,
      title
    }) */
    this.data.tag = tag
    this.data.id = id
    this.data.title = title
    wx.setNavigationBarTitle({
      title: title,
    })
    // 获取全局变量recipes   菜谱类别列表
    // console.log('菜谱类别列表a', app.recipes)
    // 设置查询条件、排序规则
    let where = {},
      orderBy = {},
      limit = 5,
      page = this.data.page
    
    // 进行判断，当前菜单页面是由哪个页面跳转而来
    switch (tag) {
      case 'ptfl': // 普通分类
        // console.log(tag)
        //  根据recipeTypeId去找符合类目名的的菜单  且状态status为1 
        where = {
          recipeTypeId: id,
          status: 1
        };
        orderBy = {
          field: "time",
          sort: "desc"
        }
        break
      case 'rmcp': // 热门菜谱
        where = {
          status: 1
        }
        orderBy = {
          field: "views",
          sort: "desc"
        }
        break
      case 'tjcp': // 推荐菜谱
        // console.log(tag)
        break
      case 'search': // 搜索菜谱
        // 根据title进行搜索菜单
        // 设置搜索条件
        where = {
          status: 1,
          recipeName: Api.db.RegExp({
            regexp: title,
            options: 'i',
          })
        }
        orderBy = {
          field: "views",
          sort: "desc"
        }
        break
      default:
        // console.log("出错啦")
        break
    }
    // 链接数据库，进行数据请求。
    let res = await Api.findByWhere(Config.tables.recipeTable, where, limit, page, orderBy)
    // console.log('链接数据库，进行数据请求', res)
    // console.log({page,res})
    if(res.data.length >= 1) {
      // 页数加一
      this.data.page++
    } else {
      this.setData({
        maxPage: this.data.page
      })
    }
    if (res.length <= 0) return // 菜单列表为空时，结束函数

    let recipesListInfo = res.data.concat(this.data.recipesListInfo)
    //   console.log("菜单列表", recipesListInfo)
    let openidList = [] //搜集发布信息的用户的_openid  用于请求对应的用户信息
    recipesListInfo.forEach(item => {
      openidList.push(item._openid)
      // 给相应的菜单添加对应的星星热度
      var len = 0
      if (item.views <= 40) {
        len = Math.ceil(item.views / 10) //以10为一个阶段，  1-10为1星。。。。
      }
      if (item.views > 40) {
        len = 5
      }
      let startLengthLight = new Array(len)
      let startLengthGrey = new Array(5 - len)
      item.startLengthLight = startLengthLight
      item.startLengthGrey = startLengthGrey
    })

    //  根据_openid去找对应的发布者的信息
    this._getPbUsers(openidList)
    // console.log('recipesListInfo', recipesListInfo)
   
    this.setData({
      recipesListInfo
    })
  },
  // 获取菜谱列表的所有发布者用户信息
  async _getPbUsers(openidList) {
    let pbUsers = []
    openidList.forEach((item) => {
      let res = Api.findByWhere(Config.tables.usersTable, {
        _openid: item.openid
      })
      pbUsers.push(res)
    })
    let res = await Promise.all(pbUsers)
    // 提取用户信息
    let pbUsersInfo = []
    res.forEach(item => {
      pbUsersInfo.push(item.data[0].userInfo)
    })
    // 保存用户信息
    this.data.pbUsersInfo = pbUsersInfo
    this.setData({
      pbUsersInfo: this.data.pbUsersInfo
    })
  },

  // 点击菜单，进入菜单详情页pages/recipeDetail/recipeDetail  同首页  可封装
  _gorecipeDetailPage(e) {
    //  传入菜单id，作为查询具体菜单的条件   菜单名--》作为顶部title
    //  console.log(e)
    let {
      id,
      recipename
    } = e.currentTarget.dataset
    wx.navigateTo({
      // 页面之间传值  值会转成字符串   接收的页面接收的时该变量值转换后的结果
      url: `../recipeDetail/recipeDetail?id=${id}&recipeName=${recipename}`,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   * 页面从哪里跳转而来 页面加载时需要进行一个判断：
   *  1、普通菜谱   2、推荐菜谱   3、热门菜谱   4、搜索菜谱
   * 页面加载需要传递的参数：
   * tag：作为页面跳转的标识，标识该页面从哪里而来，对应展示相应的内容
   * title: 作为菜单页面的标题
   * this.data.id = id; //
    this.data.tag = tag;
    this.data.title = title;
   * 
   */
  onLoad: function (options) {
    // console.log('options', options)
    // 接参 由typelist页面点击对应的菜谱进入的对应的页面参数   
    let {
      title,
      tag,
      id
    } = options
    // console.log({title, index, recipeTypeId})
    this._whichTypelist(tag, id, title)
  },
  onReachBottom(){
    console.log('加载数据-----------')
    // 继续调用获取菜谱方法
    if(this.data.page!=this.data.maxPage) {
      this._whichTypelist(this.data.tag,this.data.id,this.data.title)
    }
    
  }

})