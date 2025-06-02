import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface Song {
  id: string;
  title: string;
  artist_name: string;
  audio_url?: string;
  cover_image_url?: string;
  duration?: number;
}

interface MusicPlayerContextType {
  // Current state
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  
  // Queue management
  queue: Song[];
  currentIndex: number;
  
  // Player controls
  play: (song?: Song) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Queue controls
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playQueue: (songs: Song[], startIndex?: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => next();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Update audio source when current song changes
  useEffect(() => {
    if (currentSong?.audio_url) {
      audioRef.current.src = currentSong.audio_url;
      audioRef.current.load();
    }
  }, [currentSong]);

  const play = (song?: Song) => {
    if (song) {
      setCurrentSong(song);
      // Add to queue if not already there
      if (!queue.find(q => q.id === song.id)) {
        setQueue(prev => [...prev, song]);
        setCurrentIndex(queue.length);
      } else {
        setCurrentIndex(queue.findIndex(q => q.id === song.id));
      }
    }
    audioRef.current.play().catch(console.error);
  };

  const pause = () => {
    audioRef.current.pause();
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const next = () => {
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentSong(queue[nextIndex]);
    }
  };

  const previous = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentSong(queue[prevIndex]);
    }
  };

  const seek = (time: number) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const setVolume = (newVolume: number) => {
    audioRef.current.volume = newVolume;
    setVolumeState(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const addToQueue = (song: Song) => {
    setQueue(prev => [...prev, song]);
  };

  const playNext = (song: Song) => {
    const nextIndex = currentIndex + 1;
    setQueue(prev => [
      ...prev.slice(0, nextIndex),
      song,
      ...prev.slice(nextIndex)
    ]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index <= currentIndex && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
    setCurrentSong(null);
    pause();
  };

  const playQueue = (songs: Song[], startIndex = 0) => {
    setQueue(songs);
    setCurrentIndex(startIndex);
    setCurrentSong(songs[startIndex]);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        currentIndex,
        play,
        pause,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        toggleMute,
        addToQueue,
        playNext,
        removeFromQueue,
        clearQueue,
        playQueue,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}