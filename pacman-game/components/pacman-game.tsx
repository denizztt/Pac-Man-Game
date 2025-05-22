"use client"

import { useEffect, useState, useRef } from "react"
import { useKeyPress } from "@/hooks/use-key-press"
import { Clock, Trophy } from "lucide-react"

// Game constants
const BASE_CELL_SIZE = 24

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: {
    gameSpeed: 180,
    ghostSpeed: 0.7, // Slower ghosts
    powerPellets: 6, // Daha fazla power pellet
    ghostChaseMode: false,
    gridScale: 0.8, // Daha küçük harita
  },
  medium: {
    gameSpeed: 150,
    ghostSpeed: 0.9,
    powerPellets: 4,
    ghostChaseMode: true,
    gridScale: 1.0, // Normal boyut
  },
  hard: {
    gameSpeed: 120,
    ghostSpeed: 1.2, // Faster ghosts
    powerPellets: 2, // Daha az power pellet
    ghostChaseMode: true,
    gridScale: 1.2, // Daha büyük harita
  },
}

// Entity types
type Position = {
  x: number
  y: number
}

type Direction = "up" | "down" | "left" | "right" | "none"

type Ghost = {
  position: Position
  direction: Direction
  color: string
  isVulnerable: boolean
  isEaten: boolean
  startPosition: Position
}

type GameState = {
  pacman: {
    position: Position
    direction: Direction
    nextDirection: Direction
    mouthOpen: boolean
    isPowered: boolean
  }
  ghosts: Ghost[]
  dots: Position[]
  powerPellets: Position[]
  score: number
  gameOver: boolean
  gameWon: boolean
  elapsedTime: number
}

type PacmanColor = "yellow" | "red" | "green" | "blue" | "pink"

// The maze layout: 0 = empty space, 1 = wall, 2 = dot, 3 = power pellet
const initialMaze = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 3, 1],
  [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
  [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

const translations = {
  en: {
    gameOver: "Game Over",
    youWin: "You Win!",
    pressR: "Press R to play again",
    score: "Score",
    time: "Time",
  },
  tr: {
    gameOver: "Oyun Bitti",
    youWin: "Kazandın!",
    pressR: "Tekrar oynamak için R'ye bas",
    score: "Skor",
    time: "Süre",
  },
}

// Pacman renk haritası
const pacmanColorMap = {
  yellow: "#ffff00",
  red: "#ff4d4d",
  green: "#4caf50",
  blue: "#2196f3",
  pink: "#ff69b4",
}

type PacmanGameProps = {
  difficulty: "easy" | "medium" | "hard"
  onScoreUpdate: (score: number) => void
  language: "en" | "tr"
  pacmanColor: PacmanColor
}

export default function PacmanGame({ difficulty, onScoreUpdate, language, pacmanColor = "yellow" }: PacmanGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [maze, setMaze] = useState<number[][]>([])
  const [gameState, setGameState] = useState<GameState>({
    pacman: {
      position: { x: 14, y: 23 },
      direction: "none",
      nextDirection: "none",
      mouthOpen: true,
      isPowered: false,
    },
    ghosts: [
      {
        position: { x: 14, y: 11 },
        direction: "up",
        color: "red",
        isVulnerable: false,
        isEaten: false,
        startPosition: { x: 14, y: 11 },
      },
      {
        position: { x: 12, y: 14 },
        direction: "left",
        color: "pink",
        isVulnerable: false,
        isEaten: false,
        startPosition: { x: 12, y: 14 },
      },
      {
        position: { x: 16, y: 14 },
        direction: "right",
        color: "cyan",
        isVulnerable: false,
        isEaten: false,
        startPosition: { x: 16, y: 14 },
      },
      {
        position: { x: 14, y: 14 },
        direction: "down",
        color: "orange",
        isVulnerable: false,
        isEaten: false,
        startPosition: { x: 14, y: 14 },
      },
    ],
    dots: [],
    powerPellets: [],
    score: 0,
    gameOver: false,
    gameWon: false,
    elapsedTime: 0,
  })

  const t = translations[language]
  const difficultySettings = DIFFICULTY_SETTINGS[difficulty]

  // Zorluk seviyesine göre hücre boyutunu ayarla
  const CELL_SIZE = BASE_CELL_SIZE * difficultySettings.gridScale
  const GRID_WIDTH = 28
  const GRID_HEIGHT = 31

  // Initialize the maze, dots and power pellets
  useEffect(() => {
    const dots: Position[] = []
    const powerPellets: Position[] = []
    const newMaze = JSON.parse(JSON.stringify(initialMaze))

    // Place power pellets based on difficulty
    let pelletCount = 0
    const maxPellets = difficultySettings.powerPellets

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (newMaze[y][x] === 2) {
          dots.push({ x, y })
        } else if (newMaze[y][x] === 3) {
          if (pelletCount < maxPellets) {
            powerPellets.push({ x, y })
            pelletCount++
          } else {
            // Convert extra power pellets to regular dots
            newMaze[y][x] = 2
            dots.push({ x, y })
          }
        }
      }
    }

    setMaze(newMaze)
    setGameState((prev) => ({ ...prev, dots, powerPellets }))
  }, [difficulty])

  // Handle key presses
  useKeyPress("ArrowUp", () => {
    setGameState((prev) => ({
      ...prev,
      pacman: { ...prev.pacman, nextDirection: "up" },
    }))
  })

  useKeyPress("ArrowDown", () => {
    setGameState((prev) => ({
      ...prev,
      pacman: { ...prev.pacman, nextDirection: "down" },
    }))
  })

  useKeyPress("ArrowLeft", () => {
    setGameState((prev) => ({
      ...prev,
      pacman: { ...prev.pacman, nextDirection: "left" },
    }))
  })

  useKeyPress("ArrowRight", () => {
    setGameState((prev) => ({
      ...prev,
      pacman: { ...prev.pacman, nextDirection: "right" },
    }))
  })

  // Timer for elapsed time
  useEffect(() => {
    if (gameState.gameOver || gameState.gameWon) return

    const timer = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        elapsedTime: prev.elapsedTime + 1,
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState.gameOver, gameState.gameWon])

  // Power mode timer
  useEffect(() => {
    if (!gameState.pacman.isPowered) return

    const powerTimer = setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        pacman: { ...prev.pacman, isPowered: false },
        ghosts: prev.ghosts.map((ghost) => ({
          ...ghost,
          isVulnerable: false,
        })),
      }))
    }, 8000) // Power mode lasts for 8 seconds

    return () => clearTimeout(powerTimer)
  }, [gameState.pacman.isPowered])

  // Update high score when game ends
  useEffect(() => {
    if (gameState.gameOver || gameState.gameWon) {
      onScoreUpdate(gameState.score)
    }
  }, [gameState.gameOver, gameState.gameWon, gameState.score, onScoreUpdate])

  // Game loop
  useEffect(() => {
    if (gameState.gameOver || gameState.gameWon) return

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        // Check if game is won
        if (prev.dots.length === 0) {
          return { ...prev, gameWon: true }
        }

        // Update pacman direction if possible
        let direction = prev.pacman.direction
        const nextDirection = prev.pacman.nextDirection

        if (nextDirection !== "none") {
          const newPos = getNextPosition(prev.pacman.position, nextDirection)
          if (isValidMove(newPos)) {
            direction = nextDirection
          }
        }

        // Move pacman
        const newPacmanPos = getNextPosition(prev.pacman.position, direction)
        if (!isValidMove(newPacmanPos)) {
          return { ...prev, pacman: { ...prev.pacman, direction } }
        }

        // Check if pacman eats a dot
        const dotIndex = prev.dots.findIndex((dot) => dot.x === newPacmanPos.x && dot.y === newPacmanPos.y)
        const newDots = [...prev.dots]
        let newScore = prev.score

        if (dotIndex !== -1) {
          newDots.splice(dotIndex, 1)
          newScore += 10
        }

        // Check if pacman eats a power pellet
        const pelletIndex = prev.powerPellets.findIndex(
          (pellet) => pellet.x === newPacmanPos.x && pellet.y === newPacmanPos.y,
        )
        const newPowerPellets = [...prev.powerPellets]
        let isPowered = prev.pacman.isPowered

        if (pelletIndex !== -1) {
          newPowerPellets.splice(pelletIndex, 1)
          newScore += 50
          isPowered = true
        }

        // Move ghosts
        const newGhosts = prev.ghosts.map((ghost) => {
          if (ghost.isEaten) {
            // Return to starting position
            const distanceToStart =
              Math.abs(ghost.position.x - ghost.startPosition.x) + Math.abs(ghost.position.y - ghost.startPosition.y)

            if (distanceToStart <= 1) {
              return {
                ...ghost,
                position: { ...ghost.startPosition },
                isEaten: false,
                isVulnerable: prev.pacman.isPowered,
              }
            }

            // Move towards starting position
            const dx = ghost.startPosition.x - ghost.position.x
            const dy = ghost.startPosition.y - ghost.position.y

            let newDirection: Direction = ghost.direction

            if (Math.abs(dx) > Math.abs(dy)) {
              newDirection = dx > 0 ? "right" : "left"
            } else {
              newDirection = dy > 0 ? "down" : "up"
            }

            const newPos = getNextPosition(ghost.position, newDirection)
            if (isValidMove(newPos)) {
              return {
                ...ghost,
                position: newPos,
                direction: newDirection,
              }
            }

            return ghost
          }

          // Ghost AI based on difficulty
          let newDirection = ghost.direction

          // In chase mode, ghosts try to follow pacman
          if (difficultySettings.ghostChaseMode && !ghost.isVulnerable) {
            // Simple chase algorithm
            const dx = newPacmanPos.x - ghost.position.x
            const dy = newPacmanPos.y - ghost.position.y

            // Decide direction based on pacman's position
            if (Math.random() < 0.7) {
              // 70% chance to chase
              if (Math.abs(dx) > Math.abs(dy)) {
                newDirection = dx > 0 ? "right" : "left"
              } else {
                newDirection = dy > 0 ? "down" : "up"
              }
            } else {
              // Random movement 30% of the time
              const directions: Direction[] = ["up", "down", "left", "right"]
              newDirection = directions[Math.floor(Math.random() * directions.length)]
            }
          } else if (ghost.isVulnerable) {
            // Run away from pacman when vulnerable
            const dx = newPacmanPos.x - ghost.position.x
            const dy = newPacmanPos.y - ghost.position.y

            if (Math.random() < 0.7) {
              // 70% chance to flee
              if (Math.abs(dx) > Math.abs(dy)) {
                newDirection = dx > 0 ? "left" : "right"
              } else {
                newDirection = dy > 0 ? "up" : "down"
              }
            } else {
              // Random movement 30% of the time
              const directions: Direction[] = ["up", "down", "left", "right"]
              newDirection = directions[Math.floor(Math.random() * directions.length)]
            }
          } else {
            // Random movement for easy mode or when not vulnerable
            if (Math.random() < 0.3) {
              const directions: Direction[] = ["up", "down", "left", "right"]
              newDirection = directions[Math.floor(Math.random() * directions.length)]
            }
          }

          // Apply ghost speed based on difficulty
          if (Math.random() > difficultySettings.ghostSpeed) {
            return ghost // Skip movement this frame
          }

          const newPos = getNextPosition(ghost.position, newDirection)

          // If the move is not valid, try a different direction
          if (!isValidMove(newPos)) {
            const directions: Direction[] = ["up", "down", "left", "right"]
            const validDirections = directions.filter((dir) => {
              const pos = getNextPosition(ghost.position, dir)
              return isValidMove(pos)
            })

            if (validDirections.length > 0) {
              newDirection = validDirections[Math.floor(Math.random() * validDirections.length)]
              return {
                ...ghost,
                position: getNextPosition(ghost.position, newDirection),
                direction: newDirection,
                isVulnerable: isPowered,
              }
            }

            return {
              ...ghost,
              isVulnerable: isPowered,
            }
          }

          return {
            ...ghost,
            position: newPos,
            direction: newDirection,
            isVulnerable: isPowered,
          }
        })

        // Check for collision with ghosts
        const collidedGhostIndex = newGhosts.findIndex(
          (ghost) => ghost.position.x === newPacmanPos.x && ghost.position.y === newPacmanPos.y,
        )

        if (collidedGhostIndex !== -1) {
          const collidedGhost = newGhosts[collidedGhostIndex]

          if (collidedGhost.isVulnerable && !collidedGhost.isEaten) {
            // Eat the ghost
            newGhosts[collidedGhostIndex] = {
              ...collidedGhost,
              isEaten: true,
            }
            newScore += 200
          } else if (!collidedGhost.isVulnerable && !collidedGhost.isEaten) {
            return { ...prev, gameOver: true }
          }
        }

        return {
          ...prev,
          pacman: {
            ...prev.pacman,
            position: newPacmanPos,
            direction,
            mouthOpen: !prev.pacman.mouthOpen,
            isPowered,
          },
          ghosts: newGhosts,
          dots: newDots,
          powerPellets: newPowerPellets,
          score: newScore,
        }
      })
    }, difficultySettings.gameSpeed)

    return () => clearInterval(gameLoop)
  }, [gameState.gameOver, gameState.gameWon, maze, difficulty])

  // Helper function to get the next position based on direction
  function getNextPosition(position: Position, direction: Direction): Position {
    switch (direction) {
      case "up":
        return { x: position.x, y: position.y - 1 }
      case "down":
        return { x: position.x, y: position.y + 1 }
      case "left":
        return { x: position.x - 1, y: position.y }
      case "right":
        return { x: position.x + 1, y: position.y }
      default:
        return { ...position }
    }
  }

  // Helper function to check if a move is valid
  function isValidMove(position: Position): boolean {
    // Check bounds
    if (position.x < 0 || position.x >= GRID_WIDTH || position.y < 0 || position.y >= GRID_HEIGHT) {
      return false
    }

    // Check if the cell is a wall
    return maze[position.y]?.[position.x] !== 1
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Draw the game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw maze
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (maze[y]?.[x] === 1) {
          ctx.fillStyle = "#2121de"
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)

          // Add 3D effect to walls
          ctx.fillStyle = "#1a1ab9"
          ctx.fillRect(x * CELL_SIZE + CELL_SIZE - 4, y * CELL_SIZE, 4, CELL_SIZE)
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE - 4, CELL_SIZE, 4)
        }
      }
    }

    // Draw dots
    gameState.dots.forEach((dot) => {
      ctx.fillStyle = "#ffb8ae"
      ctx.beginPath()
      ctx.arc(dot.x * CELL_SIZE + CELL_SIZE / 2, dot.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 6, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw power pellets
    gameState.powerPellets.forEach((pellet) => {
      ctx.fillStyle = "#ffb8ae"

      // Pulsating effect
      const pulseSize = 1 + 0.2 * Math.sin(Date.now() / 200)

      ctx.beginPath()
      ctx.arc(
        pellet.x * CELL_SIZE + CELL_SIZE / 2,
        pellet.y * CELL_SIZE + CELL_SIZE / 2,
        (CELL_SIZE / 3) * pulseSize,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    })

    // Draw pacman with selected color
    const { position, direction, mouthOpen, isPowered } = gameState.pacman
    ctx.fillStyle = pacmanColorMap[pacmanColor]

    // Add glow effect when powered
    if (isPowered) {
      ctx.shadowColor = pacmanColorMap[pacmanColor]
      ctx.shadowBlur = 10
    }

    ctx.beginPath()

    const centerX = position.x * CELL_SIZE + CELL_SIZE / 2
    const centerY = position.y * CELL_SIZE + CELL_SIZE / 2
    const radius = CELL_SIZE / 2

    let startAngle = 0
    let endAngle = Math.PI * 2

    if (mouthOpen) {
      switch (direction) {
        case "right":
          startAngle = Math.PI / 6
          endAngle = Math.PI * 2 - Math.PI / 6
          break
        case "left":
          startAngle = Math.PI + Math.PI / 6
          endAngle = Math.PI - Math.PI / 6
          break
        case "up":
          startAngle = Math.PI * 1.5 + Math.PI / 6
          endAngle = Math.PI * 1.5 - Math.PI / 6
          break
        case "down":
          startAngle = Math.PI / 2 + Math.PI / 6
          endAngle = Math.PI / 2 - Math.PI / 6
          break
      }
    }

    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.lineTo(centerX, centerY)
    ctx.fill()

    // Reset shadow
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0

    // Draw ghosts
    gameState.ghosts.forEach((ghost) => {
      // Skip drawing if the ghost is eaten and returning to start
      if (ghost.isEaten) {
        // Draw only eyes for eaten ghosts
        const ghostX = ghost.position.x * CELL_SIZE
        const ghostY = ghost.position.y * CELL_SIZE

        // Draw eyes
        ctx.fillStyle = "white"
        ctx.beginPath()
        ctx.arc(ghostX + CELL_SIZE / 3, ghostY + CELL_SIZE / 2, CELL_SIZE / 6, 0, Math.PI * 2)
        ctx.arc(ghostX + (CELL_SIZE * 2) / 3, ghostY + CELL_SIZE / 2, CELL_SIZE / 6, 0, Math.PI * 2)
        ctx.fill()

        return
      }

      // Determine ghost color based on vulnerability
      ctx.fillStyle = ghost.isVulnerable
        ? Math.floor(Date.now() / 200) % 2 === 0
          ? "#2121de"
          : "#ffffff" // Flashing blue/white when vulnerable
        : ghost.color

      // Add glow effect for ghosts
      if (!ghost.isVulnerable) {
        ctx.shadowColor = ghost.color
        ctx.shadowBlur = 5
      }

      // Ghost body
      ctx.beginPath()
      const ghostX = ghost.position.x * CELL_SIZE
      const ghostY = ghost.position.y * CELL_SIZE

      // Draw ghost head (semi-circle)
      ctx.arc(ghostX + CELL_SIZE / 2, ghostY + CELL_SIZE / 2 - 2, CELL_SIZE / 2, Math.PI, 0, false)

      // Draw ghost skirt
      ctx.lineTo(ghostX + CELL_SIZE, ghostY + CELL_SIZE)

      // Draw wavy bottom
      const waveSize = CELL_SIZE / 4
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(ghostX + CELL_SIZE - i * waveSize, ghostY + CELL_SIZE - (i % 2) * waveSize)
      }

      ctx.lineTo(ghostX, ghostY + CELL_SIZE)
      ctx.lineTo(ghostX, ghostY + CELL_SIZE / 2)
      ctx.fill()

      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0

      // Draw eyes
      ctx.fillStyle = "white"
      ctx.beginPath()
      ctx.arc(ghostX + CELL_SIZE / 3, ghostY + CELL_SIZE / 2, CELL_SIZE / 6, 0, Math.PI * 2)
      ctx.arc(ghostX + (CELL_SIZE * 2) / 3, ghostY + CELL_SIZE / 2, CELL_SIZE / 6, 0, Math.PI * 2)
      ctx.fill()

      // Draw pupils
      ctx.fillStyle = "black"

      // Adjust pupil position based on ghost direction
      let pupilOffsetX = 0
      let pupilOffsetY = 0

      switch (ghost.direction) {
        case "left":
          pupilOffsetX = -2
          break
        case "right":
          pupilOffsetX = 2
          break
        case "up":
          pupilOffsetY = -2
          break
        case "down":
          pupilOffsetY = 2
          break
      }

      ctx.beginPath()
      ctx.arc(
        ghostX + CELL_SIZE / 3 + pupilOffsetX,
        ghostY + CELL_SIZE / 2 + pupilOffsetY,
        CELL_SIZE / 10,
        0,
        Math.PI * 2,
      )
      ctx.arc(
        ghostX + (CELL_SIZE * 2) / 3 + pupilOffsetX,
        ghostY + CELL_SIZE / 2 + pupilOffsetY,
        CELL_SIZE / 10,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    })

    // Draw game over or win message
    if (gameState.gameOver || gameState.gameWon) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = "30px Arial"
      ctx.fillStyle = "white"
      ctx.textAlign = "center"

      if (gameState.gameOver) {
        ctx.fillText(t.gameOver, canvas.width / 2, canvas.height / 2 - 15)
      } else {
        ctx.fillText(t.youWin, canvas.width / 2, canvas.height / 2 - 15)
      }

      ctx.font = "20px Arial"
      ctx.fillText(`${t.score}: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20)
      ctx.fillText(`${t.time}: ${formatTime(gameState.elapsedTime)}`, canvas.width / 2, canvas.height / 2 + 50)

      ctx.font = "16px Arial"
      ctx.fillText(t.pressR, canvas.width / 2, canvas.height / 2 + 80)
    }
  }, [gameState, maze, language, t, pacmanColor])

  return (
    <div className="flex flex-col items-center bg-zinc-900 rounded-lg p-4 shadow-lg">
      <div className="flex justify-between w-full mb-4">
        <div className="flex items-center gap-2 text-white">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span className="text-xl">
            {t.score}: {gameState.score}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Clock className="h-5 w-5 text-blue-400" />
          <span className="text-xl">
            {t.time}: {formatTime(gameState.elapsedTime)}
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={GRID_WIDTH * CELL_SIZE}
        height={GRID_HEIGHT * CELL_SIZE}
        className="bg-black rounded-lg shadow-xl border-4 border-blue-900"
      />
    </div>
  )
}
