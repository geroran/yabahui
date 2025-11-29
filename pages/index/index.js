Page({
  data: {},

  // 跳转到关卡一：祭拜神树
  goToGame1() {
    wx.navigateTo({
      url: '/pages/2-1/index',
    })
  },

  // 跳转到关卡二：恭请大哑巴
  goToGame2() {
    wx.navigateTo({
      url: '/pages/2-2/index',
    })
  },

  onLoad() {},

  onShow() {},
})
