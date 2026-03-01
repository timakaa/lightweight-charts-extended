const BalanceCards = ({ initialBalance, finalBalance }) => {
  const getFinalBalanceColor = () => {
    if (finalBalance > initialBalance) return "text-green-500";
    if (finalBalance < initialBalance) return "text-red-500";
    return "text-primary";
  };

  return (
    <div className='grid grid-cols-2 gap-3'>
      <div className='p-4 bg-background rounded-lg border border-border hover:border-primary/20'>
        <div className='text-gray-500 text-sm mb-1'>Initial Balance</div>
        <div className='text-xl font-medium'>
          ${Math.trunc(initialBalance).toLocaleString()}
        </div>
      </div>
      <div className='p-4 bg-background rounded-lg border border-border hover:border-primary/20'>
        <div className='text-gray-500 text-sm mb-1'>Final Balance</div>
        <div className={`text-xl font-medium ${getFinalBalanceColor()}`}>
          ${Math.trunc(finalBalance).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default BalanceCards;
