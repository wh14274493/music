const app = getApp().globalData
const api = require('../../utils/api.js')
const song = require('../../utils/song.js')
Page({
  onLoad: function(option) {
    console.log("接受页面传递参数：" + JSON.stringify(option));
    this._getTopMusicList(option.type)
  },
  _getTopMusicList: function(e) {
    var list;
    if (e == 1) { //我喜欢的
      list = wx.getStorageSync('like_list');
      console.log("获取收藏列表：" + JSON.stringify(list));
      this.setData({
        topList: list,
        title: '我的收藏'
      })
    } else { //最近播放
      list = wx.getStorageSync('recent');
      console.log("获取最近播放列表：" + JSON.stringify(list));
      this.setData({
        topList: list,
        title: '最近播放'
      })
    }
  }
})