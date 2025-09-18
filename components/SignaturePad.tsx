
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadRef {
  clear: () => void;
  getSignatureAsDataURL: () => string | null;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
    penColor?: string;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ penColor = 'black' }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCanvasContext = () => {
    return canvasRef.current?.getContext('2d');
  };

  const clear = () => {
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const getSignatureAsDataURL = () => {
    if (!hasDrawn) return null;
    const canvas = canvasRef.current;
    return canvas?.toDataURL('image/png') || null;
  };
  
  const isEmpty = () => !hasDrawn;

  useImperativeHandle(ref, () => ({
    clear,
    getSignatureAsDataURL,
    isEmpty
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(ratio, ratio);
        }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const ctx = getCanvasContext();
    if(ctx){
        ctx.strokeStyle = penColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [penColor]);

  const getCoordinates = (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : e;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e.nativeEvent);
    if (!coords) return;
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
      setHasDrawn(true);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e.nativeEvent);
    if (!coords) return;
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      className="w-full h-48 bg-slate-100 rounded-lg cursor-crosshair"
    />
  );
});
