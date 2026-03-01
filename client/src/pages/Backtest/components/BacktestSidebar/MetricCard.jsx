const MetricCard = ({ title, value, colorClass = "" }) => {
  return (
    <div className='p-3 bg-background rounded-lg border border-border hover:border-primary/20 transition-colors'>
      <div className='text-gray-500 text-sm mb-1'>{title}</div>
      <div className={`text-lg font-medium ${colorClass}`}>{value}</div>
    </div>
  );
};

export default MetricCard;
