const getPrimaryRole = (roles) => {
  if (!roles || roles.length === 0) {
    return null;
  }

  const priorityRoles = ["admin", "teamlead", "developer", "tester"];
  for (const role of priorityRoles) {
    const foundRole = roles.find((r) => r.role === role);
    if (foundRole) {
      return foundRole.role;
    }
  }

  return "user";
};

module.exports = getPrimaryRole;
