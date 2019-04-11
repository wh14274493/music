var app = getApp();
var bsurl = require('../../utils/url.js');
var common = require('../../utils/util.js');
Page({
  data: {
    rec: {},
    main: {},
    loading: true,
    limit: 20,
    offset: 0,
    recid: 0,
    songId: null,
    commentId: null,
    commentCount:null,
    xi: "../../static/image/xi.png",
    xg: "../../static/image/xg.png"
  },
  onLoad: function(options) {
    var id = options.id;
    //   fromtype = options.from,
    //   that = this;
    this.setData({
      songId: id
    });
    // var type = (fromtype == 'song') ? '' : 1;
    // common.loadrec(app.globalData.cookie, this.data.offset, this.data.limit, id, function(data) {
    //   that.setData({
    //     loading: false,
    //     rec: data,
    //     loading: false,
    //     type: type,
    //     offset: data.comments ? data.comments.length : 0
    //   });
    //   wx.setNavigationBarTitle({
    //     title: '评论(' + (data.total || 0) + ")"
    //   })
    // }, type)

  },
  onShow: function() {
    this.getRecommendList();
  },
  getRecommendList: function(){
    var _this = this;
    var songId = this.data.songId;
    var token = wx.getStorageSync('login_token');
    console.log('token:' + token);
    wx.request({
      url: bsurl + 'songComment/' + token,
      data: {
        songId: songId
      },
      success: function (res) {
        if (res.data.resultCode == -1) {
          wx.showModal({
            title: '提示',
            content: '请授权登录后重试',
            success(res) {
              if (res.confirm) {
                wx.switchTab({
                  url: '../my/my'
                })
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
          return;
        }
        console.log("成功获取评论列表：" + JSON.stringify(res));
        _this.setData({
          rec: res.data.data,
          loading: false
        });
      }
    })
  },
  onPullDownRefresh: function() {
    wx.stopPullDownRefresh();
  },
  onReachBottom: function() {
    if (this.data.rec.more && !this.data.loading) {
      var that = this;
      this.setData({
        loading: true
      })
      common.loadrec(app.globalData.cookie, this.data.offset, this.data.limit, this.data.recid, function(data) {
        var rec = that.data.rec;
        var offset = that.data.offset + (data.comments || []).length
        data.comments = rec.comments.concat(data.comments);
        data.hotComments = rec.hotComments;
        that.setData({
          loading: false,
          rec: data,
          loading: false,
          offset: offset
        });
      }, this.data.type)
    }
  },
  send: function(e) {
    console.log(e.detail.value);
    var _this = this;
    var songId = this.data.songId;
    var token = wx.getStorageSync('login_token');
    console.log('token:' + token);
    wx.request({
      url: bsurl + 'addComment/' + token + "/",
      data: {
        id: songId,
        content: e.detail.value
      },
      success: function(res) {
        wx.showToast({
          title: '成功',
          icon: 'success',
          duration: 1000
        })
        _this.getRecommendList();
      }
    })
  },
  commentlike: function(e) {
    var _this = this;
    var index = e.currentTarget.dataset.cindex;
    var type = e.currentTarget.dataset.ctype==true?2:1;
    var uid = e.currentTarget.dataset.cid;
    // var songId = this.data.songId;
    var token = wx.getStorageSync('login_token');
    console.log('token:' + token);
    wx.request({
      url: bsurl + 'likeComment/' + token + "/",
      data: {
        uid: uid,
        type: type
      },
      success: function(res) {
        console.log("点赞结果："+JSON.stringify(res));
        var data = _this.data.rec;
        var comment = data.comments;
        comment[index].likedCount = res.data.data.likedCount;
        var currentUserLike = false;
        if(type==1){
          currentUserLike = true;
        }else{
          currentUserLike = false;
        }
        comment[index].currentUserLike = currentUserLike;
        _this.setData({
          rec:data
        })
      }
    })
  }

})