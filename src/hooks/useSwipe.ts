'use client';

import React, { useState, useRef, useCallback } from 'react';

interface SwipeConfig {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp?: () => void;
  threshold?: number;
  verticalThreshold?: number;
  isProcessing: boolean;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  threshold = 100,
  verticalThreshold = 120,
  isProcessing,
}: SwipeConfig) {
  const [isDragging, setIsDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);

  const swipeDirection: 'left' | 'right' | 'up' | null =
    Math.abs(offsetY) > Math.abs(offsetX)
      ? offsetY < 0
        ? 'up'
        : null
      : offsetX > 0
        ? 'right'
        : offsetX < 0
          ? 'left'
          : null;

  const swipeOpacity = isDragging
    ? Math.min(
        Math.max(Math.abs(offsetX) / threshold, Math.abs(offsetY) / verticalThreshold),
        1,
      )
    : 0;

  const getClientX = (e: React.MouseEvent | React.TouchEvent) =>
    'touches' in e ? e.touches[0].clientX : e.clientX;

  const getClientY = (e: React.MouseEvent | React.TouchEvent) =>
    'touches' in e ? e.touches[0].clientY : e.clientY;

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isProcessing) return;
      if (e.target instanceof HTMLElement && e.target.closest('button')) {
        return;
      }
      setIsDragging(true);
      startX.current = getClientX(e);
      startY.current = getClientY(e);
    },
    [isProcessing],
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || isProcessing) return;
      e.preventDefault();
      const currentX = getClientX(e);
      const currentY = getClientY(e);
      setOffsetX(currentX - startX.current);
      setOffsetY(currentY - startY.current);
    },
    [isDragging, isProcessing],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging || isProcessing) return;

    if (offsetX > threshold) {
      onSwipeRight();
    } else if (offsetX < -threshold) {
      onSwipeLeft();
    } else if (-offsetY > verticalThreshold && onSwipeUp) {
      onSwipeUp();
    }

    setIsDragging(false);
    setOffsetX(0);
    setOffsetY(0);
  }, [isDragging, isProcessing, offsetX, offsetY, threshold, verticalThreshold, onSwipeLeft, onSwipeRight, onSwipeUp]);

  const getTransformStyle = () => {
    if (isDragging) {
      return {
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${offsetX / 20}deg)`,
        transition: 'none',
      };
    }
    return {
      transform: 'translate(0px, 0px) rotate(0deg)',
      transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
    };
  };

  const swipeHandlers = {
    onMouseDown: handleDragStart,
    onTouchStart: handleDragStart,
    onMouseMove: handleDragMove,
    onTouchMove: handleDragMove,
    onMouseUp: handleDragEnd,
    onMouseLeave: handleDragEnd,
    onTouchEnd: handleDragEnd,
  };

  return { swipeHandlers, getTransformStyle, swipeDirection, swipeOpacity, isDragging };
}
