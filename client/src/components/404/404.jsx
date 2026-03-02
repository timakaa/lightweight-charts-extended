import { useNavigate } from "react-router-dom";

const NotFound404 = () => {
  const navigate = useNavigate();

  return (
    <div className='h-screen w-screen flex items-center justify-center bg-background'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold text-primary mb-4'>404</h1>
        <p className='text-xl text-primary mb-6'>Backtest not found</p>
        <button
          onClick={() => navigate("/")}
          to='/'
          className='inline-block px-6 py-3 bg-blue-500 text-primary rounded-lg hover:bg-blue-600 transition-colors'
        >
          Go to Main Page
        </button>
      </div>
    </div>
  );
};

export default NotFound404;
