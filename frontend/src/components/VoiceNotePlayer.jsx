import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

const VoiceNotePlayer = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState(Array(30).fill(0.5));
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging] = useState(false);
  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    let animationFrame;

    const updateWaveform = () => {
      if (isPlaying && waveformRef.current) {
        setWaveformData(Array(30).fill(0).map(() => Math.random() * 0.8 + 0.2));
        animationFrame = requestAnimationFrame(updateWaveform);
      }
    };

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      audio.volume = volume;
    });

    audio.addEventListener('timeupdate', () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setWaveformData(Array(30).fill(0.5));
    });

    audio.addEventListener('play', () => {
      updateWaveform();
    });

    audio.addEventListener('pause', () => {
      cancelAnimationFrame(animationFrame);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('timeupdate', () => {});
      audio.removeEventListener('ended', () => {});
      audio.removeEventListener('play', () => {});
      audio.removeEventListener('pause', () => {});
    };
  }, [isPlaying, volume, isDragging]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.volume = volume;
    } else {
      audio.volume = 0;
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleProgressClick = (e) => {
    const bounds = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50 backdrop-blur-sm hover:bg-base-200/70 transition-all">
      <button
        onClick={togglePlay}
        className="btn btn-circle btn-sm bg-primary text-primary-content hover:bg-primary/90"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className="flex-1">
        <div className="relative h-8" ref={waveformRef}>
          <div 
            className="absolute inset-0 flex items-center cursor-pointer"
            ref={progressRef}
            onClick={handleProgressClick}
          >
            <div className="w-full h-3 bg-base-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="flex justify-between h-full">
                  {waveformData.map((height, i) => (
                    <div
                      key={i}
                      className="w-0.5 h-full bg-primary-content/30 animate-wave"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: `${height * 100}%`,
                        transform: `scaleY(${height})`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs mt-1 text-base-content/70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="btn btn-ghost btn-sm btn-circle"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="range range-xs range-primary w-20"
        />
      </div>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
};

export default VoiceNotePlayer;