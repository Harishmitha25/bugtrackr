import React from "react";
import { useNavigate } from "react-router-dom";

const Header = ({ userName, userRole }) => {
  const navigate = useNavigate();

  //Remove details of user from the local storage
  const handleLogout = () => {
    localStorage.removeItem("loggedInUserEmail");
    localStorage.removeItem("loggedInUserFullName");
    localStorage.removeItem("roles");
    localStorage.removeItem("token");
    localStorage.removeItem("primaryRole");
    navigate("/login");
  };

  return (
    <div className="flex justify-between items-center bg-primary text-white p-4 w-full">
      <h1 className="text-xl font-bold">Bug TrackR</h1>
      {userName && (
        <span className="text-lg">
          Welcome, {userName} ({userRole})
        </span>
      )}

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all"
      >
        Logout
      </button>
    </div>
  );
};

export default Header;
