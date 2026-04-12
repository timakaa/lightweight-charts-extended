import { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const ImageModal = ({ isOpen, onClose, imageUrl, altText }) => {
  const lastImageUrl = useRef(imageUrl);
  const lastAltText = useRef(altText);
  if (isOpen) {
    lastImageUrl.current = imageUrl;
    lastAltText.current = altText;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className='p-0 max-w-[900px] max-h-[80vh] overflow-hidden cursor-auto outline-none'
        showCloseButton={false}
      >
        <div>
          <img
            src={lastImageUrl.current}
            alt={lastAltText.current}
            className='object-contain cursor-default'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
