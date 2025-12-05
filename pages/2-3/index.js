Page({
  data: {
    gameState: 'opening', // opening, puzzle, rhythm, resource, ending

    // --- 拼图 ---
    puzzlePieces: [],
    selectedPiece: -1,
    isPuzzleSolved: false,

    // --- 节奏游戏状态 ---
    showRhythmGuide: true,
    currentScore: 0,
    activeInstrument: null,
    feedbackText: '',
    feedbackClass: '',
    feedbackPos: { x: 0, y: 0 },
    flyingIcons: [],
    rhythmTimer: null,
    isGameEnded: false,

    // --- 结算页面状态 ---
    endingTitle: '',
    endingSubtitle: '',
    endingScore: 0,
    endingGrade: '',
    endingMessage: ''
  },

  // 页面加载
  onLoad() { },

  // 开场点击
  handleTap() {
    if (this.data.gameState === 'opening') {
      this.startGame();
    }
  },

  startGame() {
    this.setData({ gameState: 'puzzle' });
    this.initPuzzle();
  },

  // ---------- 拼图 ----------
  initPuzzle() {
    let pieces = [];
    for (let i = 0; i < 9; i++) {
      pieces.push({
        id: i,
        origX: i % 3,
        origY: Math.floor(i / 3),
        x: i % 3,
        y: Math.floor(i / 3),
        isCorrect: true
      });
    }

    // 简单打乱
    for (let i = 0; i < 20; i++) {
      const idx1 = Math.floor(Math.random() * 9);
      const idx2 = Math.floor(Math.random() * 9);
      this.swapPiecesInArray(pieces, idx1, idx2);
    }

    this.setData({
      puzzlePieces: pieces,
      isPuzzleSolved: false,
      selectedPiece: -1
    });
  },

  // 修正后的交换函数（去掉重复赋值 bug）
  swapPiecesInArray(pieces, idx1, idx2) {
    const p1 = pieces[idx1];
    const p2 = pieces[idx2];

    const tx = p1.x;
    const ty = p1.y;
    p1.x = p2.x;
    p1.y = p2.y;
    p2.x = tx;
    p2.y = ty;

    p1.isCorrect = (p1.x === p1.origX && p1.y === p1.origY);
    p2.isCorrect = (p2.x === p2.origX && p2.y === p2.origY);
  },

  handlePieceTap(e) {
    if (this.data.isPuzzleSolved) return;

    const index = e.currentTarget.dataset.index;
    const { selectedPiece, puzzlePieces } = this.data;

    if (selectedPiece === -1) {
      this.setData({ selectedPiece: index });
    } else if (selectedPiece === index) {
      this.setData({ selectedPiece: -1 });
    } else {
      let newPieces = [...puzzlePieces];
      this.swapPiecesInArray(newPieces, selectedPiece, index);

      this.setData({
        puzzlePieces: newPieces,
        selectedPiece: -1
      });

      this.checkWin();
    }
  },

  checkWin() {
    const isWin = this.data.puzzlePieces.every(p => p.isCorrect);
    if (isWin) {
      this.setData({ isPuzzleSolved: true });

      setTimeout(() => {
        this.setData({ gameState: 'rhythm' });
      }, 2000);
    }
  },

  autoSolvePuzzle() {
    if (this.data.isPuzzleSolved) return;

    wx.showLoading({ title: '大哑巴施法中...' });

    setTimeout(() => {
      let pieces = this.data.puzzlePieces.map(p => ({
        ...p,
        x: p.origX,
        y: p.origY,
        isCorrect: true
      }));

      this.setData({
        puzzlePieces: pieces,
        selectedPiece: -1
      });

      wx.hideLoading();
      this.checkWin();
    }, 800);
  },

  // ---------- 节奏游戏 ----------
  startRhythmGame() {
    this.setData({
      showRhythmGuide: false,
      isGameEnded: false,
      currentScore: 0
    });

    this.startMusic();
  },

  // 音频对象不能放 data，必须挂 this 才不会丢失
  startMusic() {
    this.musicContext = wx.createInnerAudioContext();
    this.musicContext.src = '/pages/2-3/music/乐器-敲锣-咣咣咣1秒.mp3';
    this.musicContext.loop = false;

    this.startGameLoop();
  },

  startGameLoop() {
    let beatIndex = 0;
    const instruments = ['bell', 'mortar', 'willow'];

    setTimeout(() => {
      this.runBeat(instruments);

      this.data.rhythmTimer = setInterval(() => {
        beatIndex++;
        if (beatIndex >= 5) {
          this.endRhythmGame();
          return;
        }
        this.runBeat(instruments);
      }, 1500);
    }, 500);
  },

  runBeat(instruments) {
    if (this.data.gameState !== 'rhythm') {
      clearInterval(this.data.rhythmTimer);
      return;
    }

    if (this.musicContext) {
      this.musicContext.stop();
      this.musicContext.play();
    }

    setTimeout(() => {
      const type = instruments[Math.floor(Math.random() * instruments.length)];
      this.setData({ activeInstrument: type });

      setTimeout(() => {
        if (this.data.activeInstrument === type) {
          this.setData({ activeInstrument: null });
        }
      }, 800);
    }, 300);
  },

  handleInstrumentTap(e) {
    if (this.data.isGameEnded) return;

    const type = e.currentTarget.dataset.type;
    const { activeInstrument, currentScore } = this.data;

    const x = e.detail.x || 150;
    const y = e.detail.y || 300;

    let scoreChange = 0;
    let feedback = '';
    let cls = '';

    if (type === activeInstrument) {
      scoreChange = 10;
      feedback = '完美!';
      cls = 'perfect';
      this.setData({ activeInstrument: null });
    } else {
      scoreChange = -5;
      feedback = '错啦!';
      cls = 'miss';
    }

    const newScore = Math.max(0, currentScore + scoreChange);

    this.setData({
      currentScore: newScore,
      feedbackText: feedback,
      feedbackClass: cls,
      feedbackPos: { x: x - 40, y: y - 80 }
    });

    setTimeout(() => this.setData({ feedbackText: '' }), 800);

    const iconMap = {
      'bell': '/pages/2-3/images/法铃.webp',
      'mortar': '/pages/2-3/images/小研臼.webp',
      'willow': '/pages/2-3/images/柳枝.webp'
    };

    const id = Date.now();
    const newIcon = { id, src: iconMap[type], x, y };

    this.setData({
      flyingIcons: [...this.data.flyingIcons, newIcon]
    });

    setTimeout(() => {
      this.setData({
        flyingIcons: this.data.flyingIcons.filter(i => i.id !== id)
      });
    }, 800);
  },

  // ---------- 结算 ----------
  endRhythmGame() {
    clearInterval(this.data.rhythmTimer);

    if (this.musicContext) {
      this.musicContext.stop();
      this.musicContext.destroy();
      this.musicContext = null;
    }

    const score = this.data.currentScore;
    let endingTitle = '';
    let endingSubtitle = '';
    let endingGrade = '';
    let endingMessage = '';

    if (score >= 40) {
      endingTitle = '驱邪大师';
      endingSubtitle = '邪祟已除，福气满堂！';
      endingGrade = 'S';
      endingMessage = '你的节奏感无人能及，法器在你手中如虎添翼！';
    } else if (score >= 20) {
      endingTitle = '驱邪能手';
      endingSubtitle = '虽有瑕疵，诚意已达';
      endingGrade = 'A';
      endingMessage = '表现不错！继续修炼，定能成为一代宗师。';
    } else {
      endingTitle = '初入门径';
      endingSubtitle = '心诚则灵，继续努力';
      endingGrade = 'B';
      endingMessage = '法器需要更多练习，但你的诚心已被感知。';
    }

    this.setData({
      isGameEnded: true,
      endingTitle,
      endingSubtitle,
      endingScore: score,
      endingGrade,
      endingMessage
    });

    // 延迟切换到结算页面，让玩家看到最后的分数
    setTimeout(() => {
      this.setData({ gameState: 'ending' });
    }, 800);
  },

  // 进入下一阶段
  goToNextPhase() {
    // 这里可以导航到下一个阶段页面，或者切换到下一个游戏状态
    wx.showToast({
      title: '正在进入下一阶段...',
      icon: 'loading',
      duration: 1500
    });

    // TODO: 实现跳转到下一阶段的逻辑
    // 例如: wx.navigateTo({ url: '/pages/2-4/index' });
    // 或者: this.setData({ gameState: 'nextPhase' });
  },

  // 重新开始当前阶段
  restartGame() {
    this.setData({
      gameState: 'rhythm',
      showRhythmGuide: true,
      currentScore: 0,
      activeInstrument: null,
      isGameEnded: false,
      endingTitle: '',
      endingSubtitle: '',
      endingScore: 0,
      endingGrade: '',
      endingMessage: ''
    });
  },

  onUnload() {
    if (this.musicContext) {
      this.musicContext.stop();
      this.musicContext.destroy();
    }
    if (this.data.rhythmTimer) {
      clearInterval(this.data.rhythmTimer);
    }
  }
});
