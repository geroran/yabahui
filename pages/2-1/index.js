Page({
  data: {
    // 游戏状态: idle(闲置), showing(演示中), playing(玩家操作中), success(成功), fail(失败)
    gameState: 'idle',
    timeLeft: 60,
    instructionText: '等待仪式开始...',
    
    // 祭祀步骤数据 (固定顺序)
    // status: '' | 'completed' | 'error'
    steps: [
      { id: 1, name: '点燃香火', icon: '🔥', status: '' },
      { id: 2, name: '敬献酒水', icon: '🍶', status: '' },
      { id: 3, name: '摆放贡品', icon: '🍎', status: '' },
      { id: 4, name: '悬挂经幡', icon: '🚩', status: '' },
      { id: 5, name: '叩拜行礼', icon: '🙇', status: '' }
    ],

    // 当前高亮的ID（用于演示）
    currentHighlightId: null,
    // 玩家当前应该点击第几步（从0开始计数，对应steps数组下标）
    playerTargetIndex: 0
  },

  timerInterval: null,

  onLoad() {
    // 初始化
  },

  onUnload() {
    this.stopTimer();
  },

  // 开始游戏
  startGame() {
    this.resetGameData();
    
    this.setData({
      gameState: 'showing',
      instructionText: '请记住祭祀顺序...'
    });

    // 延迟一点时间让UI渲染完，开始演示顺序
    setTimeout(() => {
      this.playSequenceDemo();
    }, 500);
  },

  // 重置数据
  resetGameData() {
    this.stopTimer();
    const resetSteps = this.data.steps.map(item => ({ ...item, status: '' }));
    this.setData({
      steps: resetSteps,
      timeLeft: 60,
      playerTargetIndex: 0,
      currentHighlightId: null
    });
  },

  // 播放演示动画
  playSequenceDemo() {
    const steps = this.data.steps;
    let index = 0;

    const playNext = () => {
      if (index >= steps.length) {
        // 演示结束，进入玩家操作阶段
        this.setData({
          currentHighlightId: null,
          gameState: 'playing',
          instructionText: '请按刚才的顺序点击下方道具'
        });
        this.startTimer();
        return;
      }

      // 高亮当前步骤
      this.setData({
        currentHighlightId: steps[index].id,
        instructionText: `步骤 ${index + 1}: ${steps[index].name}`
      });

      // 1秒后播放下一个
      setTimeout(() => {
        index++;
        playNext();
      }, 1000); // 调整此数值可改变演示速度
    };

    playNext();
  },

  // 倒计时逻辑
  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.data.timeLeft <= 0) {
        this.handleFail();
        return;
      }
      this.setData({
        timeLeft: this.data.timeLeft - 1
      });
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  // 玩家点击道具
  onActionClick(e) {
    if (this.data.gameState !== 'playing') return;

    const clickedId = e.currentTarget.dataset.id;
    const targetIndex = this.data.playerTargetIndex;
    const targetStep = this.data.steps[targetIndex];

    // 查找被点击项在数组中的索引，用于更新UI
    const clickedItemIndex = this.data.steps.findIndex(item => item.id === clickedId);
    
    // 如果已经点击过的（completed），忽略
    if (this.data.steps[clickedItemIndex].status === 'completed') return;

    // 校验逻辑
    if (clickedId === targetStep.id) {
      // --- 正确 ---
      this.correctFeedback(clickedItemIndex);
      
      const nextIndex = targetIndex + 1;
      
      // 判断是否全部完成
      if (nextIndex >= this.data.steps.length) {
        this.handleSuccess();
      } else {
        this.setData({
          playerTargetIndex: nextIndex,
          instructionText: '正确，继续下一步...'
        });
      }

    } else {
      // --- 错误 ---
      this.wrongFeedback(clickedItemIndex);
    }
  },

  // 正确反馈
  correctFeedback(index) {
    const key = `steps[${index}].status`;
    this.setData({
      [key]: 'completed'
    });
    // 可以加轻微震动
    wx.vibrateShort({ type: 'light' });
  },

  // 错误反馈
  wrongFeedback(index) {
    const key = `steps[${index}].status`;
    
    // 1. 设置错误状态触发动画
    this.setData({
      [key]: 'error',
      instructionText: '顺序有误，再想一想！'
    });
    
    // 长震动提示错误
    wx.vibrateLong();

    // 2. 短暂延迟后移除错误状态，让玩家可以重试（或者保持红色直到重置）
    // 这里设计为闪烁一下恢复原样
    setTimeout(() => {
      this.setData({
        [key]: ''
      });
    }, 500);
  },

  // 游戏成功
  handleSuccess() {
    this.stopTimer();
    this.setData({
      gameState: 'success',
      instructionText: '祭祀完成'
    });
  },

  // 游戏失败
  handleFail() {
    this.stopTimer();
    this.setData({
      gameState: 'fail',
      instructionText: '时间耗尽或仪式中断'
    });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  }
});
