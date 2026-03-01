import React from "react";
import { Button } from "@/components/ui/button";

export const TickerModalHeader = ({ onClose }) => (
  <div className='flex items-center justify-between p-4 border-b border-border'>
    <h2 className='text-white text-lg font-semibold'>Select Symbol</h2>
    <Button
      variant='ghost'
      size='icon'
      onClick={onClose}
      className='text-gray-400 hover:text-white h-8 w-8'
    >
      ×
    </Button>
  </div>
);
