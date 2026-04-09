import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const ConfirmUpdateModal = ({ isOpen, onClose, onConfirm, templateName }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className='w-[400px] max-w-[400px]'>
      <DialogHeader>
        <DialogTitle>Template Already Exists</DialogTitle>
        <DialogDescription>
          A template with the name "{templateName}" already exists. Do you want
          to update it?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant='ghost' onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          className='bg-primary text-primary-foreground hover:bg-primary/90'
        >
          Update
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ConfirmUpdateModal;
