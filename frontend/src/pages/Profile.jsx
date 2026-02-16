import { useEffect, useState } from "react";
import api from "../utils/api";
import { BACKEND_URL } from "../utils/config";

const Profile = () => {
  const [form, setForm] = useState({
    username: "",
    institution: "",
    qualification: "",
    dob: "",
    gender: "",
    resume: "",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        setForm((prev) => ({ ...prev, ...res.data }));

        if (res.data.profileImage) {
          setPreview(`${BACKEND_URL}${res.data.profileImage}`);
        }
      } catch (err) {
        console.error(
          "PROFILE FETCH ERROR:",
          err.response?.status,
          err.response?.data || err.message
        );
      }
    };

    fetchProfile();
  }, []);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data.append(key, value);
        }
      });

      if (image) data.append("image", image);

      const res = await api.put("/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data;
      setForm((prev) => ({ ...prev, ...updated }));
      if (updated.profileImage) {
        setPreview(`${BACKEND_URL}${updated.profileImage}?t=${Date.now()}`);
      }

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const merged = { ...JSON.parse(storedUser), ...updated };
        localStorage.setItem("user", JSON.stringify(merged));
      }

      alert("Profile updated ✅");
    } catch (err) {
      console.error(
        "PROFILE UPDATE ERROR:",
        err.response?.status,
        err.response?.data || err.message
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow text-gray-800 dark:text-gray-100">
      <h2 className="text-xl font-bold mb-4">Profile</h2>

      <img
        src={preview || "/avatar.png"}
        alt="Profile"
        className="w-32 h-32 rounded-full mb-4 object-cover"
      />

      <input
        id="profile-image"
        name="profileImage"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
          }
        }}
      />

      <form onSubmit={submit} className="grid grid-cols-2 gap-4 mt-4">
        {[
          "username",
          "institution",
          "qualification",
          "dob",
          "gender",
          "resume",
        ].map((field) => (
          <input
            key={field}
            id={`profile-${field}`}
            name={field}
            value={form[field] ?? ""}
            onChange={change}
            placeholder={field}
            className="border px-3 py-2 rounded"
          />
        ))}

        <button className="col-span-2 bg-emerald-600 text-white py-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
};

export default Profile;
