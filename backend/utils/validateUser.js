// Function to validate user details
const validateUser = (user) => {
  const { email, password } = user;

  if (!email || !password) {
    return "Email and Password are required";
  }

  if (
    email &&
    !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
  ) {
    return "Invalid email format";
  }

  return null;
};

module.exports = validateUser;
