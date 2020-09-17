// pages/recipelist/recipelist.js

import Api from "../../utils/api"
import Config from "../../utils/config"
Page({

  /**
   * 页面的初始数据
   */
  data: {
    page:1, //  默认显示页
    recipeLists:[], //存放所有的菜谱
    tips:false, //判断当前菜谱下是否有菜谱
    tip:false, //没有更多数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let  {id,title,tag} = options;
    console.log('optoions===============')
    console.log({id,title,tag})
    wx.setNavigationBarTitle({
      title,
    })
    this.data.id = id; //
    this.data.tag = tag;
    this.data.title = title;
    this._getRecipes(tag);
  },
  // 根据条件，获取菜谱信息
  async _getRecipes(tag){
      // 核心代码
    // console.log(tag)
    let where = {}, orderBy = {},limit=5,page=this.data.page,id=this.data.id;
    let title  =this.data.title;
    switch(tag){
      case "ptfl": //  普通分类
        // 设置搜索条件
        where = {recipeTypeId:id,status:1};
        orderBy={field:"time",sort:"desc"}
      break;
      case "rmcp":  // 热门菜谱
        // 设置搜索条件
        where = {status:1};
        orderBy={field:"views",sort:"desc"}
      break;
      case "tjcp":  // 推荐
        // 设置搜索条件
        where = {status:1};
        orderBy={field:"follows",sort:"desc"}
      break;
      case "search": // 搜索
        // 设置搜索条件
        where = {
          status:1,
          recipeName:Api.db.RegExp({
            regexp: title,
            options: 'i',
          }),
        }
        orderBy={field:"time",sort:"desc"}
      break;
    }

    // 链接数据库，进行查询
    let result = await Api.find( Config.tables.recipeTable,where,limit,page,orderBy )
    //  当第一次进入当前页面，获取数据为空时，显示没有发布过信息
    if(result.data.length <= 0 &&  page ==1){
      //  没有数据
      this.setData({
        tips:true,
      })
      return;
    }
    // 加载数据时，没有更多数据了
    if(result.data.length < limit){
      //  没有更多数据了
      this.setData({
        tip:true,
      })
    }

    let usersAllPromise = []; //用来存放所以得promise用户对象的
    result.data.forEach((item,index)=>{
      // console.log(item._openid)
        // item._openid
        let usersPromise = Api.find(Config.tables.userTable, {
          _openid: item._openid
        });
      usersAllPromise.push(usersPromise)
    })
    let  users = await  Promise.all( usersAllPromise )
    // 利用map函数，给result.data数据添加新的内容
    result.data.map((item,index)=>{
      item.userInfo = users[index].data[0].userInfo
    })

    // 把新获取到的数据和原来的数据拼接在一个数组中
    result.data =  this.data.recipeLists.concat(result.data);

    this.setData({
      recipeLists:result.data
    })
  },
  onReachBottom(){
    // console.log('加载数据')
    //  下一页
    this.data.page++;
    // 继续调用获取菜谱方法
    this._getRecipes(this.data.tag)
  }

  
})