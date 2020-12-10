import { Controller } from "stimulus"

export default class extends Controller {
  static targets = ["gameBoard", "playButton", "timerContainer", "timerText"]

  connect() {
    this.gameStarted = false
    this.boardSize = 20
    this.liveCells = {}
    this.deadCellsToBeProcessed = {}
    this.cellsForNextGeneration = {}

    this.renderBoard()
  }

  startGame(event) {
    event.preventDefault()

    if (this.gameStarted) {
      this.gameStarted = false
      this.playButtonTarget.classList.remove('timer--on')
      this.timerContainerTarget.classList.remove('timer--on')
      this.timerContainerTarget.readOnly = false;
      this.stopRefreshing()
    } else {
      this.gameStarted = true
      this.playButtonTarget.classList.add('timer--on')
      this.timerContainerTarget.classList.add('timer--on')
      this.timerContainerTarget.readOnly = true;
      this.startRefreshing()
    }
  }

  startRefreshing() {
    this.refreshTimer = setInterval(() => {
      this.processLiveCells()
    }, (this.timerContainerTarget.value * 1000))
  }

  stopRefreshing() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
  }

  updateSpeed(event) {
    event.preventDefault()

    this.timerTextTarget.innerHTML = this.timerText

    const timeInput = this.timerContainerTarget.value
    if (timeInput <= 0) {
      this.timerContainerTarget.value = 0.3
    }
  }

  get timerText() {
    const time = this.timerContainerTarget.value
    if (time > 1) {
      return "<p>seconds</p><p>per cycle</p>"
    } else {
      return "<p>second</p><p>per cycle</p>"
    }
  }

  updateCell(event) {
    event.preventDefault()

    if (!this.gameStarted) {
      const cellID = event.target.id
      const cellXcoordinate = cellID % this.boardSize
      var cellYcoordinate = 0
      if (cellID>0){
        cellYcoordinate = parseInt(cellID / this.boardSize)
      }
  
      if (this.liveCells.hasOwnProperty(cellID)){
        delete this.liveCells[cellID]
      } else {
        var newCell = {
          id: cellID,
          xCoord: cellXcoordinate,
          yCoord: cellYcoordinate,
          alive: true,
          numOfNeighbors: 0,
        }
        this.liveCells[cellID] = newCell
      }
  
      this.renderBoard()
    }
  }

  processLiveCells() {
    this.deadCellsToBeProcessed = {}

    for (var liveCell in this.liveCells) {
      this.liveCells[liveCell].numOfNeighbors = 0
      const startingXcoord = (this.liveCells[liveCell].xCoord - 1)
      const startingYcoord = (this.liveCells[liveCell].yCoord - 1)
      
      for(let row=startingXcoord; row <= startingXcoord+2; row++) {
        for(let col=startingYcoord; col <= startingYcoord+2; col++) {
          if((row<0) ||
            (row>=this.boardSize) ||
            (col<0) ||
            (col>=this.boardSize)||
            (row==startingXcoord+1)&&(col==startingYcoord+1)){
            continue
          } else {
            const cellID = this.getCellID(row, col)
            if(this.liveCells[cellID]){
              this.liveCells[liveCell].numOfNeighbors++
            } else {
              if(!this.deadCellsToBeProcessed[cellID]){
                var newCell = {
                  id: cellID,
                  xCoord: row,
                  yCoord: col,
                  alive: false,
                  numOfNeighbors: 1,
                }
                this.deadCellsToBeProcessed[cellID] = newCell
              } else {
                this.deadCellsToBeProcessed[cellID].numOfNeighbors++
              }
            }
          }
        }
      }
      const numOfNeighbors = this.liveCells[liveCell].numOfNeighbors
      if(numOfNeighbors==2 || numOfNeighbors==3) {
        this.cellsForNextGeneration[liveCell] = this.liveCells[liveCell]
      }
    }

    for (var deadCell in this.deadCellsToBeProcessed) {
      const numOfNeighbors = this.deadCellsToBeProcessed[deadCell].numOfNeighbors
      if(numOfNeighbors==3) {
        this.deadCellsToBeProcessed[deadCell].alive = true
        this.cellsForNextGeneration[deadCell] = this.deadCellsToBeProcessed[deadCell]
      }
    }

    this.liveCells = this.cellsForNextGeneration
    this.cellsForNextGeneration = {}

    this.renderBoard()
  }

  renderBoard() {
    const board = this.gameBoardTarget
    board.innerHTML = ""

    let cells = ""
    let cellID = 0

    for(let row=0; row < this.boardSize; row++) {
      for(let col=0; col < this.boardSize; col++) {
        if (this.liveCells[cellID]) {
          cells += `<div data-action="click->game#updateCell" class="board-cell cell-alive" id="${cellID}"></div>`
        } else {
          cells += `<div data-action="click->game#updateCell" class="board-cell" id="${cellID}"></div>`
        }
        cellID++
      }
    }

    board.innerHTML = cells
  }

  getCellID(coordX, coordY) {
    return (((coordX+1) + (coordY*this.boardSize)) - 1)
  }
}
