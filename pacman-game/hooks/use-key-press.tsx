"use client"

import { useEffect } from "react"

export function useKeyPress(targetKey: string, handler: () => void) {
  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        handler()
      }
    }

    window.addEventListener("keydown", keyHandler)
    return () => {
      window.removeEventListener("keydown", keyHandler)
    }
  }, [targetKey, handler])
}
