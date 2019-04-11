const app = getApp().globalData
const song = require('../../utils/song.js')
const Lyric = require('../../utils/lyric.js')
const util = require('../../utils/util.js')
const context_path = require('../../utils/url.js')

const SEQUENCE_MODE = 1
const RANDOM_MOD = 2
const SINGLE_CYCLE_MOD = 3

Page({
  data: {
    playurl: '',
    playIcon: 'icon-play',
    cdCls: 'pause',
    currentLyric: null,
    currentLineNum: 0,
    toLineNum: -1,
    currentSong: null,
    dotsArray: new Array(2),
    currentDot: 0,
    playMod: SEQUENCE_MODE,
    favorite: 2,
    recent: 2,
    uid: null
  },

  onShow: function() {
    this._init();
    this._isFavorite();
  },

  _isFavorite: function() {
    let _this = this;
    var token = wx.getStorageSync('login_token');
    console.log('token' + token);
    wx.request({
      url: context_path + 'songIsCollect/' + token + "/",
      data: {
        'id': this.data.currentSong.id
      },
      success: function(res) {
        console.log("当前歌曲是否已收藏：" + JSON.stringify(res));
        var favorite = res.data.resultCode == 0 ? 1 : 2;
        _this.setData({
          favorite: favorite
        });
      }
    });
  },

  //初始化
  _init: function() {
    this.setData({
      recent: 2
    })
    let songslist = (app.songlist.length && app.songlist) || wx.getStorageSync('songlist')
    let currentSong = app.songlist[app.currentIndex] || (songslist && songslist[app.currentIndex])
    console.log("当前正在播放歌曲信息：" + JSON.stringify(currentSong));
    var recent = wx.getStorageSync('recent');
    if (recent == null || recent == '' || recent == undefined) {
      recent = [];
    }
    console.log(JSON.stringify("最近播放列表：" + recent));
    for (var i = 0; i < recent.length; i++) {
      if (recent[i].id == currentSong.id) {
        this.setData({
          recent: 1
        })
      }
    }
    if (this.data.recent == 2) {
      recent.push(currentSong);
      wx.setStorageSync('recent', recent);
      console.log("添加到最近播放列表...");
    }
    let duration = currentSong && currentSong.duration

    this.setData({
      currentSong: currentSong,
      duration: this._formatTime(duration),
      songslist: songslist,
      currentIndex: app.currentIndex
    })

    this._getPlayUrl(currentSong.mid)
    this._getLyric(currentSong)
  },

  // 获取背景播放音乐的songmidid
  _getBackPlayfileName: function() {
    return new Promise((resolve, reject) => {
      wx.getBackgroundAudioPlayerState({
        success: function(res) {
          var dataUrl = res.dataUrl
          let ret = dataUrl && dataUrl.split('?')[0].split('/')[3]
          resolve({
            ret,
            res
          })
        },
        fail: function(e) {
          let ret = false
          reject(ret)
        }
      })
    })
  },

  // 获取播放地址
  _getPlayUrl: function(songmidid) {
    const _this = this
    wx.request({
      url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&hostUin=0&loginUin=0&platform=yqq&needNewCode=0&cid=205361747&uin=0&filename=C400${songmidid}.m4a&guid=3913883408&songmid=${songmidid}&callback=callback`,
      data: {
        g_tk: 5381,
        inCharset: 'utf-8',
        outCharset: 'utf-8',
        notice: 0,
        format: 'jsonp',
        hostUin: 0,
        loginUin: 0,
        platform: 'yqq',
        needNewCode: 0,
        cid: 205361747,
        uin: 0,
        filename: `C400${songmidid}.m4a`,
        guid: 3913883408,
        songmid: songmidid,
        callback: 'callback',
      },
      success: function(res) {
        var res1 = res.data.replace("callback(", "")
        var res2 = JSON.parse(res1.substring(0, res1.length - 1))
        const playUrl = `http://dl.stream.qqmusic.qq.com/${res2.data.items[0].filename}?vkey=${res2.data.items[0].vkey}&guid=3913883408&uin=0&fromtag=66`
        _this._getBackPlayfileName().then((nowPlay) => {
          if (!(res2.data.items[0].filename === nowPlay.ret)) {
            _this._createAudio(playUrl)
          }
        }).catch((err) => {
          _this._createAudio(playUrl)
        })
      }
    })
  },

  // 创建播放器
  _createAudio: function(playUrl) {
    wx.playBackgroundAudio({
      dataUrl: playUrl,
      title: this.data.currentSong.name,
      coverImgUrl: this.data.currentSong.image
    })
    // 监听音乐播放。
    wx.onBackgroundAudioPlay(() => {
      this.setData({
        playIcon: 'icon-pause',
        cdCls: 'play'
      })
    })
    // 监听音乐暂停。
    wx.onBackgroundAudioPause(() => {
      this.setData({
        playIcon: 'icon-play',
        cdCls: 'pause'
      })
    })
    // 监听音乐停止。
    wx.onBackgroundAudioStop(() => {
      if (this.data.playMod === SINGLE_CYCLE_MOD) {
        this._init()
        return
      }
      this.next()
    })
    // 监听播放拿取播放进度
    const manage = wx.getBackgroundAudioManager()
    manage.onTimeUpdate(() => {
      //进度条点击开始的x轴坐标值
      var start = this.data.start;
      //进度条点击结束的x轴坐标值
      var end = this.data.end;
      //进度条的宽度
      var barWidth = this.data.barWidth;
      var currentTime = manage.currentTime
      var dist=end-start;
      if(dist!=0){
        console.log("move_start:" + start);
        console.log("move_end:" + end);
        console.log("dist:" + dist);
        //进度条拖动以后重新计算当前播放时间
        currentTime = currentTime * (1 + dist / barWidth);
        console.log("currentTime:" + currentTime);
        //将播放器的进度切换到拖动的位置
        wx.seekBackgroundAudio({
          position: currentTime
        });
        //值重置
        this.setData({
          start:0,
          end:0
        })
      }
      var percent = currentTime / this.data.currentSong.duration;
      this.setData({
        currentTime: this._formatTime(currentTime),
        percent: percent
      });
      
      if (this.data.currentLyric) {
        this.handleLyric(currentTime * 1000)
      }
    })
  },
  // 获取歌词
  _getLyric: function(currentSong) {
    const _this = this
    this._getBackPlayfileName().then((res) => {
      const nowMid = res.ret.split('.')[0].replace('C400', '')
      if (!(nowMid === currentSong.mid)) {
        if (this.data.currentLyric) {
          //this.data.currentLyric.stop && this.data.currentLyric.stop()
        }
        _this._getLyricAction(currentSong)
      }
    }).catch(() => {
      _this._getLyricAction(currentSong)
    })
  },

  // 获取处理歌词
  _getLyricAction: function(currentSong) {
    song.getLyric(currentSong.mid).then((res) => {
      if (res.data.showapi_res_body.ret_code == 0) {
        const lyric = this._normalizeLyric(res.data.showapi_res_body.lyric)
        const currentLyric = new Lyric(lyric)
        this.setData({
          currentLyric: currentLyric
        })
      } else {
        this.setData({
          currentLyric: null,
          currentText: ''
        })
      }
    })
  },
  // 去掉歌词中的转义字符
  _normalizeLyric: function(lyric) {
    return lyric.replace(/&#58;/g, ':').replace(/&#10;/g, '\n').replace(/&#46;/g, '.').replace(/&#32;/g, ' ').replace(/&#45;/g, '-').replace(/&#40;/g, '(').replace(/&#41;/g, ')')
  },
  // 歌词滚动回调函数
  handleLyric: function(currentTime) {
    let lines = [{
        time: 0,
        txt: ''
      }],
      lyric = this.data.currentLyric,
      lineNum
    lines = lines.concat(lyric.lines)
    for (let i = 0; i < lines.length; i++) {
      if (i < lines.length - 1) {
        let time1 = lines[i].time,
          time2 = lines[i + 1].time
        if (currentTime > time1 && currentTime < time2) {
          lineNum = i - 1
          break;
        }
      } else {
        lineNum = lines.length - 2
      }
    }
    this.setData({
      currentLineNum: lineNum,
      currentText: lines[lineNum + 1] && lines[lineNum + 1].txt
    })

    let toLineNum = lineNum - 5
    if (lineNum > 5 && toLineNum != this.data.toLineNum) {
      this.setData({
        toLineNum: toLineNum
      })
    }
  },
  _formatTime: function(interval) {
    interval = interval | 0
    const minute = interval / 60 | 0
    const second = this._pad(interval % 60)
    return `${minute}:${second}`
  },
  /*秒前边加0*/
  _pad(num, n = 2) {
    let len = num.toString().length
    while (len < n) {
      num = '0' + num
      len++
    }
    return num
  },
  changeMod: function() {
    let playMod = this.data.playMod + 1
    if (playMod > SINGLE_CYCLE_MOD) {
      playMod = SEQUENCE_MODE
    }
    this.setData({
      playMod: playMod
    })
  },
  prev: function() {
    app.currentIndex = this.getNextIndex(false)
    this._init()
    this._isFavorite();
  },
  next: function() {
    app.currentIndex = this.getNextIndex(true)
    this._init()
    this._isFavorite();
  },
  /**
   * 获取不同播放模式下的下一曲索引
   * @param nextFlag: next or prev
   * @returns currentIndex
   */
  getNextIndex: function(nextFlag) {
    let ret,
      currentIndex = app.currentIndex,
      mod = this.data.playMod,
      len = this.data.songslist.length
    if (mod === RANDOM_MOD) {
      ret = util.randomNum(len)
    } else {
      if (nextFlag) {
        ret = currentIndex + 1 == len ? 0 : currentIndex + 1
      } else {
        ret = currentIndex - 1 < 0 ? len - 1 : currentIndex - 1
      }
    }
    return ret
  },
  togglePlaying: function() {
    wx.getBackgroundAudioPlayerState({
      success: function(res) {
        var status = res.status
        if (status == 1) {
          wx.pauseBackgroundAudio()
        } else {
          wx.playBackgroundAudio()
        }
      }
    })
  },
  openList: function() {
    if (!this.data.songslist.length) {
      return
    }
    this.setData({
      translateCls: 'uptranslate'
    })
  },
  close: function() {
    this.setData({
      translateCls: 'downtranslate'
    })
  },
  playthis: function(e) {
    const index = e.currentTarget.dataset.index
    app.currentIndex = index
    this._init()
    this.close()
  },
  changeDot: function(e) {
    this.setData({
      currentDot: e.detail.current
    })
  },
  doFavorite: function() {
    let _this = this;
    // var favorite = this.data.favorite == 1 ? 2 : 1;
    var current_song = _this.data.currentSong;
    console.log("---------- " + JSON.stringify(current_song));
    var token = wx.getStorageSync('login_token');
    console.log('token' + token);

    wx.request({
      url: context_path + 'collectSong/' + token + "/",
      data: current_song,
      success: function(res) {
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
        console.log('收藏结果：' + JSON.stringify(res));
        var favorite = res.data.resultCode == 1 ? 2 : 1;
        _this.setData({
          favorite: favorite
        });
      }
    })
  },
  doComment: function() {
    let _this = this;
    console.log(_this.data.currentSong.id);
    wx.navigateTo({
      url: '../recommend/index?id=' + _this.data.currentSong.id,
    });
  },
  startChange(e) {
    const start = e.detail;
    this.setData({
      start: start,
      end: start
    })
    // console.log(start);
  },
  endChange(e) {
    const end = e.detail;
    this.setData({
      end: end
    })
    // console.log(end);
  },
  barWidthChange(e) {
    const barWidth = e.detail;
    this.setData({
      barWidth: barWidth
    })
    // console.log(barWidth);
  }
})