// Get canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state variables
const gridSize = 5; // Number of dots per side (e.g., 5x5 dots)
const dotRadius = 5;
const lineThickness = 4;
const playerColors = ['#ff8a65', '#64b5f6']; // Player 1: Orange, Player 2: Blue
const boxFillColors = ['#ffccbc', '#bbdefb']; // Lighter shades for filled boxes
let playerScores = [0, 0];
let currentPlayer = 0; // 0 for Player 1, 1 for Player 2

// Board representation:
// horizontalLines[row][col] stores state of horizontal line below dot at (row, col)
// verticalLines[row][col] stores state of vertical line right of dot at (row, col)
// boxOwners[row][col] stores owner of box formed by (row,col), (row+1,col), (row,col+1), (row+1,col+1)
let horizontalLines;
let verticalLines;
let boxOwners; // -1 for unowned, 0 for Player 1, 1 for Player 2

// UI elements
const player1ScoreEl = document.getElementById('player1-score');
const player2ScoreEl = document.getElementById('player2-score');
const currentTurnEl = document.getElementById('current-turn');
const resetButton = document.getElementById('resetButton');
const messageBox = document.getElementById('messageBox');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const messageButton = document.getElementById('messageButton');

// Calculate dimensions dynamically
let cellSize; // Distance between centers of two adjacent dots
let boardPadding; // Padding around the grid
let totalBoardSize; // Size of the square board (width/height)

/**
 * Initializes or resets the game state.
 */
function initializeGame() {
    horizontalLines = Array(gridSize).fill(null).map(() => Array(gridSize - 1).fill(-1));
    verticalLines = Array(gridSize - 1).fill(null).map(() => Array(gridSize).fill(-1));
    boxOwners = Array(gridSize - 1).fill(null).map(() => Array(gridSize - 1).fill(-1));

    playerScores = [0, 0];
    currentPlayer = 0; // Player 1 starts

    updateUI();
    drawBoard();
    messageBox.style.display = 'none'; // Hide message box on reset
}

/**
 * Calculates and sets canvas dimensions based on current window size.
 */
function setCanvasDimensions() {
    const containerWidth = canvas.parentElement.clientWidth;
    // Set canvas width to be responsive, up to a max of 450px for better dot spacing
    totalBoardSize = Math.min(containerWidth - 60, 450); // 60px for padding/margins
    canvas.width = totalBoardSize;
    canvas.height = totalBoardSize;

    // Calculate cell size and padding based on the new totalBoardSize
    // (gridSize - 1) is the number of cells/gaps between dots
    cellSize = (totalBoardSize - (2 * dotRadius)) / (gridSize - 1);
    boardPadding = dotRadius; // Padding equals dot radius to center dots
}

/**
 * Draws the entire game board, including dots, lines, and filled boxes.
 */
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw filled boxes first
    for (let r = 0; r < gridSize - 1; r++) {
        for (let c = 0; c < gridSize - 1; c++) {
            if (boxOwners[r][c] !== -1) {
                ctx.fillStyle = boxFillColors[boxOwners[r][c]];
                const x = boardPadding + c * cellSize + lineThickness / 2;
                const y = boardPadding + r * cellSize + lineThickness / 2;
                const boxSize = cellSize - lineThickness;
                ctx.fillRect(x, y, boxSize, boxSize);
            }
        }
    }

    // Draw existing lines
    ctx.lineWidth = lineThickness;
    ctx.lineCap = 'round';

    // Horizontal lines
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize - 1; c++) {
            if (horizontalLines[r][c] !== -1) {
                ctx.strokeStyle = playerColors[horizontalLines[r][c]];
                const startX = boardPadding + c * cellSize + dotRadius;
                const startY = boardPadding + r * cellSize + dotRadius;
                const endX = startX + cellSize - 2 * dotRadius;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, startY);
                ctx.stroke();
            }
        }
    }

    // Vertical lines
    for (let r = 0; r < gridSize - 1; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (verticalLines[r][c] !== -1) {
                ctx.strokeStyle = playerColors[verticalLines[r][c]];
                const startX = boardPadding + c * cellSize + dotRadius;
                const startY = boardPadding + r * cellSize + dotRadius;
                const endY = startY + cellSize - 2 * dotRadius;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(startX, endY);
                ctx.stroke();
            }
        }
    }

    // Draw dots on top
    ctx.fillStyle = '#333'; // Dot color
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const x = boardPadding + c * cellSize + dotRadius;
            const y = boardPadding + r * cellSize + dotRadius;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * Updates the score and current turn display.
 */
function updateUI() {
    player1ScoreEl.textContent = `Player 1: ${playerScores[0]}`;
    player2ScoreEl.textContent = `Player 2: ${playerScores[1]}`;
    currentTurnEl.textContent = `Player ${currentPlayer + 1}'s Turn`;

    // Highlight current player's score
    if (currentPlayer === 0) {
        player1ScoreEl.style.backgroundColor = '#ffcc80'; /* Darker orange for active player */
        player2ScoreEl.style.backgroundColor = '#bbdefb';
    } else {
        player1ScoreEl.style.backgroundColor = '#ffe0b2';
        player2ScoreEl.style.backgroundColor = '#90caf9'; /* Darker blue for active player */
    }
}

/**
 * Handles a click/touch event on the canvas.
 * @param {MouseEvent|TouchEvent} event - The event object.
 */
function handleCanvasClick(event) {
    // Get mouse/touch coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.type === 'mousedown') {
        clientX = event.clientX;
        clientY = event.clientY;
    } else if (event.type === 'touchstart') {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        return; // Not a recognized event type
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Determine which line was clicked
    const clicked = getClickedLine(x, y);

    if (clicked) {
        const { type, row, col } = clicked;
        let lineDrawn = false;

        if (type === 'horizontal' && horizontalLines[row][col] === -1) {
            horizontalLines[row][col] = currentPlayer;
            lineDrawn = true;
        } else if (type === 'vertical' && verticalLines[row][col] === -1) {
            verticalLines[row][col] = currentPlayer;
            lineDrawn = true;
        }

        if (lineDrawn) {
            const boxesClosed = checkAndCloseBoxes(row, col, type);
            drawBoard(); // Redraw immediately after line is placed

            if (boxesClosed === 0) {
                // If no boxes were closed, switch turns
                currentPlayer = 1 - currentPlayer;
            }
            // If boxes were closed, current player gets another turn
            updateUI();
            checkGameOver();
        }
    }
}

/**
 * Determines which line (if any) was clicked based on coordinates.
 * @param {number} x - X coordinate relative to canvas.
 * @param {number} y - Y coordinate relative to canvas.
 * @returns {object|null} An object {type, row, col} or null if no line clicked.
 */
function getClickedLine(x, y) {
    // Convert canvas coordinates to grid coordinates
    const gridX = (x - boardPadding) / cellSize;
    const gridY = (y - boardPadding) / cellSize;

    // Check for horizontal lines
    // A horizontal line is between two dots in the same row
    // Its y-coordinate is close to a dot's y-coordinate
    // Its x-coordinate is between two dots' x-coordinates
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize - 1; c++) {
            const lineY = boardPadding + r * cellSize + dotRadius;
            const lineStartX = boardPadding + c * cellSize + dotRadius;
            const lineEndX = lineStartX + cellSize - 2 * dotRadius;

            // Check if click is within the line's bounding box
            if (y >= lineY - lineThickness / 2 && y <= lineY + lineThickness / 2 &&
                x >= lineStartX && x <= lineEndX) {
                return { type: 'horizontal', row: r, col: c };
            }
        }
    }

    // Check for vertical lines
    // A vertical line is between two dots in the same column
    // Its x-coordinate is close to a dot's x-coordinate
    // Its y-coordinate is between two dots' y-coordinates
    for (let r = 0; r < gridSize - 1; r++) {
        for (let c = 0; c < gridSize; c++) {
            const lineX = boardPadding + c * cellSize + dotRadius;
            const lineStartY = boardPadding + r * cellSize + dotRadius;
            const lineEndY = lineStartY + cellSize - 2 * dotRadius;

            // Check if click is within the line's bounding box
            if (x >= lineX - lineThickness / 2 && x <= lineX + lineThickness / 2 &&
                y >= lineStartY && y <= lineEndY) {
                return { type: 'vertical', row: r, col: c };
            }
        }
    }
    return null; // No line was clicked
}

/**
 * Checks if any boxes are closed by the newly drawn line and updates scores.
 * @param {number} r - Row index of the line.
 * @param {number} c - Column index of the line.
 * @param {string} type - 'horizontal' or 'vertical'.
 * @returns {number} The number of boxes closed in this turn.
 */
function checkAndCloseBoxes(r, c, type) {
    let boxesClosedCount = 0;

    if (type === 'horizontal') {
        // Check box above (if not in first row)
        if (r > 0) {
            if (boxOwners[r - 1][c] === -1 &&
                horizontalLines[r - 1][c] !== -1 && // Top line of box above
                verticalLines[r - 1][c] !== -1 &&   // Left line of box above
                verticalLines[r - 1][c + 1] !== -1) { // Right line of box above
                boxOwners[r - 1][c] = currentPlayer;
                playerScores[currentPlayer]++;
                boxesClosedCount++;
            }
        }
        // Check box below (if not in last row)
        if (r < gridSize - 1) {
            if (boxOwners[r][c] === -1 &&
                horizontalLines[r + 1][c] !== -1 && // Bottom line of box below
                verticalLines[r][c] !== -1 &&       // Left line of box below
                verticalLines[r][c + 1] !== -1) {   // Right line of box below
                boxOwners[r][c] = currentPlayer;
                playerScores[currentPlayer]++;
                boxesClosedCount++;
            }
        }
    } else { // type === 'vertical'
        // Check box to the left (if not in first column)
        if (c > 0) {
            if (boxOwners[r][c - 1] === -1 &&
                verticalLines[r][c - 1] !== -1 &&   // Left line of box to left
                horizontalLines[r][c - 1] !== -1 && // Top line of box to left
                horizontalLines[r + 1][c - 1] !== -1) { // Bottom line of box to left
                boxOwners[r][c - 1] = currentPlayer;
                playerScores[currentPlayer]++;
                boxesClosedCount++;
            }
        }
        // Check box to the right (if not in last column)
        if (c < gridSize - 1) {
            if (boxOwners[r][c] === -1 &&
                verticalLines[r][c + 1] !== -1 &&   // Right line of box to right
                horizontalLines[r][c] !== -1 &&     // Top line of box to right
                horizontalLines[r + 1][c] !== -1) { // Bottom line of box to right
                boxOwners[r][c] = currentPlayer;
                playerScores[currentPlayer]++;
                boxesClosedCount++;
            }
        }
    }
    return boxesClosedCount;
}

/**
 * Checks if the game is over (all boxes filled) and declares winner.
 */
function checkGameOver() {
    let totalBoxes = (gridSize - 1) * (gridSize - 1);
    let filledBoxes = playerScores[0] + playerScores[1];

    if (filledBoxes === totalBoxes) {
        let winnerMessage = '';
        if (playerScores[0] > playerScores[1]) {
            winnerMessage = 'Player 1 Wins!';
        } else if (playerScores[1] > playerScores[0]) {
            winnerMessage = 'Player 2 Wins!';
        } else {
            winnerMessage = 'It\'s a Draw!';
        }
        showMessage(winnerMessage, 'Game Over!');
    }
}

/**
 * Displays a custom message box.
 * @param {string} title - The title of the message.
 * @param {string} text - The main message text.
 */
function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    messageBox.style.display = 'flex';
}

// Event Listeners
canvas.addEventListener('mousedown', handleCanvasClick);
canvas.addEventListener('touchstart', handleCanvasClick, { passive: false }); // Use passive: false for touch events if preventing default behavior
resetButton.addEventListener('click', initializeGame);
messageButton.addEventListener('click', initializeGame); // Play again button

// Handle window resizing to make the canvas responsive
window.addEventListener('resize', () => {
    setCanvasDimensions();
    drawBoard(); // Redraw the board after resizing
});

// Initial setup when the window loads
window.onload = function() {
    setCanvasDimensions(); // Set initial dimensions
    initializeGame();     // Start the game
};
