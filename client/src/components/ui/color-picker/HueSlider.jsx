import { useRef, useState, useEffect } from "react";

export function HueSlider({ hue, onChange }) {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateFromMouse = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const h = (y / rect.height) * 360;
    onChange(h);
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
      ref={sliderRef}
      className='relative w-8 h-64 rounded-lg cursor-pointer select-none'
      style={{
        background:
          "linear-gradient(to bottom, #ff0000 0%, #ff8800 10%, #ffff00 20%, #00ff00 30%, #00ffff 50%, #0088ff 60%, #0000ff 70%, #8800ff 80%, #ff00ff 90%, #ff0088 100%)",
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className='absolute w-full h-1 border-2 border-white rounded-full shadow-lg pointer-events-none'
        style={{
          top: `${(hue / 360) * 100}%`,
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}
