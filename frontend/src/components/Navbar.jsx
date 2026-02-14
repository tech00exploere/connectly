import { Home, User, LogOut, LogIn, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-[#FFFEF5] dark:bg-gray-900 border-b border-emerald-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-[var(--primary-700)] dark:text-[var(--primary-300)] font-extrabold text-2xl">
          Connectly
        </h1>

        {/* Right side */}
        <div className="flex gap-10 items-center">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                className="flex items-center gap-2 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-[var(--primary-800)] dark:hover:text-[var(--primary-200)]"
              >
                <Home size={22} />
                Home
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-[var(--primary-800)] dark:hover:text-[var(--primary-200)]"
              >
                <User size={22} />
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut size={22} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-[var(--primary-800)] dark:hover:text-[var(--primary-200)]"
              >
                <LogIn size={22} />
                Login
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-2 text-[var(--primary-700)] dark:text-[var(--primary-300)] hover:text-[var(--primary-800)] dark:hover:text-[var(--primary-200)]"
              >
                <UserPlus size={22} />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
