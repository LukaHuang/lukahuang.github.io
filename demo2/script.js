class SudokuGame {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.givenCells = new Set();
        this.selectedCell = { row: 4, col: 4 }; // 預設選中中間格子
        this.hintsRemaining = 3;
        this.startTime = null;
        this.timerInterval = null;
        this.difficulty = 'medium';
        this.init();
    }

    init() {
        this.createBoard();
        this.bindEvents();
        this.generatePuzzle();
        this.startTimer();
        this.updateHintDisplay();
    }

    createBoard() {
        const boardElement = document.getElementById('sudoku-board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', (e) => this.selectCell(e));
                boardElement.appendChild(cell);
            }
        }
    }

    bindEvents() {
        // 數字按鈕
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.inputNumber(e));
        });

        // 遊戲控制按鈕
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('check-solution').addEventListener('click', () => this.checkSolution());
        document.getElementById('hint-btn').addEventListener('click', () => this.giveHint());
        
        // 難度選擇
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        // 鍵盤輸入
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    selectCell(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        this.setSelectedCell(row, col);
    }

    setSelectedCell(row, col) {
        // 移除所有高亮
        this.clearHighlights();

        this.selectedCell = { row, col };
        
        // 更新視覺效果
        this.updateCellHighlights();
        this.clearMessage();
    }

    clearHighlights() {
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected', 'highlight-same', 'highlight-related');
        });
    }

    updateCellHighlights() {
        const cells = document.querySelectorAll('.sudoku-cell');
        const { row, col } = this.selectedCell;
        const selectedValue = this.board[row][col];

        cells.forEach((cell, index) => {
            const cellRow = Math.floor(index / 9);
            const cellCol = index % 9;
            
            // 選中的格子
            if (cellRow === row && cellCol === col) {
                cell.classList.add('selected');
            }
            // 同行、同列、同3x3區塊
            else if (cellRow === row || cellCol === col || 
                     (Math.floor(cellRow / 3) === Math.floor(row / 3) && 
                      Math.floor(cellCol / 3) === Math.floor(col / 3))) {
                cell.classList.add('highlight-related');
            }
            
            // 相同數字高亮
            if (selectedValue !== 0 && this.board[cellRow][cellCol] === selectedValue) {
                cell.classList.add('highlight-same');
            }
        });
    }

    inputNumber(e) {
        if (!this.selectedCell) {
            this.showMessage('請先選擇一個格子', 'error');
            return;
        }

        const number = parseInt(e.target.dataset.number);
        const { row, col } = this.selectedCell;

        // 不能修改已給定的數字
        if (this.givenCells.has(`${row}-${col}`)) {
            this.showMessage('不能修改已給定的數字', 'error');
            return;
        }

        const oldValue = this.board[row][col];

        if (number === 0) {
            // 清除數字
            this.board[row][col] = 0;
            this.updateDisplay();
            this.updateCellHighlights();
        } else {
            // 檢查是否是正確答案
            const isCorrect = this.solution[row][col] === number;
            
            if (isCorrect) {
                this.board[row][col] = number;
                this.addCorrectAnimation(row, col);
                this.updateDisplay();
                this.updateCellHighlights();
                
                // 檢查是否完成
                setTimeout(() => {
                    if (this.isPuzzleComplete()) {
                        this.onPuzzleComplete();
                    }
                }, 300);
            } else {
                // 錯誤輸入，顯示錯誤動畫但不保存
                this.addErrorAnimation(row, col);
                this.showMessage('這個數字不正確，請再試試', 'error');
                setTimeout(() => this.clearMessage(), 2000);
            }
        }
    }

    addCorrectAnimation(row, col) {
        const cellIndex = row * 9 + col;
        const cell = document.querySelectorAll('.sudoku-cell')[cellIndex];
        cell.classList.add('correct-input');
        setTimeout(() => {
            cell.classList.remove('correct-input');
        }, 600);
    }

    addErrorAnimation(row, col) {
        const cellIndex = row * 9 + col;
        const cell = document.querySelectorAll('.sudoku-cell')[cellIndex];
        cell.classList.add('error');
        setTimeout(() => {
            cell.classList.remove('error');
        }, 500);
    }

    handleKeyboard(e) {
        e.preventDefault();
        
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        const key = e.key;

        // 數字輸入
        if (key >= '1' && key <= '9') {
            const number = parseInt(key);
            this.inputNumberDirect(number);
        } 
        // 清除
        else if (key === 'Delete' || key === 'Backspace' || key === '0') {
            this.inputNumberDirect(0);
        }
        // 方向鍵導航
        else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            this.handleArrowKey(key);
        }
    }

    inputNumberDirect(number) {
        const { row, col } = this.selectedCell;

        if (this.givenCells.has(`${row}-${col}`)) {
            this.showMessage('不能修改已給定的數字', 'error');
            return;
        }

        if (number === 0) {
            this.board[row][col] = 0;
            this.updateDisplay();
            this.updateCellHighlights();
        } else {
            const isCorrect = this.solution[row][col] === number;
            
            if (isCorrect) {
                this.board[row][col] = number;
                this.addCorrectAnimation(row, col);
                this.updateDisplay();
                this.updateCellHighlights();
                
                setTimeout(() => {
                    if (this.isPuzzleComplete()) {
                        this.onPuzzleComplete();
                    }
                }, 300);
            } else {
                this.addErrorAnimation(row, col);
                this.showMessage('這個數字不正確，請再試試', 'error');
                setTimeout(() => this.clearMessage(), 2000);
            }
        }
    }

    handleArrowKey(key) {
        let { row, col } = this.selectedCell;
        
        switch(key) {
            case 'ArrowUp':
                row = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                row = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                col = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                col = Math.min(8, col + 1);
                break;
        }
        
        this.setSelectedCell(row, col);
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.sudoku-cell');
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cellIndex = i * 9 + j;
                const cell = cells[cellIndex];
                const value = this.board[i][j];
                
                cell.textContent = value === 0 ? '' : value;
                
                // 移除錯誤樣式（現在只在動畫時使用）
                if (!cell.classList.contains('error')) {
                    cell.classList.remove('error');
                }
            }
        }
    }

    giveHint() {
        if (this.hintsRemaining <= 0) {
            this.showMessage('提示次數已用完', 'error');
            return;
        }

        if (!this.selectedCell) {
            this.showMessage('請先選擇一個格子', 'error');
            return;
        }

        const { row, col } = this.selectedCell;

        if (this.givenCells.has(`${row}-${col}`)) {
            this.showMessage('這個數字已經是給定的', 'error');
            return;
        }

        if (this.board[row][col] !== 0) {
            this.showMessage('這個格子已經有數字了', 'error');
            return;
        }

        // 給出提示
        this.board[row][col] = this.solution[row][col];
        this.hintsRemaining--;
        this.updateHintDisplay();
        this.addCorrectAnimation(row, col);
        this.updateDisplay();
        this.updateCellHighlights();
        
        this.showMessage(`提示已給出！還剩 ${this.hintsRemaining} 次提示`, 'success');

        if (this.isPuzzleComplete()) {
            setTimeout(() => this.onPuzzleComplete(), 300);
        }
    }

    updateHintDisplay() {
        document.getElementById('hint-count').textContent = this.hintsRemaining;
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    newGame() {
        this.stopTimer();
        this.difficulty = document.getElementById('difficulty').value;
        this.hintsRemaining = 3;
        this.updateHintDisplay();
        this.generatePuzzle();
        this.startTimer();
    }

    generatePuzzle() {
        // 重置棋盤
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.givenCells.clear();

        // 生成完整的數獨解答
        this.solveSudoku(this.solution);
        
        // 複製解答到棋盤
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.board[i][j] = this.solution[i][j];
            }
        }

        // 根據難度決定移除多少個數字
        let cellsToRemove;
        switch(this.difficulty) {
            case 'easy': cellsToRemove = 35; break;
            case 'medium': cellsToRemove = 45; break;
            case 'hard': cellsToRemove = 55; break;
            default: cellsToRemove = 45;
        }

        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }

        // 隨機打亂位置
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // 移除前cellsToRemove個位置的數字
        for (let i = 0; i < cellsToRemove; i++) {
            const [row, col] = positions[i];
            this.board[row][col] = 0;
        }

        // 標記已給定的數字
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] !== 0) {
                    this.givenCells.add(`${i}-${j}`);
                }
            }
        }

        this.updateGivenCells();
        this.updateDisplay();
        this.setSelectedCell(4, 4); // 重新選中中間格子
        this.clearMessage();
    }

    solveSudoku(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    
                    // 隨機排列數字
                    for (let k = numbers.length - 1; k > 0; k--) {
                        const l = Math.floor(Math.random() * (k + 1));
                        [numbers[k], numbers[l]] = [numbers[l], numbers[k]];
                    }

                    for (let num of numbers) {
                        if (this.isValidForSolution(board, i, j, num)) {
                            board[i][j] = num;
                            if (this.solveSudoku(board)) {
                                return true;
                            }
                            board[i][j] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValidForSolution(board, row, col, num) {
        // 檢查行
        for (let j = 0; j < 9; j++) {
            if (board[row][j] === num) return false;
        }

        // 檢查列
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }

        // 檢查3x3方格
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        
        for (let i = startRow; i < startRow + 3; i++) {
            for (let j = startCol; j < startCol + 3; j++) {
                if (board[i][j] === num) return false;
            }
        }

        return true;
    }

    updateGivenCells() {
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.classList.remove('given', 'selected');
        });

        this.givenCells.forEach(cellKey => {
            const [row, col] = cellKey.split('-').map(Number);
            const cellIndex = row * 9 + col;
            cells[cellIndex].classList.add('given');
        });
    }

    resetGame() {
        // 重置為初始狀態
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!this.givenCells.has(`${i}-${j}`)) {
                    this.board[i][j] = 0;
                }
            }
        }

        this.updateDisplay();
        this.setSelectedCell(4, 4);
        this.clearMessage();
    }

    isPuzzleComplete() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    onPuzzleComplete() {
        this.stopTimer();
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeStr = `${minutes}分${seconds}秒`;
        
        this.showMessage(`🎉 恭喜完成！用時: ${timeStr}`, 'success');
        
        // 添加完成動畫
        document.querySelectorAll('.sudoku-cell').forEach((cell, index) => {
            setTimeout(() => {
                cell.style.animation = 'pulse 0.6s ease-in-out';
            }, index * 20);
        });
    }

    checkSolution() {
        let hasErrors = false;

        // 檢查是否有錯誤
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] !== 0 && this.board[i][j] !== this.solution[i][j]) {
                    hasErrors = true;
                    break;
                }
            }
            if (hasErrors) break;
        }

        if (hasErrors) {
            this.showMessage('有錯誤的數字，請檢查', 'error');
        } else if (this.isPuzzleComplete()) {
            this.onPuzzleComplete();
        } else {
            this.showMessage('目前沒有錯誤，請繼續完成', 'success');
        }
    }

    showMessage(text, type = '') {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
    }

    clearMessage() {
        const messageElement = document.getElementById('message');
        messageElement.textContent = '';
        messageElement.className = 'message';
    }
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});