// pages/pbmenutype/pbmenutype.js
import Config from '../../utils/config'
import Api from '../../utils/api'

let app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    typeNameValList: [], // 菜谱列表
    typeNameVal: '', // 添加的菜谱名
    menutypename_id: '', // 修改的标识
    menutypename: '' // 修改时，修改框显示
  },
  onShow() {
  this._menuTypeList()
  },
  // 请求menuTypeList
  async _menuTypeList() {
    let res = await Api.findAll(Config.tables.menuTypeList)
    // console.log(res, "请求回来的的列表")
    this.setData({
      typeNameValList: res.data
    })

  },
  _menuTypeListAddVal(e) {
    let typeNameVal = e.detail.value
    this.setData({
      typeNameVal
    })
  },
  // 类别添加
  async _menuTypeListAdd() {
    let menuTypeName = this.data.typeNameVal
    if (menuTypeName) {
      // 尽量减少请求次数
      // let find_res = await Api.findAll(Config.tables.menuTypeList)
      // console.log(find_res,"查找的结果")
      // isHad判断即将添加的是否已经存在  true为存在， false为不存在
      let isHad = this.data.typeNameValList.some(item => {
        return item.menuTypeName == menuTypeName
      })
      if (isHad) {
        wx.showToast({
          title: '菜谱名已经存在',
        })
        return
      }
      // 查找数据库，如果没有则添加
      let add_res = await Api.add(Config.tables.menuTypeList, {
        menuTypeName
      })
      this.data.typeNameValList.push({
        menuTypeName
      })
      let typeNameValList = this.data.typeNameValList
      // console.log(typeNameValList,'添加成功后')
      // 更新数据
      this.setData({
        typeNameValList
      })
      // 添加成功
      if (add_res._id) {
        this.setData({
          typeNameVal:''
        })
        wx.showToast({
          title: '添加成功',
        })
      }
    } else {
      wx.showToast({
        title: '请输入菜谱名',
      })
    }
  },
  // 类别删除
  /* 1、需求应该是删除对应的菜谱名称，同时也要删除该菜谱名称下对应的菜单.....这个功能体验太差，后台一删除，就得把该菜谱下的所有用户菜单都得删除  ---    */
   _menuTypeListDel(e) {
    // console.log("del",e)
    let that = this
    let menutypename = e.target.dataset.menutypename
    // let res = await Api.removeById(Config.tables.menuTypeList, id)
    wx.showModal({
      title: '提示',
      content: '删除后不可恢复',
    async success (res) {
        if (res.confirm) {
          // console.log('用户点击确定')
          let res1 = await Api.removeByWhere(Config.tables.menuTypeList, menutypename)
          // console.log("where", res1)
          // 删除成功
          if (res1.stats.removed === 1) {
            // 拿到当前删除项的索引
            let delInd = that.data.typeNameValList.findIndex(item => {
              return item.menuTypeName == menutypename
            })
            // console.log(delInd,"index")
            that.data.typeNameValList.splice(delInd, 1)
            // 更新界面
            that.setData({
              typeNameValList: that.data.typeNameValList
            })
            wx.showToast({
              title: '删除成功',
            })
          }
        } else if (res.cancel) {
          console.log('用户点击取消')
          return
        }
      }
    })
  },

   // 跳转到发布菜谱页面
   _goRecipePage() {
    wx.navigateTo({
      url: '../pbmenu/pbmenu',
    })
  },

  // 更新  第一个蓝色的按钮更新事件函数
  _doMenuTypeListUpdate(e) {
    let menutypename = e.target.dataset.menutypename
    // console.log('_doMenuTypeListUpdate', menutypename)
    this.setData({
      menutypename,
      menutypename_id: menutypename // 保存原始的值，作为更新时的条件
    })
    console.log(this.data.menutypename, this.data.menutypename_id)
    // this.data.menutypename_id = menutypename
  },
  // 输入框更新menutypename
  _menuTypeListUpdateIpt(e) {
    let menutypename = e.detail.value
    this.setData({
      menutypename,
    })
    // console.log("ipt",this.data.menutypename)
  },
  // 更新请求
  async _menuTypeListUpdate() {
    // 更改的条件 也就是最初的值
    let menutypename = this.data.menutypename_id
    // 更改的数据  也就是更改后的值   
    let data = this.data.menutypename
    // console.log({
    //   menutypename,
    //   data
    // })
    if (menutypename != data) {
      let res = await Api.upateByWhere(Config.tables.menuTypeList, {menuTypeName:menutypename}, {
        menuTypeName: data
      })
      console.log(res,"updata okk")
      // 界面更新
      if (res.stats.updated) {
      
      let upated =  this.data.typeNameValList.map(item => {
          if(item.menuTypeName == menutypename) {
             item.menuTypeName = data
             return item
            } else {return item}
        })
      //  输入框更新
      this.setData({
        menutypename:''
      })
        this.setData({
          typeNameValList: upated
        })
        wx.showToast({
          title: '更新成功',
        })
      } else {
        wx.showToast({
          title: '没有修改项目',
        })
      }
    } else {
      wx.showToast({
        title: '没有一丝改变',
      })
    }
  },
})