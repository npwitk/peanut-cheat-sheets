import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    margin: 0;
    font-family: ${props => props.theme?.typography?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'};
    background: ${props => props.theme?.colors?.background || '#FFFFFF'};
    color: ${props => props.theme?.colors?.text || '#1D1D1F'};
    transition: background ${props => props.theme?.transitions?.normal || '0.25s ease'},
                color ${props => props.theme?.transitions?.normal || '0.25s ease'};
    line-height: ${props => props.theme?.typography?.lineHeights?.normal || 1.5};
    font-size: ${props => props.theme?.typography?.sizes?.base || '1rem'};
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    background: ${props => props.theme?.colors?.backgroundSecondary || '#F5F5F7'};
    padding: 0.125rem 0.375rem;
    border-radius: ${props => props.theme?.radius?.sm || '6px'};
    font-size: 0.9em;
  }

  a {
    color: ${props => props.theme?.colors?.primary || '#007AFF'};
    text-decoration: none;
    transition: color ${props => props.theme?.transitions?.fast || '0.15s ease'};

    &:hover {
      color: ${props => props.theme?.colors?.primaryHover || '#0051D5'};
    }
  }

  button {
    cursor: pointer;
    font-family: ${props => props.theme?.typography?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'};
  }

  input, textarea, select {
    font-family: ${props => props.theme?.typography?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'};
  }

  /* Custom scrollbar for webkit browsers */
  ::-webkit-scrollbar {
    width: 12px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme?.colors?.backgroundSecondary || '#F5F5F7'};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme?.colors?.textTertiary || '#86868B'};
    border-radius: ${props => props.theme?.radius?.sm || '6px'};

    &:hover {
      background: ${props => props.theme?.colors?.textSecondary || '#6E6E73'};
    }
  }

  /* Selection color */
  ::selection {
    background: ${props => props.theme?.colors?.primary || '#007AFF'};
    color: white;
  }
`;

export default GlobalStyles;
