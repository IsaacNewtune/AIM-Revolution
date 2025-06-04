import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, SkipBack, SkipForward, Save, Plus, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LyricLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface LyricsEditorProps {
  songId: string;
  audioUrl: string;
  onSave: (lyrics: LyricLine[]) => void;
  initialLyrics?: LyricLine[];
}

export default function LyricsEditor({ songId, audioUrl, onSave, initialLyrics = [] }: LyricsEditorProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>(initialLyrics);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [rawLyricsText, setRawLyricsText] = useState("");
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeedState] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Find current playing lyric line
  useEffect(() => {
    const currentLine = lyrics.findIndex(line => 
      currentTime >= line.startTime && currentTime <= line.endTime
    );
    setCurrentLineIndex(currentLine >= 0 ? currentLine : null);
  }, [currentTime, lyrics]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekAudio = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const setPlaybackSpeed = (speed: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    setPlaybackSpeedState(speed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseLyricsFromText = () => {
    if (!rawLyricsText.trim()) return;

    const lines = rawLyricsText.split('\n').filter(line => line.trim());
    const newLyrics: LyricLine[] = lines.map((text, index) => ({
      id: `line-${Date.now()}-${index}`,
      text: text.trim(),
      startTime: 0,
      endTime: 0,
    }));

    setLyrics(newLyrics);
    setRawLyricsText("");
    toast({ title: "Lyrics imported", description: "Now set the timing for each line" });
  };

  const addEmptyLine = () => {
    const newLine: LyricLine = {
      id: `line-${Date.now()}`,
      text: "",
      startTime: currentTime,
      endTime: currentTime + 2,
    };
    setLyrics([...lyrics, newLine]);
  };

  const updateLyricLine = (index: number, field: keyof LyricLine, value: string | number) => {
    const updatedLyrics = [...lyrics];
    updatedLyrics[index] = { ...updatedLyrics[index], [field]: value };
    setLyrics(updatedLyrics);
  };

  const deleteLine = (index: number) => {
    const updatedLyrics = lyrics.filter((_, i) => i !== index);
    setLyrics(updatedLyrics);
  };

  const setStartTime = (index: number) => {
    updateLyricLine(index, 'startTime', currentTime);
  };

  const setEndTime = (index: number) => {
    updateLyricLine(index, 'endTime', currentTime);
  };

  const handleSave = () => {
    if (lyrics.length === 0) {
      toast({ title: "No lyrics to save", variant: "destructive" });
      return;
    }

    // Validate all lines have timing
    const invalidLines = lyrics.filter(line => line.startTime >= line.endTime);
    if (invalidLines.length > 0) {
      toast({ 
        title: "Invalid timing", 
        description: "Some lines have invalid start/end times",
        variant: "destructive" 
      });
      return;
    }

    onSave(lyrics);
    toast({ title: "Lyrics saved successfully!" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Audio Player and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Audio Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <audio ref={audioRef} src={audioUrl} preload="metadata" />
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div 
              className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickTime = (clickX / rect.width) * duration;
                seekAudio(clickTime);
              }}
            >
              <div 
                className="h-full bg-ai-purple rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {/* Lyric markers */}
              {lyrics.map((line, index) => (
                <div
                  key={line.id}
                  className="absolute top-0 h-full w-1 bg-yellow-400 opacity-75"
                  style={{ left: `${(line.startTime / duration) * 100}%` }}
                  title={`${line.text} (${formatTime(line.startTime)})`}
                />
              ))}
            </div>
          </div>

          {/* Enhanced Playback Controls */}
          <div className="space-y-3">
            {/* Fine Navigation Controls */}
            <div className="flex justify-center gap-1">
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.max(0, currentTime - 30))}>
                -30s
              </Button>
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.max(0, currentTime - 10))}>
                -10s
              </Button>
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.max(0, currentTime - 5))}>
                -5s
              </Button>
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.max(0, currentTime - 1))}>
                -1s
              </Button>
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.max(0, currentTime - 0.1))}>
                -0.1s
              </Button>
            </div>

            {/* Main Controls */}
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.max(0, currentTime - 10))}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button onClick={togglePlayPause} size="lg">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.min(duration, currentTime + 10))}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Fine Forward Controls */}
            <div className="flex justify-center gap-1">
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.min(duration, currentTime + 0.1))}>
                +0.1s
              </Button>
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.min(duration, currentTime + 1))}>
                +1s
              </Button>
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.min(duration, currentTime + 5))}>
                +5s
              </Button>
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.min(duration, currentTime + 10))}>
                +10s
              </Button>
              <Button variant="outline" size="sm" onClick={() => seekAudio(Math.min(duration, currentTime + 30))}>
                +30s
              </Button>
            </div>

            {/* Playback Speed Controls */}
            <div className="space-y-2">
              <div className="text-center text-sm text-gray-600">
                Playback Speed: {playbackSpeed}x
              </div>
              <div className="flex justify-center gap-2">
                <Button 
                  variant={playbackSpeed === 0.5 ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setPlaybackSpeed(0.5)}
                >
                  0.5x
                </Button>
                <Button 
                  variant={playbackSpeed === 0.75 ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setPlaybackSpeed(0.75)}
                >
                  0.75x
                </Button>
                <Button 
                  variant={playbackSpeed === 1 ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setPlaybackSpeed(1)}
                >
                  1x
                </Button>
                <Button 
                  variant={playbackSpeed === 1.25 ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setPlaybackSpeed(1.25)}
                >
                  1.25x
                </Button>
                <Button 
                  variant={playbackSpeed === 1.5 ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setPlaybackSpeed(1.5)}
                >
                  1.5x
                </Button>
              </div>
            </div>
          </div>

          {/* Current Time Display */}
          <div className="text-center">
            <span className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Import Lyrics */}
          <div className="space-y-2">
            <Label>Import Raw Lyrics</Label>
            <Textarea
              placeholder="Paste your lyrics here, one line per row..."
              value={rawLyricsText}
              onChange={(e) => setRawLyricsText(e.target.value)}
              rows={4}
            />
            <Button onClick={parseLyricsFromText} disabled={!rawLyricsText.trim()}>
              Import Lyrics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lyrics Editor */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Synchronized Lyrics</CardTitle>
            <div className="flex gap-2">
              <Button onClick={addEmptyLine} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </Button>
              <Button onClick={handleSave} className="bg-ai-purple">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {lyrics.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No lyrics added yet. Import lyrics or add lines manually.
                </div>
              ) : (
                lyrics.map((line, index) => (
                  <div
                    key={line.id}
                    className={`p-3 border rounded-lg space-y-2 transition-colors ${
                      currentLineIndex === index
                        ? 'bg-ai-purple/10 border-ai-purple'
                        : selectedLineIndex === index
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedLineIndex(index)}
                  >
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          value={line.text}
                          onChange={(e) => updateLyricLine(index, 'text', e.target.value)}
                          placeholder="Lyric text..."
                          className="mb-2"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Label className="text-xs">Start</Label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setStartTime(index)}
                                className="h-6 px-2 text-xs"
                              >
                                Set
                              </Button>
                            </div>
                            <Input
                              type="number"
                              step="0.1"
                              value={line.startTime}
                              onChange={(e) => updateLyricLine(index, 'startTime', parseFloat(e.target.value))}
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Label className="text-xs">End</Label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEndTime(index)}
                                className="h-6 px-2 text-xs"
                              >
                                Set
                              </Button>
                            </div>
                            <Input
                              type="number"
                              step="0.1"
                              value={line.endTime}
                              onChange={(e) => updateLyricLine(index, 'endTime', parseFloat(e.target.value))}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(line.startTime)} → {formatTime(line.endTime)}
                      {currentLineIndex === index && (
                        <span className="ml-2 text-ai-purple font-medium">● PLAYING</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}