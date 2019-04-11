var bsurl = require('url.js');
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10);
      break;
    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
      break;
    default:
      return 0;
      break;
  }
}

//评论内容emoji表情转换
function emoji(str) {
  if (!str) return;
  var bl = {
    "大笑": "86",
    "可爱": "85",
    "憨笑": "359",
    "色": "95",
    "亲亲": "363",
    "惊恐": "96",
    "流泪": "356",
    "亲": "362",
    "呆": "352",
    "哀伤": "342",
    "呲牙": "343",
    "吐舌": "348",
    "撇嘴": "353",
    "怒": "361",
    "奸笑": "341",
    "汗": "97",
    "痛苦": "346",
    "惶恐": "354",
    "生病": "350",
    "口罩": "351",
    "大哭": "357",
    "晕": "355",
    "发怒": "115",
    "开心": "360",
    "鬼脸": "94",
    "皱眉": "87",
    "流感": "358",
    "爱心": "33",
    "心碎": "34",
    "钟情": "303",
    "星星": "309",
    "生气": "314",
    "便便": "89",
    "强": "13",
    "弱": "372",
    "拜": "14",
    "牵手": "379",
    "跳舞": "380",
    "禁止": "374",
    "这边": "262",
    "爱意": "106",
    "示爱": "376",
    "嘴唇": "367",
    "狗": "81",
    "猫": "78",
    "猪": "100",
    "兔子": "459",
    "小鸡": "450",
    "公鸡": "461",
    "幽灵": "116",
    "圣诞": "411",
    "外星": "101",
    "钻石": "52",
    "礼物": "107",
    "男孩": "0",
    "女孩": "1",
    "蛋糕": "337",
    18: "186",
    "圈": "312",
    "叉": "313"
  }
  var emojiObjs = [];
  str = str.replace(/\[([^\[\]]+)\]/g, ':$1:')
  var eReg = new RegExp("[:]");
  var array = str.split(eReg);
  for (var i = 0; i < array.length; i++) {
    var ele = array[i];
    var emojiObj = {};
    if (bl[ele]) {
      emojiObj.node = "element";
      emojiObj.tag = "emoji";
      emojiObj.text = bl[ele];
    } else {
      emojiObj.node = "text";
      emojiObj.text = ele;
    }
    emojiObjs.push(emojiObj);
  }

  return emojiObjs;
}

//加载评论1为单曲，2歌单类，3专辑,
function loadrec(cookie, offset, limit, id, cb, type) {
  wx.request({
    url: bsurl + 'comments',
    data: {
      id: (type == 1 ? '' : (type == 3 ? 'A_DJ_1_' : 'R_SO_4_')) + id,
      limit: limit,
      offset: offset,
      cookie: cookie
    },
    success: function(res) {
      var data = res.data;
      for (let i in data.hotComments) {
        data.hotComments[i].time = formatTime(data.hotComments[i].time, 2);
        data.hotComments[i].content = emoji(data.hotComments[i].content)
        if (data.hotComments[i].beReplied[0]) {
          data.hotComments[i].beReplied[0].content = emoji(data.hotComments[i].beReplied[0].content)
        }
      }
      for (let i in data.comments) {
        data.comments[i].time = formatTime(data.comments[i].time, 2);
        data.comments[i].content = emoji(data.comments[i].content)
        if (data.comments[i].beReplied[0]) {
          data.comments[i].beReplied[0].content = emoji(data.comments[i].beReplied[0].content)
        }
      };
      cb && cb(data)
    }
  })
}

module.exports = {
  formatTime: formatTime,
  randomNum: randomNum,
  loadrec: loadrec
}