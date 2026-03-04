import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, templateName }) => {
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
          Delete Template
        </h3>

        <p className='text-foreground mb-6'>
          Are you sure you want to delete the template "{templateName}"? This
          action cannot be undone.
        </p>

        <div className='flex justify-end gap-2'>
          <Button variant='ghost' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant='destructive'
            className='bg-red-600 text-white hover:bg-red-700'
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
