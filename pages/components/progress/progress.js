Component({
  data: {
    width: 0
  },
  properties: {
    percent: {
      value: 0,
      type: Number,
      observer: function (oldVal, newVal) {
        // console.log(this.data.currentTime)
        this.updateProgress(newVal)
      }
    }
  },
  ready: function () {
    wx.createSelectorQuery().in(this).select('#progressBar').boundingClientRect(function (rect) {
      console.log("rect" + JSON.stringify(rect));
      rect.width   // 节点的宽度
    }).exec((res) => {
      this.setData({
        barWidth: res[0].width
      })
    })
  },
  methods: {
    updateProgress: function (percent) {
      const barWidth = this.data.barWidth
      this.setData({
        width: barWidth * percent
      })
      this.triggerEvent('barWidthChange', barWidth);
    },
    progressTouchStart:function(e){
      // console.log(JSON.stringify(e.changedTouches[0].pageX));
      this.data.start = e.changedTouches[0].pageX;
      // console.log(this.data.start)

      this.triggerEvent('startChange', this.data.start);
    },
    progressTouchMove: function (e) {
      // console.log(JSON.stringify(e));
      //this.data.pageX= e.changedTouches[0].pageX;
      // console.log(this.data.start)

      //this.triggerEvent('moveChange', this.data.pageX);
    },
    progressTouchEnd: function (e) {
      console.log(JSON.stringify(e));
      this.data.end = e.changedTouches[0].pageX;
      // console.log(this.data.end)
      this.triggerEvent('endChange', this.data.end);
    }
  }
})