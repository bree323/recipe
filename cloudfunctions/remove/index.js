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




