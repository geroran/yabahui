Page({
  data: {
    gameState: 'opening', // opening, puzzle, rhythm, resource, ending
    puzzlePieces: [],
    selectedPiece: -1,
    isPuzzleSolved: false
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
    this.setData({ gameState: 'puzzle' });
    this.initPuzzle();
  },

  // 初始化拼图
  initPuzzle() {
    let pieces = [];
    // 创建9个拼块
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

    // 打乱顺序 (简单随机交换)
    // 确保打乱后不是还原状态
    for (let i = 0; i < 20; i++) {
      let idx1 = Math.floor(Math.random() * 9);
      let idx2 = Math.floor(Math.random() * 9);
      this.swapPiecesInArray(pieces, idx1, idx2);
    }

    this.setData({
      puzzlePieces: pieces,
      isPuzzleSolved: false,
      selectedPiece: -1
    });
  },

  // 辅助：交换数组中两个拼块的位置属性
  swapPiecesInArray(pieces, idx1, idx2) {
    let tempX = pieces[idx1].x;
    let tempY = pieces[idx1].y;
    pieces[idx1].x = pieces[idx2].x;
    pieces[idx1].y = pieces[idx2].y;
    pieces[idx2].x = tempX;
    pieces[idx2].y = tempY;

    // 更新正确状态
    pieces[idx1].isCorrect = (pieces[idx1].x === pieces[idx1].origX && pieces[idx1].y === pieces[idx1].origY);
    pieces[idx2].isCorrect = (pieces[idx2].x === pieces[idx2].origX && pieces[idx2].y === pieces[idx2].origY);
  },

  // 点击拼块
  handlePieceTap(e) {
    if (this.data.isPuzzleSolved) return;

    const index = e.currentTarget.dataset.index;
    const { selectedPiece, puzzlePieces } = this.data;

    if (selectedPiece === -1) {
      // 选中第一个
      this.setData({ selectedPiece: index });
    } else if (selectedPiece === index) {
      // 取消选中
      this.setData({ selectedPiece: -1 });
    } else {
      // 交换
      let newPieces = [...puzzlePieces];
      this.swapPiecesInArray(newPieces, selectedPiece, index);

      this.setData({
        puzzlePieces: newPieces,
        selectedPiece: -1
      });

      this.checkWin();
    }
  },

  // 检查是否完成
  checkWin() {
    const { puzzlePieces } = this.data;
    const isWin = puzzlePieces.every(p => p.isCorrect);

    if (isWin) {
      this.setData({ isPuzzleSolved: true });

      // 延迟进入下一阶段
      setTimeout(() => {
        // TODO: 进入驱邪阶段
        wx.showToast({
          title: '即将进入驱邪阶段',
          icon: 'none'
        });
        // this.setData({ gameState: 'rhythm' });
      }, 2500);
    }
  }
})
