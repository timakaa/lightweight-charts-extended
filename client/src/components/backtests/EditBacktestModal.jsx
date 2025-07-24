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
      <div className='p-4 border-b border-modal-border'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-white'>Edit Backtest</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors'
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
              className='w-full px-3 py-2 bg-modal text-white rounded-md border border-modal-border focus:outline-none focus:border-blue-500'
              placeholder='Enter backtest title'
            />
          </div>
          <div className='flex justify-end gap-3'>
            <button
              type='submit'
              className='px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors'
              disabled={!title.trim()}
            >
              Save Changes
            </button>
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
      className='fixed cursor-default inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-modal rounded-lg w-[400px] flex flex-col'>
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
