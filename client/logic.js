var __LOGIC = __LOGIC || {};
var __DISPLAY = __DISPLAY || {};

(function(g, display, logic) {
  // Public functions
  logic.initialize = initialize;
  logic.possibleSubMoves = possibleSubMoves;
  logic.movePiece = movePiece;
  logic.pieceCaptured = pieceCaptured;
  logic.getMiddle = getMiddle;
  logic.makeEnemyMoves = makeEnemyMoves;

  function initialize(){
    for (var i = 0; i < g.BOARD_SIZE/2; i++){
      for (var j = 0; j < g.NUM_ROWS; j++){
        var enemy = new Piece();
        enemy.isAlly = false;
        enemy.x = ((j+1)%2) + Math.floor(i*2);
        enemy.y = j;
        g.board[enemy.x][enemy.y] = enemy;

        var ally = new Piece();
        ally.x = (j%2) + Math.floor(i*2);
        ally.y = g.BOARD_SIZE - 1 - j;
        g.board[ally.x][ally.y] = ally;
      }
    }
  }

  function isValid(x, y) {
    return (x >= 0 && y >= 0 && x < g.BOARD_SIZE && y < g.BOARD_SIZE);
  }

  function inc(a) {
    return a >= 0 ? a + 1 : a - 1;
  }

  function reverseMove(move){
    move.srcX = g.BOARD_SIZE - 1 - move.srcX;
    move.srcY = g.BOARD_SIZE - 1 - move.srcY;
    move.destX = g.BOARD_SIZE - 1 - move.destX;
    move.destY = g.BOARD_SIZE - 1 - move.destY;
    return move;
  }


  // testLocal should not be specified.
  function possibleSubMoves(piece, testLocal) {
    if(!piece) return [];
    var xOffsets;
    var yOffsets;
    if (piece.isKing){
      xOffsets = [1,1,-1,-1];
      yOffsets = [1,-1,1,-1];
    } else if (piece.isAlly) {
      xOffsets = [1,-1];
      yOffsets = [-1,-1];
    } else if (!piece.isAlly) {
      xOffsets = [1,-1];
      yOffsets = [1,1];
    }
    var moves = [];
    for (var i = 0; i < xOffsets.length; i++){
      var m = new Move();
      m.captures = false;
      m.isFinal = true;
      m.srcX = piece.x;
      m.srcY = piece.y;
      m.destX = piece.x + xOffsets[i];
      m.destY = piece.y + yOffsets[i];

      if (!isValid(m.destX,m.destY))  continue;

      if (g.moveHistory.length > 0 || g.board[m.destX][m.destY]){
        if (!g.board[m.destX][m.destY]) continue;
        var lastMove = g.moveHistory[g.moveHistory.length-1];

        m.captures = g.board[m.destX][m.destY].isAlly !== piece.isAlly;
        m.destX += xOffsets[i];
        m.destY += yOffsets[i];

        if (lastMove && lastMove.srcX === m.destX && lastMove.srcY === m.destY) continue;
        if (!isValid(m.destX,m.destY) || g.board[m.destX][m.destY]) continue;
        // Check if next state has valid moves
        if (!testLocal) {
          var isKing = piece.isKing;
          var srcPt = {x: piece.x, y: piece.y};
          var destPt = {x: m.destX, y: m.destY};
          movePiece(srcPt, destPt);
          g.moveHistory.push(m);
          piece.isKing = isKing;
          m.isFinal = (possibleSubMoves(piece, true).length === 0);
          g.moveHistory.pop();
          movePiece(destPt, srcPt);
        } else {
          m.isFinal = false;
        }


      }

      if (_.where(g.moveHistory, m).length === 0){
        moves.push(m);
      }
    }
    return moves;
  }

  function movePiece(src, dest) {
    // If it wasn't given a dest, we assume that src is of type Move
    if(!dest) {
      dest = {
        x: src.destX,
        y: src.destY
      };

      src = {
        x: src.srcX,
        y: src.srcY
      };
    }

    g.board[dest.x][dest.y] = g.board[src.x][src.y];
    g.board[src.x][src.y] = null;
    g.board[dest.x][dest.y].x = dest.x;
    g.board[dest.x][dest.y].y = dest.y;

    if(g.board[dest.x][dest.y].isAlly && dest.y === 0) {
      g.board[dest.x][dest.y].isKing = true;
    } else if(!g.board[dest.x][dest.y].isAlly && dest.y === g.BOARD_SIZE - 1) {
      g.board[dest.x][dest.y].isKing = true;
    }
  }

  function pieceCaptured(piece){
    g.board[piece.x][piece.y] = null;
    var enemyWon = true;
    var allyWon = true;

    for (var i = g.BOARD_SIZE - 1; i >= 0; i--) {
      for (var j = g.BOARD_SIZE- 1; j >= 0; j--) {
        if (!enemyWon && !allyWon) return;
        var p = g.board[i][j];
        if(p) {
          if (p.isAlly) {
            enemyWon = false;
          } else {
            allyWon = false;
          }
        }
      }
    }
    if (enemyWon) g.state = g.GameState.LOST;
    else g.state = g.GameState.WON;
    return;
  }

  function getMiddle(move){
    return {
      x: (move.destX - move.srcX)/2 + move.srcX,
      y: (move.destY - move.srcY)/2 + move.srcY
    };
  }

  function makeEnemyMoves(moves) {
    moves.map(reverseMove).map(movePiece);
  }
})(__GLOBAL, __DISPLAY, __LOGIC);
