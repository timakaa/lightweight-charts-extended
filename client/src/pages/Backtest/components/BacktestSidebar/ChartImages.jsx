import { useState } from "react";
import ImageModal from "@components/ImageModal";

const ChartImages = ({ chartImages }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!chartImages || chartImages.length === 0) return null;

  const getImageUrl = (imageKey) =>
    `${import.meta.env.VITE_API_URL}/api/v1/backtest/image/${imageKey}`;

  return (
    <>
      <div className='mb-6'>
        <h2 className='mx-5 font-bold text-2xl py-2.5 border-[#1f2024]'>
          Charts
        </h2>
        <div className='mx-5 mt-2 space-y-3'>
          {chartImages.map((imageKey, index) => (
            <div
              key={index}
              className='rounded-lg border border-border overflow-hidden cursor-pointer hover:border-[#2a2e39] transition-colors'
              onClick={() =>
                setSelectedImage({
                  url: getImageUrl(imageKey),
                  alt: `Chart ${index + 1}`,
                })
              }
            >
              <img
                src={getImageUrl(imageKey)}
                alt={`Chart ${index + 1}`}
                className='w-full h-auto'
                onError={(e) => {
                  e.target.style.display = "none";
                  console.error(`Failed to load image: ${imageKey}`);
                }}
              />
            </div>
          ))}
        </div>
        <hr className='border-[#1f2024] my-5' />
      </div>

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.url}
        altText={selectedImage?.alt}
      />
    </>
  );
};

export default ChartImages;
