declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: { // More detailed YT type declaration
      Player: new (element: HTMLElement | string, options: YT.PlayerOptions) => YT.Player;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
      // Add other necessary YT properties or methods if used
    };
  }

  namespace YT {
    interface PlayerOptions {
      height?: string;
      width?: string;
      videoId?: string;
      playerVars?: {
        autoplay?: 0 | 1;
        controls?: 0 | 1;
        disablekb?: 0 | 1;
        enablejsapi?: 0 | 1;
        fs?: 0 | 1;
        hl?: string;
        iv_load_policy?: 1 | 3;
        modestbranding?: 0 | 1;
        origin?: string;
        rel?: 0 | 1;
        showinfo?: 0 | 1;
        start?: number;
        end?: number;
        loop?: 0 | 1;
        playlist?: string;
      };
      events?: { 
        onReady?: (event: { target: YT.Player }) => void; 
        onStateChange?: (event: YT.OnStateChangeEvent) => void; 
        onPlaybackQualityChange?: (event: { target: YT.Player; data: string }) => void; 
        onPlaybackRateChange?: (event: { target: YT.Player; data: number }) => void; 
        onError?: (event: { target: YT.Player; data: number }) => void; 
        onApiChange?: (event: { target: YT.Player }) => void; 
      };
    }

    interface Player {
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      getDuration(): number;
      getCurrentTime(): number;
      getVolume(): number;
      setVolume(volume: number): void;
      isMuted(): boolean;
      mute(): void;
      unMute(): void;
      getPlaylist(): string[];
      getPlaylistIndex(): number;
      loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
      cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
      destroy(): void;
      // Add other necessary player methods
    }

    interface OnStateChangeEvent {
      data: number;
      target: YT.Player;
    }
  }
}

export {};
