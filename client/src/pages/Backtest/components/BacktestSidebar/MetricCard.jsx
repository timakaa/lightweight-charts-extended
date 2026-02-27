const MetricCard = ({ title, value, colorClass = "" }) => {
  return (
    <div className='p-3 bg-[#0d0e10] rounded-lg border border-[#1f2024] hover:border-[#2a2e39] transition-colors'>
      <div className='text-gray-500 text-sm mb-1'>{title}</div>
      <div className={`text-lg font-medium ${colorClass}`}>{value}</div>
    </div>
  );
};

export default MetricCard;
