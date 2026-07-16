export const setRole = (role) => localStorage.setItem("role", role);
export const getRole = () => localStorage.getItem("role");
export const logout = (roleHint = "") => {
  const role = roleHint || localStorage.getItem("role");
  localStorage.clear();
  window.location.replace(role === "doctor" ? "/doctor/login" : "/login");
};
