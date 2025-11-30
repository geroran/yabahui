Page({
  data: {
    // 游戏状态: idle(闲置), showing(演示中), playing(玩家操作中), success(成功), fail(失败)
    gameState: 'idle',
    timeLeft: 60,
    instructionText: '神树守护着七宣村。请按祭祀顺序，完成对神树的敬拜。',

    // 祭祀步骤数据
    steps: [
      { id: 1, name: '点燃香火', icon: './images/点燃香火.webp', status: '' },
      { id: 2, name: '敬献酒水', icon: './images/敬献酒水.webp', status: '' },
      { id: 3, name: '摆放贡品', icon: './images/摆放贡品.webp', status: '' },
      { id: 4, name: '悬挂经幡', icon: './images/悬挂经幡.webp', status: '' },
      { id: 5, name: '叩拜行礼', icon: './images/叩拜行礼.webp', status: '' }
    ],

    // 步骤对应的文案
    stepTexts: {
      1: '香火已点亮，心愿随烟升腾。',
      2: '举樽敬神，分享敬意与祝福。',
      3: '贡品已呈上，感念自然与祖灵。',
      4: '经幡随风起，愿祈福随风远行。',
      5: '叩拜已成，敬意传达于天地。'
    },

    // 当前高亮的ID（用于演示和操作反馈）
    currentHighlightId: null,
    // 玩家当前应该点击第几步（从0开始计数）
    playerTargetIndex: 0,
    // 演示模式下的临时索引，用于控制背景图演示
    demoIndex: 0,
    // 氛围滤镜类名: 'warm', 'holy', 'dark', ''
    moodClass: '',
    // 飞入动画对象: { src, x, y }
    flyingItem: null
  },

  onUnload() {
    this.stopTimer();
  },

  // 开始游戏
  startGame() {
    this.resetGameData();

    this.setData({
      gameState: 'showing',
      instructionText: '请仔细观察祭祀顺序...'
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
      currentHighlightId: null,
      currentHighlightId: null,
      demoIndex: 0,
      demoIndex: 0,
      moodClass: '',
      flyingItem: null,
      instructionText: '神树守护着七宣村。请按祭祀顺序，完成对神树的敬拜。'
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
          demoIndex: 0,
          gameState: 'playing',
          instructionText: '请按刚才的顺序点击顶部道具'
        });
        this.startTimer();
        return;
      }

      // 高亮当前步骤，并切换背景图演示
      this.setData({
        currentHighlightId: steps[index].id,
        demoIndex: index + 1,
        instructionText: `步骤 ${index + 1}: ${steps[index].name}`,
        moodClass: index === 0 ? 'warm' : (index === 4 ? 'holy' : '')
      });

      // 1.5秒后播放下一个
      setTimeout(() => {
        index++;
        playNext();
      }, 1500);
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

    // 查找被点击项在数组中的索引
    const clickedItemIndex = this.data.steps.findIndex(item => item.id === clickedId);

    // 如果已经点击过的（completed），忽略
    if (this.data.steps[clickedItemIndex].status === 'completed') return;

    // 校验逻辑
    if (clickedId === targetStep.id) {
      // --- 正确 ---
      // 1. 触发飞入动画
      this.triggerFlyAnimation(e, targetStep.icon);

      // 2. 触发反馈
      this.correctFeedback(clickedItemIndex, clickedId);

      const nextIndex = targetIndex + 1;

      // 判断是否全部完成
      if (nextIndex >= this.data.steps.length) {
        // 即使完成了也要更新索引，以便显示最后一张背景图
        this.setData({
          playerTargetIndex: nextIndex
        });

        // 延迟5秒显示成功弹窗
        setTimeout(() => {
          this.handleSuccess();
        }, 5000);
      } else {
        this.setData({
          playerTargetIndex: nextIndex
        });
      }

    } else {
      // --- 错误 ---
      this.wrongFeedback(clickedItemIndex);
    }
  },

  // 正确反馈
  correctFeedback(index, id) {
    const key = `steps[${index}].status`;
    const successText = this.data.stepTexts[id] || '操作成功';

    this.setData({
      [key]: 'completed',
      [key]: 'completed',
      instructionText: successText,
      moodClass: id === 1 ? 'warm' : (id === 5 ? 'holy' : '')
    });
    wx.vibrateShort({ type: 'light' });
  },

  // 错误反馈
  wrongFeedback(index) {
    const key = `steps[${index}].status`;

    this.setData({
      [key]: 'error',
      instructionText: '顺序有误，请再回想一下神树的指引。'
    });

    wx.vibrateLong();

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
      moodClass: 'holy',
      instructionText: '祭礼完成。神树聆听了你的祈愿，祝福将随山风而来。'
    });
  },

  // 游戏失败
  handleFail() {
    this.stopTimer();
    this.setData({
      gameState: 'fail',
      gameState: 'fail',
      moodClass: 'dark',
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
  },

  // 触发飞入动画
  triggerFlyAnimation(e, iconSrc) {
    const { clientX, clientY } = e.changedTouches[0] || e.detail;

    this.setData({
      flyingItem: {
        src: iconSrc,
        x: clientX - 40, // 居中修正 (80/2)
        y: clientY - 40
      }
    });

    // 动画结束后清除
    setTimeout(() => {
      this.setData({ flyingItem: null });
    }, 1200);
  }
});
