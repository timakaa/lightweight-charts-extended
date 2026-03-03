import DeleteButton from "./DeleteButton";

const ChartContainer = ({
  chartContainerRef,
  hasSelectedDrawing,
  onDeleteSelected,
}) => {
  return (
    <div className='relative w-full h-full'>
      <div ref={chartContainerRef} className='w-full h-full bg-background' />
      <DeleteButton onClick={onDeleteSelected} isVisible={hasSelectedDrawing} />
    </div>
  );
};

export default ChartContainer;
