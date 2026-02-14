import axios from "axios";

const ConnectButton = ({ userId }) => {
  const token = localStorage.getItem("token");

  const sendRequest = async () => {
    await axios.post(
      `http://localhost:5000/api/connections/send/${userId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    alert("Connection request sent");
  };

  return (
    <button
      onClick={sendRequest}
      className="bg-emerald-600 text-white px-3 py-1 rounded"
    >
      Connect
    </button>
  );
};

export default ConnectButton;
