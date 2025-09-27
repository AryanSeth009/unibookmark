"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Bookmark } from "@/types/bookmark";

interface YouTubePlayerProps {
  bookmark: Bookmark; // Changed from videoId to bookmark
  isApiReady: boolean; // New prop
  onReady?: (player: YT.Player) => void;
  onStateChange?: (event: YT.OnStateChangeEvent) => void;
  onEnded?: () => void; // New prop for when the video ends
  playerRef?: React.MutableRefObject<YT.Player | null>; // New prop to pass ref
}

const getYouTubeVideoId = (url: string): string | null => {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|music\.youtube\.com\/)([^"&?\/ ]{11})/;
  const match = url.match(youtubeRegex);
  return match ? match[1] : null;
};

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ bookmark, isApiReady, onReady, onStateChange, onEnded, playerRef }) => {
  const playerRefInternal = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<YT.Player | null>(null);

  useEffect(() => {
    const videoId = getYouTubeVideoId(bookmark.url);
    if (!videoId) {
      console.error("Invalid YouTube URL or video ID not found:", bookmark.url);
      return;
    }

    console.log("YouTubePlayer useEffect triggered:", { videoId, isApiReady, windowYT: window.YT, playerRefCurrent: playerRefInternal.current });
    if (!isApiReady || !window.YT || !playerRefInternal.current) {
      console.log("YouTubePlayer initialization skipped due to missing prerequisites.");
      return;
    }

    console.log("Attempting to create new YouTube Player with videoId:", videoId);
    const newPlayer = new window.YT.Player(playerRefInternal.current, {
      videoId: videoId,
      playerVars: {
        autoplay: onEnded ? 1 : 0, // Autoplay if onEnded is provided (playlist mode)
        controls: 1,
        rel: 0, // Do not show related videos
        showinfo: 0, // Do not show video title and uploader info
        modestbranding: 1, // Use a modest player branding
      },
      events: {
        onReady: (event) => {
          setPlayer(event.target);
          if (onReady) onReady(event.target);
          if (playerRef) playerRef.current = event.target; // Set the external ref
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            if (onEnded) onEnded();
          }
          if (onStateChange) onStateChange(event);
        },
      },
    });

    return () => {
      if (newPlayer && typeof newPlayer.destroy === 'function') {
        newPlayer.destroy();
      }
    };
  }, [bookmark.url, onReady, onStateChange, onEnded]); // Depend on bookmark.url

  return <div ref={playerRefInternal} className="aspect-video w-full" />;
};

export default YouTubePlayer;
