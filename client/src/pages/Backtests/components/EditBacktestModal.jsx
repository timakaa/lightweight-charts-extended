import { Button } from "@/components/ui/button";
import React, { useState, useRef, useEffect } from "react";

const EditBacktestModalContent = ({ onClose, onSave, initialTitle }) => {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(title);
  };

  return (
    <div className='flex flex-col h-full' onClick={(e) => e.stopPropagation()}>
      <div className='p-4 border border-border rounded-lg'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-primary'>Edit Backtest</h2>
          <button
            onClick={onClose}
            className='text-primary/70 hover:text-primary transition-colors'
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <input
              ref={inputRef}
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='w-full px-3 py-2 bg-background text-primary rounded-md border border-border focus:outline-none focus:border-blue-500'
              placeholder='Enter backtest title'
            />
          </div>
          <div className='flex justify-end gap-3'>
            <Button type='submit' disabled={!title.trim()}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditBacktestModal = ({ isOpen, onClose, onSave, initialTitle }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    e.stopPropagation(); // Stop propagation to parent modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed cursor-default inset-0 bg-background/30 flex items-center justify-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-background rounded-lg w-[400px] flex flex-col'>
        <EditBacktestModalContent
          onClose={onClose}
          onSave={onSave}
          initialTitle={initialTitle}
        />
      </div>
    </div>
  );
};

export default EditBacktestModal;
