import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const roleFromQuery = searchParams.get("role");
    const role = roleFromQuery || localStorage.getItem("role");

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    const target = role === "doctor" ? "/doctor/login" : "/login";
    navigate(target, { replace: true });
  }, [navigate, searchParams]);

  return null;
}
