import React, { useState } from 'react';
import styled from 'styled-components';

const StarRatingContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const Star = styled.span`
  font-size: ${props => props.size || '24px'};
  cursor: ${props => props.interactive ? 'pointer' : 'default'};
  color: #ffc107;
  position: relative;
  user-select: none;
  transition: transform 0.1s ease;

  &:hover {
    transform: ${props => props.interactive ? 'scale(1.1)' : 'none'};
  }
`;

const StarIcon = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  width: ${props => props.fillPercentage}%;
  color: #ffc107;
`;

const StarOutline = styled.span`
  color: #e0e0e0;
`;

const RatingText = styled.span`
  margin-left: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
`;

const StarRating = React.memo(({
  value = 0,
  onChange = null,
  max = 5,
  size = '24px',
  showValue = false,
  allowHalf = true,
  disabled = false,
}) => {
  const [hoverValue, setHoverValue] = useState(null);
  const interactive = onChange && !disabled;

  const handleStarClick = React.useCallback((index) => {
    if (!interactive || !onChange) return;

    const clickedValue = index + 1;

    if (allowHalf) {
      // If clicking the same star, toggle between full and half
      if (clickedValue === value) {
        onChange(clickedValue - 0.5);
      } else if (clickedValue - 0.5 === value) {
        onChange(clickedValue);
      } else {
        onChange(clickedValue);
      }
    } else {
      onChange(clickedValue);
    }
  }, [interactive, onChange, allowHalf, value]);

  const handleStarHover = React.useCallback((index, half) => {
    if (!interactive) return;

    if (allowHalf && half) {
      setHoverValue(index + 0.5);
    } else {
      setHoverValue(index + 1);
    }
  }, [interactive, allowHalf]);

  const handleMouseLeave = React.useCallback(() => {
    setHoverValue(null);
  }, []);

  const getStarFillPercentage = React.useCallback((index) => {
    const displayValue = hoverValue !== null ? hoverValue : value;

    if (displayValue >= index + 1) {
      return 100; // Full star
    } else if (displayValue > index && displayValue < index + 1) {
      // Partial star (for half stars)
      return (displayValue - index) * 100;
    } else {
      return 0; // Empty star
    }
  }, [hoverValue, value]);

  const renderStar = React.useCallback((index) => {
    const fillPercentage = getStarFillPercentage(index);

    const handleMouseMove = (e) => {
      if (!interactive || !allowHalf) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const half = x < rect.width / 2;
      handleStarHover(index, half);
    };

    return (
      <Star
        key={index}
        size={size}
        interactive={interactive}
        onClick={() => handleStarClick(index)}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => handleStarHover(index, false)}
        onMouseLeave={handleMouseLeave}
      >
        <StarOutline>★</StarOutline>
        <StarIcon fillPercentage={fillPercentage}>★</StarIcon>
      </Star>
    );
  }, [size, interactive, getStarFillPercentage, handleStarClick, handleStarHover, handleMouseLeave, allowHalf]);

  const displayValue = hoverValue !== null ? hoverValue : value;
  const numericValue = parseFloat(displayValue) || 0;

  return (
    <StarRatingContainer>
      {[...Array(max)].map((_, index) => renderStar(index))}
      {showValue && (
        <RatingText>
          {numericValue.toFixed(1)} / {max}
        </RatingText>
      )}
    </StarRatingContainer>
  );
});

export default StarRating;
