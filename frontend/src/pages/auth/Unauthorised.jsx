import React from "react";
import { useNavigate } from "react-router-dom";

const Unauthorised = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        Unauthorized Access
      </h1>
      <p className="text-gray-600 mb-6">
        You do not have permission to access this page.
      </p>
      <button
        onClick={() => navigate("/login")}
        className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
      >
        Go to Login
      </button>
    </div>
  );
};

export default Unauthorised;
