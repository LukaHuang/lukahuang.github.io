class SudokuGame {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.givenCells = new Set();
        this.selectedCell = null;
        this.init();
    }

    init() {
        this.createBoard();
        this.bindEvents();
        this.generatePuzzle();
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
        document.getElementById('new-game').addEventListener('click', () => this.generatePuzzle());
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('check-solution').addEventListener('click', () => this.checkSolution());

        // 鍵盤輸入
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    selectCell(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);

        // 移除之前選中的樣式
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        // 如果點擊的是已給定的數字，不允許選擇
        if (this.givenCells.has(`${row}-${col}`)) {
            return;
        }

        // 選中新的格子
        e.target.classList.add('selected');
        this.selectedCell = { row, col };
    }

    inputNumber(e) {
        if (!this.selectedCell) {
            this.showMessage('請先選擇一個格子', 'error');
            return;
        }

        const number = parseInt(e.target.dataset.number);
        const { row, col } = this.selectedCell;

        if (number === 0) {
            // 清除數字
            this.board[row][col] = 0;
        } else {
            // 輸入數字
            this.board[row][col] = number;
        }

        this.updateDisplay();
        this.clearMessage();
    }

    handleKeyboard(e) {
        if (!this.selectedCell) return;

        const key = e.key;
        if (key >= '1' && key <= '9') {
            const number = parseInt(key);
            const { row, col } = this.selectedCell;
            this.board[row][col] = number;
            this.updateDisplay();
        } else if (key === 'Delete' || key === 'Backspace') {
            const { row, col } = this.selectedCell;
            this.board[row][col] = 0;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.sudoku-cell');
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cellIndex = i * 9 + j;
                const cell = cells[cellIndex];
                const value = this.board[i][j];
                
                cell.textContent = value === 0 ? '' : value;
                
                // 移除錯誤樣式
                cell.classList.remove('error');
                
                // 檢查衝突
                if (value !== 0 && this.hasConflict(i, j, value)) {
                    cell.classList.add('error');
                }
            }
        }
    }

    hasConflict(row, col, num) {
        // 檢查行
        for (let j = 0; j < 9; j++) {
            if (j !== col && this.board[row][j] === num) {
                return true;
            }
        }

        // 檢查列
        for (let i = 0; i < 9; i++) {
            if (i !== row && this.board[i][col] === num) {
                return true;
            }
        }

        // 檢查3x3方格
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        
        for (let i = startRow; i < startRow + 3; i++) {
            for (let j = startCol; j < startCol + 3; j++) {
                if ((i !== row || j !== col) && this.board[i][j] === num) {
                    return true;
                }
            }
        }

        return false;
    }

    isValidMove(row, col, num) {
        return !this.hasConflict(row, col, num);
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

        // 隨機移除一些數字創建謎題
        const cellsToRemove = 45; // 移除45個數字，留下36個
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
        this.clearMessage();
        this.selectedCell = null;
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

        this.selectedCell = null;
        this.updateDisplay();
        this.clearMessage();
        
        // 移除所有選中狀態
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
    }

    checkSolution() {
        let isComplete = true;
        let hasErrors = false;

        // 檢查是否完成和是否有錯誤
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) {
                    isComplete = false;
                } else if (this.hasConflict(i, j, this.board[i][j])) {
                    hasErrors = true;
                }
            }
        }

        if (hasErrors) {
            this.showMessage('有錯誤的數字，請檢查標紅的格子', 'error');
        } else if (isComplete) {
            this.showMessage('🎉 恭喜！數獨完成了！', 'success');
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