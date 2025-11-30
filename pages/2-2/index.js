Page({
  data: {
    gameState: 'start', // start, showing, playing, success, fail
    timeLeft: 120,
    instructionText: '神树守护着七宣村。请按祭祀顺序，完成对大哑巴的装扮。',

    // 当前显示的背景图索引
    // 0: 初始, 1-3: 步骤1的三张图, 4: 步骤2, 5: 步骤3, 6-7: 步骤4的两张图
    currentImageIndex: 0,

    // 道具列表
    items: [
      {
        id: 'dragonPaint',
        name: '龙纹彩绘',
        desc: '龙纹象征雨水与保护',
        icon: './images/彩绘按钮.webp',
        isEquipped: false
      },
      {
        id: 'cowHead',
        name: '牛皮头饰',
        desc: '牛象征农耕与力量',
        icon: './images/牛角头饰按钮.webp',
        isEquipped: false
      },
      {
        id: 'feather',
        name: '野鸡羽毛',
        desc: '羽毛代表吉祥与活力',
        icon: './images/羽毛头饰按钮.webp',
        isEquipped: false
      },
      {
        id: 'magicTool',
        name: '法器手持',
        desc: '法器用于驱邪祈福',
        icon: './images/法器按钮.webp',
        isEquipped: false
      }
    ],

    // 步骤对应的文案
    stepTexts: {
      dragonPaint: '龙纹彩绘完成，祈求风调雨顺。',
      cowHead: '牛角头饰已戴，象征力量与丰收。',
      feather: '羽毛装饰就位，展现神圣威仪。',
      magicTool: '法器在手，驱邪祈福之力已备。'
    },

    // 正确的装扮顺序
    correctOrder: ['dragonPaint', 'cowHead', 'feather', 'magicTool'],

    // 当前应该装备的步骤索引
    currentStepIndex: 0,

    // 当前高亮的道具ID（用于演示）
    currentHighlightId: null,

    // 氛围滤镜类名
    moodClass: '',

    // 飞入动画对象
    flyingItem: null
  },

  timer: null,
  typewriterTimer: null,

  onUnload() {
    this.stopTimer();
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
    }
  },

  // 开始游戏
  startGame() {
    this.resetGameData();

    this.setData({
      gameState: 'showing'
    });
    this.updateInstruction('请仔细观察装扮顺序...');

    // 延迟后开始演示顺序
    setTimeout(() => {
      this.playSequenceDemo();
    }, 500);
  },

  // 重置数据
  resetGameData() {
    this.stopTimer();
    const resetItems = this.data.items.map(item => ({ ...item, isEquipped: false }));

    this.setData({
      items: resetItems,
      timeLeft: 120,
      currentStepIndex: 0,
      currentImageIndex: 0,
      currentHighlightId: null,
      moodClass: '',
      flyingItem: null
    });
    this.updateInstruction('神树守护着七宣村。请按祭祀顺序，完成对大哑巴的装扮。');
  },

  // 播放演示动画
  playSequenceDemo() {
    const steps = this.data.correctOrder;
    let index = 0;

    const playNext = () => {
      if (index >= steps.length) {
        // 演示结束，进入玩家操作阶段
        this.setData({
          currentHighlightId: null,
          currentImageIndex: 0,
          gameState: 'playing'
        });
        this.updateInstruction('请按刚才的顺序点击顶部道具');
        this.startTimer();
        return;
      }

      // 高亮当前步骤
      this.setData({
        currentHighlightId: steps[index]
      });
      this.updateInstruction(`步骤 ${index + 1}: ${this.data.items[index].name}`);

      // 切换对应的背景图
      this.switchBackgroundForStep(index, true);

      // 3秒后播放下一个
      setTimeout(() => {
        index++;
        playNext();
      }, 3000);
    };

    playNext();
  },

  // 根据步骤切换背景图（支持多图切换）
  switchBackgroundForStep(stepIndex, isDemo = false) {
    const imageIndexMap = {
      0: [1, 2, 3], // 步骤1: 三张图
      1: [4],       // 步骤2: 一张图
      2: [5],       // 步骤3: 一张图
      3: [6, 7]     // 步骤4: 两张图
    };

    const images = imageIndexMap[stepIndex];
    if (!images || images.length === 0) return;

    let imageIdx = 0;
    const switchNext = () => {
      if (imageIdx >= images.length) return;

      this.setData({
        currentImageIndex: images[imageIdx]
      });

      imageIdx++;
      if (imageIdx < images.length) {
        setTimeout(switchNext, 800);
      }
    };

    switchNext();
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
  onItemClick(e) {
    if (this.data.gameState !== 'playing') return;

    const clickedId = e.currentTarget.dataset.id;
    const currentIndex = this.data.currentStepIndex;
    const correctId = this.data.correctOrder[currentIndex];

    // 查找点击的物品索引
    const itemIndex = this.data.items.findIndex(item => item.id === clickedId);

    // 如果已装备，忽略
    if (this.data.items[itemIndex].isEquipped) return;

    // 校验顺序
    if (clickedId === correctId) {
      // 正确
      this.triggerFlyAnimation(e, this.data.items[itemIndex].icon);
      this.correctFeedback(itemIndex, clickedId);

      const nextIndex = currentIndex + 1;

      // 判断是否全部完成
      if (nextIndex >= this.data.correctOrder.length) {
        setTimeout(() => {
          this.handleSuccess();
        }, 2000);
      } else {
        this.setData({
          currentStepIndex: nextIndex
        });
      }
    } else {
      // 错误
      this.wrongFeedback(itemIndex);
    }
  },

  // 正确反馈
  correctFeedback(index, id) {
    const key = `items[${index}].isEquipped`;
    const successText = this.data.stepTexts[id] || '操作成功';

    this.setData({
      [key]: true,
      moodClass: id === 'dragonPaint' ? 'warm' : (id === 'magicTool' ? 'holy' : '')
    });

    this.updateInstruction(successText);
    wx.vibrateShort({ type: 'light' });

    // 切换背景图
    this.switchBackgroundForStep(this.data.currentStepIndex, false);
  },

  // 错误反馈
  wrongFeedback(index) {
    this.updateInstruction('顺序有误，请再回想一下装扮的规矩。');
    wx.vibrateLong();
  },

  // 游戏成功
  handleSuccess() {
    this.stopTimer();
    this.setData({
      gameState: 'success',
      moodClass: 'holy'
    });
    this.updateInstruction('装扮完成。大哑巴已准备就绪，仪式即将开始。');
  },

  // 游戏失败
  handleFail() {
    this.stopTimer();
    this.setData({
      gameState: 'fail',
      moodClass: 'dark'
    });
    this.updateInstruction('时间耗尽或仪式中断');
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
        x: clientX - 40,
        y: clientY - 40
      }
    });

    setTimeout(() => {
      this.setData({ flyingItem: null });
    }, 1200);
  },

  // 更新指引文字（打字机效果）
  updateInstruction(text) {
    // 清除上一次的定时器
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }

    let currentIndex = 0;
    const length = text.length;

    // 先清空文字
    this.setData({ instructionText: '' });

    this.typewriterTimer = setInterval(() => {
      if (currentIndex >= length) {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
        return;
      }

      const char = text[currentIndex];
      this.setData({
        instructionText: this.data.instructionText + char
      });

      currentIndex++;
    }, 50);
  }
});
