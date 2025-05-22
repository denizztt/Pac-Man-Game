import { Trophy, Award, Medal } from "lucide-react"

type ScoreBoardProps = {
  highScores: {
    easy: number
    medium: number
    hard: number
  }
  language: "en" | "tr"
}

const translations = {
  en: {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    noScores: "No scores yet",
  },
  tr: {
    easy: "Kolay",
    medium: "Orta",
    hard: "Zor",
    noScores: "Henüz skor yok",
  },
}

export default function ScoreBoard({ highScores, language }: ScoreBoardProps) {
  const t = translations[language]

  const hasScores = highScores.easy > 0 || highScores.medium > 0 || highScores.hard > 0

  return (
    <div className="space-y-4">
      {!hasScores ? (
        <div className="text-center text-zinc-400 py-8">{t.noScores}</div>
      ) : (
        <>
          <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <span className="text-white">{t.easy}</span>
            </div>
            <span className="text-xl font-bold text-green-500">{highScores.easy}</span>
          </div>

          <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-white">{t.medium}</span>
            </div>
            <span className="text-xl font-bold text-yellow-500">{highScores.medium}</span>
          </div>

          <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-red-500" />
              <span className="text-white">{t.hard}</span>
            </div>
            <span className="text-xl font-bold text-red-500">{highScores.hard}</span>
          </div>
        </>
      )}
    </div>
  )
}
