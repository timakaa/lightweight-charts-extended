import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, templateName }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className='w-[400px] max-w-[400px]'>
      <DialogHeader>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete the template "{templateName}"? This
          action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant='ghost' onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant='destructive'>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ConfirmDeleteModal;
