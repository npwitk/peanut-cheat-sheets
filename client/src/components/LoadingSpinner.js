import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: ${props => props.$fullHeight ? 'calc(100vh - 60px)' : '200px'};
  gap: 1rem;
`;

const Spinner = styled.div`
  border: 4px solid ${props => props.theme.colors.borderLight};
  border-top: 4px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  width: ${props => props.$size || '48px'};
  height: ${props => props.$size || '48px'};
  animation: ${spin} 0.8s linear infinite;
`;

const LoadingText = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.sizes.base};
  font-weight: ${props => props.theme.typography.weights.medium};
`;

const LoadingSpinner = ({ text = 'Loading...', size, fullHeight = true }) => {
  return (
    <SpinnerContainer $fullHeight={fullHeight}>
      <Spinner $size={size} />
      {text && <LoadingText>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
