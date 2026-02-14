import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const res = await register(name, email, password);
    if (res.success) navigate("/login");
    else setError(res.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFEF5] dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl w-full max-w-md shadow">
        <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-4">Register</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          <input
            id="register-name"
            name="name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border dark:border-gray-700 px-3 py-2 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
            required
          />

          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border dark:border-gray-700 px-3 py-2 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
            required
          />

          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border dark:border-gray-700 px-3 py-2 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
            required
          />

          <button className="w-full bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white py-2 rounded">
            Register
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
          Already registered?{" "}
          <Link to="/login" className="text-[var(--primary-700)] dark:text-[var(--primary-300)]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
