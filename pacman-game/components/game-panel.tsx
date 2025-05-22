"use client"

import { useState, useEffect } from "react"
import PacmanGame from "@/components/pacman-game"
import ScoreBoard from "@/components/score-board"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Trophy, RotateCw, Palette } from "lucide-react"

type Difficulty = "easy" | "medium" | "hard"
type Language = "en" | "tr"
type PacmanColor = "yellow" | "red" | "green" | "blue" | "pink"

const translations = {
  en: {
    title: "Pacman Game",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    score: "Score",
    highScore: "High Score",
    time: "Time",
    restart: "Restart (Press R)",
    gameOver: "Game Over",
    youWin: "You Win!",
    pressR: "Press R to play again",
    scoreBoard: "Score Board",
    pacmanColor: "Pacman Color",
    yellow: "Yellow",
    red: "Red",
    green: "Green",
    blue: "Blue",
    pink: "Pink",
  },
  tr: {
    title: "Pacman Oyunu",
    difficulty: "Zorluk",
    easy: "Kolay",
    medium: "Orta",
    hard: "Zor",
    score: "Skor",
    highScore: "En Yüksek Skor",
    time: "Süre",
    restart: "Yeniden Başlat (R'ye Bas)",
    gameOver: "Oyun Bitti",
    youWin: "Kazandın!",
    pressR: "Tekrar oynamak için R'ye bas",
    scoreBoard: "Skor Tablosu",
    pacmanColor: "Pacman Rengi",
    yellow: "Sarı",
    red: "Kırmızı",
    green: "Yeşil",
    blue: "Mavi",
    pink: "Pembe",
  },
}

export default function GamePanel() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [language, setLanguage] = useState<Language>("en")
  const [pacmanColor, setPacmanColor] = useState<PacmanColor>("yellow")
  const [gameKey, setGameKey] = useState(0)
  const [highScores, setHighScores] = useLocalStorage<Record<Difficulty, number>>("pacman-high-scores", {
    easy: 0,
    medium: 0,
    hard: 0,
  })

  const t = translations[language]

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "tr" : "en"))
  }

  const restartGame = () => {
    setGameKey((prev) => prev + 1)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") {
        restartGame()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const updateHighScore = (score: number) => {
    if (score > highScores[difficulty]) {
      setHighScores({
        ...highScores,
        [difficulty]: score,
      })
    }
  }

  const changeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty)
    restartGame()
  }

  return (
    <div className="w-full max-w-5xl bg-zinc-800 rounded-xl shadow-2xl overflow-hidden">
      <div className="p-6 flex justify-between items-center border-b border-zinc-700">
        <h1 className="text-3xl font-bold text-yellow-400">{t.title}</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-10 h-10 p-0 overflow-hidden"
            onClick={toggleLanguage}
            title={language === "en" ? "Türkçe'ye geç" : "Switch to English"}
          >
            {language === "en" ? (
              <img src="/flags/tr-flag.png" alt="Türk Bayrağı" className="w-full h-full object-cover" />
            ) : (
              <img src="/flags/uk-flag.png" alt="UK Flag" className="w-full h-full object-cover" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title={t.pacmanColor}>
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPacmanColor("yellow")}>
                <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></div>
                {t.yellow}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPacmanColor("red")}>
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                {t.red}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPacmanColor("green")}>
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                {t.green}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPacmanColor("blue")}>
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                {t.blue}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPacmanColor("pink")}>
                <div className="w-4 h-4 rounded-full bg-pink-500 mr-2"></div>
                {t.pink}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" onClick={restartGame} title={t.restart}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        <div className="lg:col-span-3">
          <PacmanGame
            key={`${difficulty}-${gameKey}-${pacmanColor}`}
            difficulty={difficulty}
            onScoreUpdate={updateHighScore}
            language={language}
            pacmanColor={pacmanColor}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-zinc-700 rounded-lg p-4 h-full">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              {t.scoreBoard}
            </h2>
            <ScoreBoard highScores={highScores} language={language} />

            {/* Zorluk seviyesi seçimi */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-2">{t.difficulty}</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={difficulty === "easy" ? "default" : "outline"}
                  className={difficulty === "easy" ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => changeDifficulty("easy")}
                >
                  {t.easy}
                </Button>
                <Button
                  variant={difficulty === "medium" ? "default" : "outline"}
                  className={difficulty === "medium" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                  onClick={() => changeDifficulty("medium")}
                >
                  {t.medium}
                </Button>
                <Button
                  variant={difficulty === "hard" ? "default" : "outline"}
                  className={difficulty === "hard" ? "bg-red-600 hover:bg-red-700" : ""}
                  onClick={() => changeDifficulty("hard")}
                >
                  {t.hard}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
