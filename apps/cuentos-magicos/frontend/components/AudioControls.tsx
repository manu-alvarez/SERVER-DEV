"use client";

import { useState, useRef, useEffect } from "react";

interface AudioControlsProps {
  audioUrl?: string | null;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export default function AudioControls({
  audioUrl,
  autoPlay = false,
  onEnded,
}: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [audioUrl]);

  useEffect(() => {
    if (autoPlay && audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [audioUrl, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onEnded?.();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>🎙️</span>
        <span>Audio no disponible</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />

      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${
          isPlaying
            ? "bg-amber-500 text-white"
            : "bg-white/10 border border-white/20 hover:bg-white/20"
        }`}
        aria-label={isPlaying ? "Pausar" : "Reproducir"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-[10px] text-slate-400 w-8">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 rounded-full appearance-none bg-white/10 accent-amber-500 cursor-pointer"
          aria-label="Seek"
        />
        <span className="text-[10px] text-slate-400 w-8">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
