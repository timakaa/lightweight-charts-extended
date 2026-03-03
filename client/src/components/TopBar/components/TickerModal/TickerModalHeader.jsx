import React from "react";
import { Button } from "@/components/ui/button";

export const TickerModalHeader = ({ onClose }) => (
  <div className='flex items-center justify-between p-4 border-b border-border'>
    <h2 className='text-primary text-lg font-semibold'>Select Symbol</h2>
    <Button
      variant='ghost'
      size='icon'
      onClick={onClose}
      className='text-primary/70 hover:text-primary h-8 w-8'
    >
      ✕
    </Button>
  </div>
);
