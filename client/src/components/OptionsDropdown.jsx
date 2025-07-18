import React, { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import Trash from "./icons/Trash";
import Edit from "./icons/Edit";
import {
  useDeleteBacktest,
  useUpdateBacktest,
} from "../hooks/backtests/useBacktests";
import { useNavigate, useParams } from "react-router-dom";
import EditBacktestModal from "./backtests/EditBacktestModal";

const OptionsDropdown = ({ backtest }) => {
  const navigate = useNavigate();
  const { backtestId: currentBacktestId } = useParams();
  const { mutate: deleteBacktest } = useDeleteBacktest();
  const { mutate: updateBacktest } = useUpdateBacktest();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const onEdit = () => {
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

  const onDelete = () => {
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
      <Menu as='div' className='relative z-50' data-menu='true'>
        <Menu.Button className='p-1 hover:bg-[#1e222d] rounded-full transition-colors'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-4 w-4 text-gray-500'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path d='M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z' />
          </svg>
        </Menu.Button>
        <Transition
          as={Fragment}
          enter='transition ease-out duration-100'
          enterFrom='transform opacity-0 scale-95'
          enterTo='transform opacity-100 scale-100'
          leave='transition ease-in duration-75'
          leaveFrom='transform opacity-100 scale-100'
          leaveTo='transform opacity-0 scale-95'
        >
          <Menu.Items className='absolute right-0 mt-2 w-32 origin-top-right rounded-md bg-[#131722] shadow-lg ring-1 ring-[#1e222d] focus:outline-none z-10'>
            <div>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onEdit}
                    className={`${
                      active ? "bg-[#1e222d]" : ""
                    } flex w-full items-center px-3 py-1.5 text-base text-gray-300 hover:bg-[#1e222d] rounded-t-md gap-2`}
                  >
                    <Edit width={14} height={14} />
                    Edit
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={onDelete}
                    className={`${
                      active ? "bg-[#1e222d]" : ""
                    } flex w-full items-center px-2 py-1.5 text-base text-red-500 hover:bg-[#1e222d] rounded-b-md gap-1`}
                  >
                    <Trash width={20} height={20} />
                    Delete
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

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
