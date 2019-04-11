const app = getApp()
const context_path = require('../../utils/url.js')
const TEN_MINUTES = 600000

Page({
  data: {
    userInfo: null,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  onLoad: function() {
    // 查看是否授权
    wx.getSetting({
      success(res) {
        wx.getUserInfo({
          success(res) {
            console.log(res.userInfo)
          }
        });
      }
    })

  },
  login: function() {
    var _this = this;
    wx.login({
      success(res) {
        if (res.code) {
          console.log("成功获取登录凭证：" + res.code);
          var userInfo = _this.data.userInfo;
          userInfo["code"] = res.code;
          console.log("用户信息：" + JSON.stringify(userInfo));
          wx.request({
            url: context_path + 'login',
            data: userInfo,
            success: function(res) {
              if (res.data.resultCode == 0) {
                wx.showToast({
                  title: '授权成功',
                  icon: 'success',
                  duration: 2000
                })
              } else {
                wx.showToast({
                  title: '授权失败，请稍后重试',
                  icon: 'none',
                  duration: 2000
                })
              }
              console.log("获取登录token：" + JSON.stringify(res));
              wx.setStorageSync('login_token', res.data.data.token);
            }
          })
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }
    })
  },
  toLike: function() {
    var token = wx.getStorageSync('login_token');
    console.log('token' + token);
    wx.request({
      url: context_path + 'listCollect/' + token + "/",
      data: {},
      success: function(res) {
        console.log('收藏结果：' + JSON.stringify(res));
        wx.setStorageSync("like_list", res.data.data);
      }
    });
    wx.navigateTo({
      url: '/pages/my-song-list/my-song-list?type=1'
    })
  },
  toRencent: function() {
    wx.navigateTo({
      url: '/pages/my-song-list/my-song-list?type=2'
    })
  },
  bindGetUserInfo: function(e) {
    console.log(e.detail.userInfo)
    this.setData({
      userInfo: e.detail.userInfo
    });
    this.login();
  }
})