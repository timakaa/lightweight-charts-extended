import { useState } from "react";
import Trash from "@icons/Trash";
import Edit from "@icons/Edit";
import {
  useDeleteBacktest,
  useUpdateBacktest,
} from "../hooks/backtests/useBacktests";
import { useNavigate, useParams } from "react-router-dom";
import EditBacktestModal from "../pages/Backtests/components/EditBacktestModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const OptionsDropdown = ({ backtest }) => {
  const navigate = useNavigate();
  const { backtestId: currentBacktestId } = useParams();
  const { mutate: deleteBacktest } = useDeleteBacktest();
  const { mutate: updateBacktest } = useUpdateBacktest();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const onEdit = (e) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleSave = (newTitle) => {
    updateBacktest(
      { id: backtest.id, title: newTitle },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
        },
      },
    );
  };

  const onDelete = (e) => {
    e.stopPropagation();
    deleteBacktest(backtest.id, {
      onSuccess: () => {
        // Only navigate back if we're deleting the currently viewed backtest
        if (String(backtest.id) === String(currentBacktestId)) {
          navigate("/backtest");
        }
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className='p-1 hover:bg-accent rounded-sm transition-colors focus:outline-none'
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='w-32 bg-background border-border'
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onClick={onEdit}
            className='flex items-center gap-2 cursor-pointer text-foreground hover:bg-accent'
          >
            <Edit width={14} height={14} />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className='cursor-pointer'>
            <div className='text-error flex items-center gap-1'>
              <Trash width={20} height={20} />
              Delete
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditBacktestModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        initialTitle={backtest?.title || ""}
      />
    </>
  );
};

export default OptionsDropdown;
