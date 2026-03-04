import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const ConfirmUpdateModal = ({ isOpen, onClose, onConfirm, templateName }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
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
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-background border border-border rounded-lg w-[400px] p-6'>
        <h3 className='text-lg font-semibold text-primary mb-4'>
          Template Already Exists
        </h3>

        <p className='text-foreground mb-6'>
          A template with the name "{templateName}" already exists. Do you want
          to update it?
        </p>

        <div className='flex justify-end gap-2'>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className='bg-primary text-primary-foreground hover:bg-primary/90'
          >
            Update
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmUpdateModal;
