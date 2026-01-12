"use client"

import { useEffect, useState } from "react"

interface ChannelInfoOverlayProps {
  channelNumber: number
  channelName: string
  onFadeComplete: () => void
}

export function ChannelInfoOverlay({ channelNumber, channelName, onFadeComplete }: ChannelInfoOverlayProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onFadeComplete, 300) // Wait for fade animation
    }, 2700) // Start fading at 2.7s to complete at 3s

    return () => clearTimeout(timer)
  }, [onFadeComplete])

  return (
    <div
      className={`absolute top-6 right-6 text-white text-right transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ top: "25px", right: "25px" }}
    >
      <div className="text-4xl font-bold">{channelNumber}</div>
      <div className="text-lg">{channelName}</div>
    </div>
  )
}
