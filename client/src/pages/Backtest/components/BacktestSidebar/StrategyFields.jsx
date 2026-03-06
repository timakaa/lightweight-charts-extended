import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const StrategyFields = ({ strategyRelatedFields }) => {
  const [copied, setCopied] = useState(false);

  if (!strategyRelatedFields || strategyRelatedFields.length === 0) return null;

  const handleCopyToClipboard = () => {
    const formattedData = strategyRelatedFields.map((section) => ({
      title: section.title,
      fields: section.fields.reduce((acc, field) => {
        acc[field.label] = field.value;
        return acc;
      }, {}),
    }));
    const jsonData = JSON.stringify(formattedData, null, 2);
    navigator.clipboard.writeText(jsonData).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        <div className='text-primary/60 text-sm mb-1'>{field.label}</div>
        <div className={`text-lg font-medium ${colorClass}`}>{field.value}</div>
      </div>
    );
  };

  return (
    <div>
      <div className='mx-5 flex items-center justify-between'>
        <h2 className='font-bold text-2xl py-2.5'>Strategy Related Fields</h2>
        <Button
          onClick={handleCopyToClipboard}
          variant='ghost'
          size='icon'
          title='Copy strategy fields as JSON'
        >
          {copied ? (
            <Check className='h-4 w-4 text-green-500' />
          ) : (
            <Copy className='h-4 w-4' />
          )}
        </Button>
      </div>
      <div className='mx-5 mt-2'>
        {hasSubsections ? (
          // New subsection format
          strategyRelatedFields.map((section, sectionIndex) => (
            <div key={sectionIndex} className='mb-5'>
              <h3 className='text-md font-semibold mb-3 text-primary/70'>
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
