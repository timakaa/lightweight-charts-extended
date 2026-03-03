import { useRef, useState, useEffect } from "react";

export function SaturationValuePicker({ hue, saturation, value, onChange }) {
  const pickerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateFromMouse = (e) => {
    if (!pickerRef.current) return;
    const rect = pickerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;
    onChange(s, v);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateFromMouse(e);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) updateFromMouse(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={pickerRef}
      className='relative w-full h-64 rounded-lg cursor-crosshair select-none'
      style={{
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className='absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none'
        style={{
          left: `${saturation}%`,
          top: `${100 - value}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
