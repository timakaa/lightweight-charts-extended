const ChartImages = ({ chartImages }) => {
  if (!chartImages || chartImages.length === 0) return null;

  return (
    <div className='mb-6'>
      <h2 className='mx-5 font-bold text-2xl py-2.5 border-[#1f2024]'>
        Charts
      </h2>
      <div className='mx-5 mt-2 space-y-3'>
        {chartImages.map((imageKey, index) => (
          <div
            key={index}
            className='bg-[#0d0e10] rounded-lg border border-[#1f2024] overflow-hidden'
          >
            <img
              src={`${import.meta.env.VITE_API_URL}/api/v1/backtest/image/${imageKey}`}
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
  );
};

export default ChartImages;
