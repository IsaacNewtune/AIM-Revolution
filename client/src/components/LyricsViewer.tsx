import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Eye, EyeOff } from "lucide-react";

interface LyricLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface LyricsViewerProps {
  lyrics: LyricLine[];
  currentTime: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
  className?: string;
}

export default function LyricsViewer({ 
  lyrics, 
  currentTime, 
  isVisible, 
  onToggleVisibility,
  className = "" 
}: LyricsViewerProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Find current playing lyric line
  useEffect(() => {
    const currentLine = lyrics.findIndex(line => 
      currentTime >= line.startTime && currentTime <= line.endTime
    );
    setCurrentLineIndex(currentLine >= 0 ? currentLine : null);
  }, [currentTime, lyrics]);

  // Auto-scroll to current line
  useEffect(() => {
    if (autoScroll && currentLineIndex !== null) {
      const element = document.getElementById(`lyric-line-${currentLineIndex}`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [currentLineIndex, autoScroll]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <Button
          variant="outline"
          onClick={onToggleVisibility}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Show Lyrics
        </Button>
      </div>
    );
  }

  if (lyrics.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-4 text-gray-500">
            <Music className="h-12 w-12" />
            <div>
              <h3 className="font-medium mb-1">No Lyrics Available</h3>
              <p className="text-sm">Lyrics haven't been added for this song yet.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Lyrics</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className={autoScroll ? "bg-ai-purple/10" : ""}
            >
              Auto-scroll {autoScroll ? "ON" : "OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleVisibility}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-80">
          <div className="space-y-1">
            {lyrics.map((line, index) => {
              const isPast = currentTime > line.endTime;
              const isCurrent = currentLineIndex === index;
              const isFuture = currentTime < line.startTime;

              return (
                <div
                  key={line.id}
                  id={`lyric-line-${index}`}
                  className={`
                    px-3 py-2 rounded-lg transition-all duration-300 cursor-pointer
                    ${isCurrent 
                      ? 'bg-ai-purple text-white shadow-lg scale-105 font-medium' 
                      : isPast 
                      ? 'text-gray-400 hover:text-gray-600' 
                      : isFuture
                      ? 'text-gray-600 hover:text-gray-800'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => {
                    // Could implement seek functionality here
                    console.log(`Clicked on line at ${line.startTime}s`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`
                      ${isCurrent ? 'text-lg' : 'text-base'}
                      transition-all duration-300
                    `}>
                      {line.text}
                    </span>
                    <span className={`
                      text-xs opacity-60 ml-2
                      ${isCurrent ? 'text-white' : 'text-gray-500'}
                    `}>
                      {formatTime(line.startTime)}
                    </span>
                  </div>
                  
                  {isCurrent && (
                    <div className="mt-1">
                      <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-100 ease-linear"
                          style={{
                            width: `${Math.min(100, ((currentTime - line.startTime) / (line.endTime - line.startTime)) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Progress indicator */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {currentLineIndex !== null && (
            <span>
              Line {currentLineIndex + 1} of {lyrics.length}
              {lyrics[currentLineIndex] && (
                <span className="ml-2">
                  ({formatTime(lyrics[currentLineIndex].startTime)} - {formatTime(lyrics[currentLineIndex].endTime)})
                </span>
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}