import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  const primaryRole = localStorage.getItem("primaryRole");

  //If the user is not logged in redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);

    if (decodedToken.exp * 1000 < Date.now()) {
      // Check if the token has expired. If yes, redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("loggedInUserEmail");
      localStorage.removeItem("loggedInUserFullName");
      localStorage.removeItem("primaryRole");
      localStorage.removeItem("roles");
      return <Navigate to="/login" replace />;
    }

    const validRoles = ["admin", "teamlead", "developer", "tester", "user"];

    //If the user does not have proper access role navigate to unauthorised page
    if (!validRoles.includes(primaryRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUserEmail");
    localStorage.removeItem("loggedInUserFullName");
    localStorage.removeItem("primaryRole");
    localStorage.removeItem("roles");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
