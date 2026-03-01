import Trash from "../../../icons/Trash";

const DeleteButton = ({ onClick, isVisible }) => {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className='absolute top-4 right-20 bg-red-500 text-primary border-none px-2 py-2 rounded z-40 shadow hover:bg-red-600 transition-colors'
    >
      <Trash />
    </button>
  );
};

export default DeleteButton;
