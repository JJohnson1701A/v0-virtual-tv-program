"use client"

import { useEffect, useState } from "react"

interface ChannelInfoOverlayProps {
  channelNumber: number
  channelName: string
  duration: number // seconds before fade starts
  onFadeComplete: () => void
}

export function ChannelInfoOverlay({ channelNumber, channelName, duration, onFadeComplete }: ChannelInfoOverlayProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onFadeComplete, 1500) // Wait for 1.5s fade animation
    }, duration * 1000)

    return () => clearTimeout(timer)
  }, [duration, onFadeComplete])

  return (
    <div
      className={`absolute top-6 right-6 text-white text-right ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ top: "25px", right: "25px", transition: "opacity 1.5s ease-out" }}
    >
      <div className="text-4xl font-bold">{channelNumber}</div>
      <div className="text-lg">{channelName}</div>
    </div>
  )
}
