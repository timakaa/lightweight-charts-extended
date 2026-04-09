import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const SaveTemplateModal = ({ isOpen, onClose, onSave }) => {
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    if (isOpen) setTemplateName("");
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (templateName.trim()) onSave(templateName.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='w-[400px] max-w-[400px]'>
        <DialogHeader>
          <DialogTitle>Save Template</DialogTitle>
        </DialogHeader>
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
          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTemplateModal;
