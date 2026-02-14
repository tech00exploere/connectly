import { useEffect, useState } from "react";

const Settings = () => {
  const [showModes, setShowModes] = useState(false);
  const [theme, setTheme] = useState("light");
  const [themeColor, setThemeColor] = useState("default");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }

    const savedColor = localStorage.getItem("themeColor") || "default";
    if (savedColor === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", savedColor);
    }
    setThemeColor(savedColor);
  }, []);

  const applyTheme = (next) => {
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const applyColor = (next) => {
    setThemeColor(next);
    if (next === "default") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("themeColor");
    } else {
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("themeColor", next);
    }
  };
  const items = [
    {
      title: "Account Privacy",
      description: "Control who can see your profile and activity.",
    },
    {
      title: "Security",
      description: "Manage password, sessions, and login protection.",
    },
    {
      title: "Modes",
      description: "Adjust app experience and visibility preferences.",
      options: ["Light Mode", "Dark Mode"],
    },
  ];

  const colorOptions = [
    { label: "Default (Emerald)", value: "default" },
    { label: "Amber", value: "amber" },
    { label: "Slate", value: "slate" },
    { label: "Rose", value: "rose" },
    { label: "Teal", value: "teal" },
  ];

  return (
    <>
      <section className="flex justify-center">
        <div className="w-full max-w-3xl space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your account preferences.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={
                  item.title === "Modes" ? () => setShowModes(true) : undefined
                }
                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-5 hover:shadow-sm transition text-center w-full"
              >
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                  {item.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {showModes ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Modes
              </h2>
              <button
                type="button"
                onClick={() => setShowModes(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose a mode to personalize your experience.
            </p>

            <div className="mt-4 grid gap-2">
              {items
                .find((i) => i.title === "Modes")
                .options.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      label === "Dark Mode"
                        ? applyTheme("dark")
                        : applyTheme("light")
                    }
                    className={`w-full text-left px-4 py-3 rounded-md border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      (label === "Dark Mode" && theme === "dark") ||
                      (label === "Light Mode" && theme === "light")
                        ? "bg-gray-100 dark:bg-gray-800"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{label}</span>
                      {(label === "Dark Mode" && theme === "dark") ||
                      (label === "Light Mode" && theme === "light") ? (
                        <span className="text-xs font-medium text-[var(--primary-700)] dark:text-[var(--primary-300)]">
                          Active
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme Color
              </p>
              <div className="grid gap-2">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => applyColor(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-md border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      themeColor === opt.value
                        ? "bg-gray-100 dark:bg-gray-800"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {themeColor === opt.value ? (
                        <span className="text-xs font-medium text-[var(--primary-700)] dark:text-[var(--primary-300)]">
                          Active
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Settings;
