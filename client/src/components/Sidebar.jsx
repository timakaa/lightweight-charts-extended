import { useEffect } from "react";
import {
  useToolStore,
  TOOL_CROSSHAIR,
  TOOL_LINE,
  TOOL_BOX,
  TOOL_RULER,
  TOOL_LONG_POSITION,
  TOOL_SHORT_POSITION,
  TOOL_FIB_RETRACEMENT,
} from "../store/tool";
import Crosshair from "./icons/Crosshair";
import Line from "./icons/Line";
import Box from "./icons/Box";
import Trash from "./icons/Trash";
import Ruler from "./icons/Ruler";
import LongPosition from "./icons/LongPosition";
import ShortPosition from "./icons/ShortPosition";
import FibRetracement from "./icons/FibRetracement";

const Sidebar = ({
  deleteAllLines,
  deleteAllBoxes,
  deleteAllLongPositions,
  deleteAllShortPositions,
  deleteAllFibRetracements,
}) => {
  const currentTool = useToolStore((s) => s.currentTool);
  const setCurrentTool = useToolStore((s) => s.setCurrentTool);

  useEffect(() => {
    const handleToolHotkey = (e) => {
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.code === "KeyT") {
        setCurrentTool(TOOL_LINE);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleToolHotkey);
    return () => window.removeEventListener("keydown", handleToolHotkey);
  }, [setCurrentTool]);

  const handleDeleteAll = () => {
    deleteAllLines();
    deleteAllBoxes();
    deleteAllLongPositions();
    deleteAllShortPositions();
    deleteAllFibRetracements();
  };

  return (
    <div className='relative w-16 cursor-default bg-modal border-r-4 border-[#2E2E2E] flex flex-col items-center pt-5 z-50'>
      <button
        onClick={() => setCurrentTool(TOOL_CROSSHAIR)}
        className={`mb-4 w-10 h-10 text-xl rounded-lg border-none cursor-pointer flex items-center justify-center transition-all
          ${
            currentTool === TOOL_CROSSHAIR
              ? "bg-blue-700 outline outline-2 outline-blue-300"
              : "bg-zinc-800 hover:bg-zinc-700"
          } text-white`}
        title='Crosshair'
      >
        <Crosshair />
      </button>
      <button
        onClick={() => setCurrentTool(TOOL_LINE)}
        className={`mb-4 w-10 h-10 text-xl rounded-lg border-none cursor-pointer flex items-center justify-center transition-all
          ${
            currentTool === TOOL_LINE
              ? "bg-blue-700 outline outline-2 outline-blue-300"
              : "bg-zinc-800 hover:bg-zinc-700"
          } text-white`}
        title='Line'
      >
        <Line />
      </button>
      <button
        onClick={() => setCurrentTool(TOOL_BOX)}
        className={`mb-4 w-10 h-10 text-xl rounded-lg border-none cursor-pointer flex items-center justify-center transition-all
          ${
            currentTool === TOOL_BOX
              ? "bg-blue-700 outline outline-2 outline-blue-300"
              : "bg-zinc-800 hover:bg-zinc-700"
          } text-white`}
        title='Box'
      >
        <Box />
      </button>
      <button
        onClick={() => setCurrentTool(TOOL_LONG_POSITION)}
        className={`mb-4 w-10 h-10 text-xl rounded-lg border-none cursor-pointer flex items-center justify-center transition-all
          ${
            currentTool === TOOL_LONG_POSITION
              ? "bg-blue-700 outline outline-2 outline-blue-300"
              : "bg-zinc-800 hover:bg-zinc-700"
          } text-white`}
        title='Long Position'
      >
        <LongPosition />
      </button>
      <button
        onClick={() => setCurrentTool(TOOL_SHORT_POSITION)}
        className={`mb-4 w-10 h-10 text-xl rounded-lg border-none cursor-pointer flex items-center justify-center transition-all
          ${
            currentTool === TOOL_SHORT_POSITION
              ? "bg-blue-700 outline outline-2 outline-blue-300"
              : "bg-zinc-800 hover:bg-zinc-700"
          } text-white`}
        title='Short Position'
      >
        <ShortPosition />
      </button>
      <button
        onClick={() => setCurrentTool(TOOL_FIB_RETRACEMENT)}
        className={`mb-4 w-10 h-10 text-xl rounded-lg border-none cursor-pointer flex items-center justify-center transition-all
          ${
            currentTool === TOOL_FIB_RETRACEMENT
              ? "bg-blue-700 outline outline-2 outline-blue-300"
              : "bg-zinc-800 hover:bg-zinc-700"
          } text-white`}
        title='Short Position'
      >
        <FibRetracement />
      </button>
      <button
        onClick={() => setCurrentTool(TOOL_RULER)}
        className={`mb-4 w-10 h-10 text-xl rounded-lg border-none cursor-pointer flex items-center justify-center transition-all
          ${
            currentTool === TOOL_RULER
              ? "bg-blue-700 outline outline-2 outline-blue-300"
              : "bg-zinc-800 hover:bg-zinc-700"
          } text-white`}
        title='Box'
      >
        <Ruler />
      </button>
      <button
        onClick={() => handleDeleteAll()}
        className={`mb-4 w-10 h-10 text-xl rounded-lg border-none cursor-pointer flex items-center justify-center transition-all
          ${"bg-zinc-800 hover:bg-zinc-700"} text-white`}
        title='Trash'
      >
        <Trash />
      </button>
    </div>
  );
};

export default Sidebar;
