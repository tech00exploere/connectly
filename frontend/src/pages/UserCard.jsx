import api from "../utils/api";

const ConnectButton = ({ userId }) => {
  const sendRequest = async () => {
    await api.post(`/users/connect/${userId}`, {});

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
