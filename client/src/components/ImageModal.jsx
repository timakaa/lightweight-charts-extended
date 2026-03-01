import { useEffect } from "react";

const ImageModal = ({ isOpen, onClose, imageUrl, altText }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]'
      onClick={handleBackdropClick}
    >
      <button
        onClick={onClose}
        className='absolute top-4 right-4 text-primary text-4xl hover:text-gray-300 transition-colors z-10'
        aria-label='Close'
      >
        ×
      </button>
      <div className='max-w-[95vw] max-h-[95vh] overflow-auto p-4'>
        <img
          src={imageUrl}
          alt={altText}
          className='w-auto h-auto max-w-full max-h-full object-contain cursor-default'
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default ImageModal;
