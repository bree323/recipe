 // 点击热门推荐或者搜素时    跳转到菜谱列表页面 recipelist
const _goRecipelistPage = function _goRecipelistPage(e) {
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
}

export default {
  _goRecipelistPage
}