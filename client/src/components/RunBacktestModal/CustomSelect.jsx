import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomSelect = ({ value, onChange, options }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className='w-full bg-background border-border text-primary'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='bg-background border-border'>
        {options.map((option, idx) => {
          const optValue = typeof option === "string" ? option : option.value;
          const optLabel = typeof option === "string" ? option : option.label;

          return (
            <SelectItem key={idx} value={optValue} className='text-primary'>
              {optLabel}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default CustomSelect;
