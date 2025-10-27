import React from 'react';
import styled from 'styled-components';

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  border-radius: ${props => props.theme.radius.md};
  box-shadow: ${props => props.theme.shadows.sm};
  background: ${props => props.theme.colors.backgroundSecondary};
`;

const VideoIframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: ${props => props.theme.radius.md};
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
`;

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
const extractVideoId = (url) => {
  if (!url) return null;

  // Try different YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

const YouTubeEmbed = ({ url, title = 'YouTube video' }) => {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return (
      <ErrorMessage>
        Invalid YouTube URL. Please check the link.
      </ErrorMessage>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <VideoContainer>
      <VideoIframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </VideoContainer>
  );
};

export default YouTubeEmbed;
