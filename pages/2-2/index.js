Page({
  data: {
    gameState: 'start', // start, playing, success, fail
    timeLeft: 120,
    toastMessage: '',
    errorAnim: false,
    
    // 角色身上的图层开关
    layers: {
      dragonPaint: false,
      cowHead: false,
      feather: false,
      magicTool: false
    },

    // 道具列表 (显示顺序可以固定)
    items: [
      { 
        id: 'dragonPaint', 
        name: '龙纹彩绘', 
        desc: '龙纹象征雨水与保护', 
        icon: '🐉', 
        isEquipped: false 
      },
      { 
        id: 'cowHead', 
        name: '牛皮头饰', 
        desc: '牛象征农耕与力量', 
        icon: '🐮', 
        isEquipped: false 
      },
      { 
        id: 'feather', 
        name: '野鸡羽毛', 
        desc: '羽毛代表吉祥与活力', 
        icon: '🪶', 
        isEquipped: false 
      },
      { 
        id: 'magicTool', 
        name: '法器手持', 
        desc: '法器用于驱邪祈福', 
        icon: '🪄', 
        isEquipped: false 
      }
    ],

    // 正确的装扮顺序 (存的是ID)
    correctOrder: ['dragonPaint', 'cowHead', 'feather', 'magicTool'],
    
    // 当前进行到第几步 (数组索引)
    currentStepIndex: 0
  },

  timer: null,

  onLoad: function() {
    // 页面初始化
  },

  onUnload: function() {
    this.stopTimer();
  },

  // 开始游戏
  startGame: function() {
    this.stopTimer();
    
    // 重置所有状态
    // 注意：这里为了兼容性，不使用复杂的对象解构深拷贝
    var resetItems = this.data.items.map(function(item) {
      item.isEquipped = false;
      return item;
    });

    this.setData({
      gameState: 'playing',
      timeLeft: 120,
      currentStepIndex: 0,
      toastMessage: '请按顺序点击下方物品进行装扮',
      layers: {
        dragonPaint: false,
        cowHead: false,
        feather: false,
        magicTool: false
      },
      items: resetItems
    });

    this.startTimer();
  },

  // 倒计时逻辑
  startTimer: function() {
    var that = this;
    this.timer = setInterval(function() {
      if (that.data.timeLeft <= 0) {
        that.handleFail();
      } else {
        that.setData({
          timeLeft: that.data.timeLeft - 1
        });
      }
    }, 1000);
  },

  stopTimer: function() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  // 核心逻辑：点击物品
  onItemClick: function(e) {
    if (this.data.gameState !== 'playing') return;

    var clickedId = e.currentTarget.dataset.id;
    var currentIndex = this.data.currentStepIndex;
    var correctId = this.data.correctOrder[currentIndex];
    
    // 查找点击的物品在items数组中的位置
    var itemIndex = -1;
    for (var i = 0; i < this.data.items.length; i++) {
      if (this.data.items[i].id === clickedId) {
        itemIndex = i;
        break;
      }
    }

    // 如果该物品已经穿戴了，不做反应
    if (this.data.items[itemIndex].isEquipped) return;

    // 校验顺序
    if (clickedId === correctId) {
      // --- 正确 ---
      this.handleCorrectStep(clickedId, itemIndex);
    } else {
      // --- 错误 ---
      this.handleWrongStep();
    }
  },

  // 处理正确步骤
  handleCorrectStep: function(stepId, itemIndex) {
    // 准备更新的数据对象
    var updateData = {};
    
    // 1. 更新物品栏状态
    var keyItem = 'items[' + itemIndex + '].isEquipped';
    updateData[keyItem] = true;
    
    // 2. 显示对应的角色图层
    // 注意：这里使用了最安全的字符串拼接方式避免 Babel 报错
    var keyLayer = 'layers.' + stepId;
    updateData[keyLayer] = true;

    // 3. 更新提示语
    updateData['toastMessage'] = '步骤正确！';
    
    // 4. 步数前进
    var nextIndex = this.data.currentStepIndex + 1;
    updateData['currentStepIndex'] = nextIndex;

    this.setData(updateData);

    // 检查是否全部完成
    if (nextIndex >= this.data.correctOrder.length) {
      this.handleSuccess();
    }
  },

  // 处理错误步骤
  handleWrongStep: function() {
    var that = this;
    
    this.setData({
      toastMessage: '顺序不对，请思考仪式规矩！',
      errorAnim: true
    });
    
    // 震动反馈
    wx.vibrateLong();

    // 500ms后移除震动动画类
    setTimeout(function() {
      that.setData({
        errorAnim: false
      });
    }, 500);
  },

  // 胜利
  handleSuccess: function() {
    this.stopTimer();
    // 稍微延迟一下显示成功弹窗，让玩家看到最后一件装备穿上
    var that = this;
    setTimeout(function() {
      that.setData({
        gameState: 'success'
      });
    }, 800);
  },

  // 失败
  handleFail: function() {
    this.stopTimer();
    this.setData({
      gameState: 'fail'
    });
  },

  goBack: function() {
    var pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  }
});
