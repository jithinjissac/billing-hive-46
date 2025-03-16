
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="text-3xl font-semibold mt-4 text-gray-700">Page Not Found</h2>
        <p className="text-gray-500 mt-2 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button 
          className="mt-8" 
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
