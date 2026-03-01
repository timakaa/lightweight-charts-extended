const StrategyFields = ({ strategyRelatedFields }) => {
  if (!strategyRelatedFields || strategyRelatedFields.length === 0) return null;

  // Check if first item is a subsection to determine format
  const hasSubsections =
    strategyRelatedFields[0]?.title && strategyRelatedFields[0]?.fields;

  const renderField = (field, index) => {
    let colorClass = "text-primary";
    if (field.color === "green") {
      colorClass = "text-green-500";
    } else if (field.color === "red") {
      colorClass = "text-red-500";
    }

    return (
      <div
        key={index}
        className='p-3 bg-background rounded-lg border border-border hover:border-foreground/20 transition-colors'
      >
        <div className='text-gray-500 text-sm mb-1'>{field.label}</div>
        <div className={`text-lg font-medium ${colorClass}`}>{field.value}</div>
      </div>
    );
  };

  return (
    <div>
      <h2 className='mx-5 font-bold text-2xl py-2.5 border-[#1f2024]'>
        Strategy Related Fields
      </h2>
      <div className='mx-5 mt-2'>
        {hasSubsections ? (
          // New subsection format
          strategyRelatedFields.map((section, sectionIndex) => (
            <div key={sectionIndex} className='mb-5'>
              <h3 className='text-md font-semibold mb-3 text-gray-400'>
                {section.title}
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                {section.fields.map((field, fieldIndex) =>
                  renderField(field, fieldIndex),
                )}
              </div>
            </div>
          ))
        ) : (
          // Backward compatibility: flat format
          <div className='grid grid-cols-2 gap-3'>
            {strategyRelatedFields.map((field, index) =>
              renderField(field, index),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyFields;
