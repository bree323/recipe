# 项目中遇到的问题

## 一、需求分析方面

### 1、单个页面对应多个页面内容的需求分析

**问题描述：** 

1. 在首页的点击菜谱分类进入到菜谱分类列表，在菜谱分类列表页面中点击对应的菜谱名单项进入到菜单列表页面中，在菜单列表里页面显示菜谱对应的菜单。
2. 这里只考虑了菜谱分类列表页面进入到菜单页面的情况
3. 而实际，写到后面才发现，对应的搜索功能也需要跳转到对应的菜单列表页面中，忽略了这点，导致菜单列表页面需重新构造

**问题分析：**

1. 没有提前对整体功能进行分析，单个的实现局部代码

**问题解决:**

两种方案： 

1. 单个功能分离写，各菜谱进入到菜单列表页面是，单独实现自己的功能，菜单列表页面进行判断是由哪个页面进入的，进而实现相对应的功能，但同时代码量会多。。。。。
2. 多个功能封装写，统一进行管理，switch语句判断由哪个功能而来，实现相对应的功能即可

### 2、关注与取消关注功能

##### 问题描述：

1. 界面需求应为：点击关注，当前界面的收藏加一；点击取消关注，当前收藏减一。关注按钮的状态对应切换

2. 实际效果：点击关注，界面收藏没同步加一，再次进入，关注的会保存。点击取消关注，存在问题，重新进入到界面，多次取消关注，会导致搜藏的数量变为负数。

3. 取消关注时需要对数据库中的views数据进行删除操作，而本地的权限不能直接对数据库进行删除，需调用

   ```
   api.js
   // 初始化
   const db = wx.cloud.database()
   ```

   ```
   关注.js
   
   import Api from "../../utils/api"
   const _ = Api.db.command;
   
   
   // 调用云函数进行删除操作
   wx.cloud.callFunction({
         name: "remove",    //  对应新建一个remove云函数，同步到云端
         data: {
           table: Config.tables.followTable,
           where,
         },
         success: async (res) => {  
           // 更新数据库中 recipr菜谱表中的字段follows  -1
           let updateViews = await Api.updateById(Config.tables.recipeTable, this.data.id, {
             follows: _.inc(-1)
           })
         
           if (updateViews.stats.updated == 1) {
            // 数据库更新成功操作
           }else{
             // 数据库更新失败操作
           }
         }
       })
   ```

   

### 3、热门搜索与近期搜索

**问题描述：**

1. // 热门搜索，根据热度从数据库中请求 有条数限制
2.  // 近期搜索，从本地缓存中获取，所以每搜索一次就需要把搜索的内容插入到本地搜索缓存内容的头部，以此来记录近期搜索

### 4、onShow与onLoad

1. onShow阶段请求的数据需要在页面切换之间频繁请求，onLoad阶段请求的数据只在加载时请求，页面间的切换不会导致重复请求，所以在搜索页面进行请求热门搜索和近期搜索时是在onshow阶段进行的，因为其它页面也会留下搜索记录，改变搜索的数据状态

## 二、技术实现方面



### 1、promise.all()方法的使用

**使用场景：**

- 在菜单列表中，要同时获取到所有菜单发布者的用户信息

  ```
  // 获取菜谱列表的所有发布者用户信息
    async _getPbUsers(openidList) {
    //  openidList: 所有用户的opinenid列表，通过openid作为条件查找对应的用户信息
      /*
       技术难点： promise.all() 方法的理解    
                要在同步中使用异步请求的数据===》如何解决异步请求问题
       */
      //  console.log(openidList,"openidList")
      let pbUsers = []    // 
      openidList.forEach((item) => {
        let res = Api.findByWhere(Config.tables.usersTable, {
          _openid: item.openid
        })
        // console.log(res)   // res返回的是一个promise对象，一个promise对象对应一个用户信息的请求
        pbUsers.push(res)     // 将每一个promise推入到pbUsers中
      })
    //  通过Promise.all()方法，统一对pbUsers进行请求
      let res = await Promise.all(pbUsers)
      // console.log('ressssss', res)  //res返回用户信息数据
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
      // console.log("发布者的用户信息---",this.data.pbUsersInfo)
    },
  ```

- 下面应该使用，但是没使用promise.all()的案例

  ```
    // 获取用户自己关注的菜单信息
    async _getFollow() {
      //  在根据用户标识去关注表中找到用户关注的菜单标识，再根据菜单标识到菜单表中找菜单信息
      let where = {
        _openid: wx.getStorageSync('_openid'),
      }
      let follows = await Api.findAll(Config.tables.followTable,where)
      // console.log('follows',follows)
      let followsRecipeID = follows.data.map(item => {
        return item.recipeID
      })
      // console.log('followsRecipeID,',followsRecipeID)
     let followsRecipeList = []
     
     在这里发生并发请求，但是没有使用promise.all() 处理这种并发请求
      followsRecipeID.forEach( async (item) => {
     
        let followsRecipe = await Api.findByWhere(Config.tables.recipeTable,{_id:item,status: 1})
        
        followsRecipeList.push(followsRecipe.data[0])
      })
  
      this.setData({
        followsRecipeList
      })
      console.log('this.data.followsRecipeList',this.data.followsRecipeList)
    },
      
     虽然followsRecipeList最终都请求回来了，但并不能渲染到页面上 
      
  ```

  

### 2、关于switch语句的使用

- [ ] ```
   if (item.views <= 40) {
       len = Math.ceil(item.views / 10) //以10为一个阶段，  1-10为1星。。。。
    }
    
    if (item.views > 40) {
       len = 5
    }
    
    以上的if判断语句如果换成switch语句怎么转换， switch语句case的结果应该怎么写，下面这种方式不能实现
    
   //  switch(item.views) {
   //   case item.views <= 40 :
   //     len = Math.ceil(item.views/10)   //以10为一个阶段，  1-10为1星。。。。
   //     break
   //   case item.views > 40 :
   //     len = 5
   //   default:
   //       break
   // } 
  ```

### 3、wx中的正则使用

在对菜单内容进行搜索时，使用了正则去匹配搜索内容，wx中部署了正则接口Database.RegExp

https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-sdk-api/database/Database.RegExp.html

```
实际中的使用：对搜索条件进行正则匹配 
const db = wx.cloud.database()   // api.js

 where = {
          status: 1,
          recipeName: Api.db.RegExp({
            regexp: title,
            options: 'i',
          })
        }
```



### 4、调用云函数对数据库进行删除操作

1. 云函数的创建

- 创建后需对云函数进行更新

  ```
  云函数.index.js
  
  // 云函数入口文件
  const cloud = require('wx-server-sdk')
  
  cloud.init({
    env:"zoe-s3ybc"
  })
  let  db = cloud.database({
    env:"zoe-s3ybc" //单独指定数据的环境id
  })
  // 云函数入口函数
  exports.main = async (event, context) => {
    return  db.collection( event.table ).where(event.where).remove()
  }
  ```

2. 云函数的调用

```
 wx.cloud.callFunction({  // 调用云函数删除云端数据库followTable表中对应的关注者信息
        name: "remove",
        data: {
          table: Config.tables.followTable,
          where,
        },
        success: async (res) => {
          console.log('取消关注', res)
          // res.result.stats.removed == 1  
                     === 》成功掉用云函数的返回的字段及值，如没能成功调用云函数，则不会返回该字段及字段值
                     
          if(res.result.stats.removed != 1) return
          
          // 更新 recipr菜谱表中的字段follows  -1
          let updateViews = await Api.updateById(Config.tables.recipeTable, this.data.id, {
            follows: _.inc(-1)
          })
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
    } 
    
```



### 5、数组去重

```
// 去重
      // new set() 数组去重，返回的不是一个真正的数组
      // Array.from()  转换为真正的数组
      let newTypeIds = Array.from(new Set(typeI) ;
```



## 三、bug问题方面

### 1、封装公共函数失败

搜索功能的函数封装失败，原因不明

好像只能使用model

### 2、input的使用

```
//以下情况input不能显示，在wxml中却能到对应的元素

<text>
        <!-- {{recipeDetailInfo.follows}} -->
        <input type="text" value="{{totalFollows}}" disabled 
      style="display:inline-block;position: relative;top: 3px;" 
      bindinput="watchFollows"/>
      人收藏
  </text>
```



### 5、登录功能的实现

涉及的技术：

1. 微信开放能力





## 四、其它易忽略问题

1. 对于菜单列表中项目的删除，不是对数据库进行删除操作，而是通过改该项目在数据库中的状态来决定是否能被接口请求，所以接口请求时需带上这个状态作为查询条件进行查询，这一点忽略会导致将用户已删除的项目也请求回来

























