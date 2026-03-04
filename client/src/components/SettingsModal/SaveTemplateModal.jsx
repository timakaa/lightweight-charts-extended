import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SaveTemplateModal = ({ isOpen, onClose, onSave }) => {
  const [templateName, setTemplateName] = useState("");

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

  useEffect(() => {
    if (isOpen) {
      setTemplateName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (templateName.trim()) {
      onSave(templateName.trim());
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-background border border-border rounded-lg w-[400px] p-6'>
        <h3 className='text-lg font-semibold text-primary mb-4'>
          Save Template
        </h3>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='block text-sm font-medium text-foreground mb-2'>
              Template Name
            </label>
            <Input
              type='text'
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder='Enter template name...'
              className='w-full'
              autoFocus
            />
          </div>

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!templateName.trim()}
              className='bg-primary text-primary-foreground hover:bg-primary/90'
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveTemplateModal;
