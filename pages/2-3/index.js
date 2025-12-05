Page({
  data: {
    gameState: 'opening', // opening, puzzle, rhythm, resource, ending
  },

  onLoad(options) {
    // 预加载音效等资源
  },

  // 点击屏幕处理
  handleTap() {
    if (this.data.gameState === 'opening') {
      this.startGame();
    }
  },

  // 开始游戏，进入下一阶段
  startGame() {
    wx.showToast({
      title: '即将进入解谜阶段',
      icon: 'none'
    });

    // TODO: 切换到解谜阶段
    // this.setData({ gameState: 'puzzle' });
  }
})
