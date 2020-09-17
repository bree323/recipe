// 封装api

// 初始化
const db = wx.cloud.database()

// 一、云函数的sdk
// 1、插入add
let add = (collectionName, data = {}) => {
  // collectionName ： 要操作的数据库表名
  // 返回promise对象
  return db.collection(collectionName).add({
    // data 字段表示需新增的 JSON 数据
    data
  })
}

// 2、查找find
// 2.1 查找单条
// collectionName,where={},limit=5,page=1,orderBy={field:"_id",sort:"desc"}

let findByWhere = async (collectionName, where = {}, limit = 5, page = 1, orderBy = {
  field: "_id",
  sort: "desc"
}) => {
  // limit : 单次请求获取限制条数
  //  skip  跳过几个
  let skip = (page - 1) * limit
  return await db.collection(collectionName).where(where).limit(limit).skip(skip).orderBy(orderBy.field, orderBy.sort).get()
}
// 2.2根据id查找多条
const findById = (collectionName, id = "") => {
  return db.collection(collectionName).doc(id).get();
}
// 2.3 根据条件查找多条
let findAll = async (collectionName, where = {}, orderBy = {
  field: "_id",
  sort: "desc"
}) => {
  // 微信小程序单次最多只能查询20条  要查出所有符合条件的的就得分批次多次查询
  const MAX_LIMIT = 20
  // 先取出集合记录总数
  const countResult = await db.collection(collectionName).count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  // 分批获取数据
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection(collectionName).where(where).skip(i * MAX_LIMIT).limit(MAX_LIMIT).orderBy(orderBy.field, orderBy.sort).get()
    tasks.push(promise)
  }
  // 当没有数据的时候。直接返回一个和有数据相同数据结构的对象，只不过返回的data是一个空的数组
  if ((await Promise.all(tasks)).length <= 0) {
    // 没有数据的
    return {
      data: []
    };
  }
  // 等待所有
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg,
    }
  })
}

// 2.4根据条件进行查询(分页)
const find = (collectionName, where = {}, limit = 5, page = 1, orderBy = {
  field: "_id",
  sort: "desc"
}) => {
  //  skip  跳过几个
  // limit  每页获取几个
  let skip = (page - 1) * limit;
  return db.collection(collectionName).where(where).skip(skip).limit(limit).orderBy(orderBy.field, orderBy.sort).get();
}

// 3、更改update
// let updateById = async (collectionName, id='',data={}) => {
//   return await db.collection(collectionName).doc(id).update({data})
// } 
const updateById = (collectionName, id = "", data = {}) => {
  return db.collection(collectionName).doc(id).update({
    data
  })
}
let upateByWhere = async (collectionName, where = {}, data = {}) => {
  return await db.collection(collectionName).where(where).update({
    data
  })
}
// 4、删除remove  根据id删除
let removeById = async (collectionName, id = '') => {
  return await db.collection(collectionName).doc(id).remove()
}
let removeByWhere = async (collectionName, menuTypeName = '') => {
  return await db.collection(collectionName).where({
    menuTypeName
  }).remove()
}

export default {
  db,
  add,
  findByWhere,
  findById,
  findAll,
  find,
  removeById,
  removeByWhere,
  updateById,
  upateByWhere
}