import CreatePost from "../components/CreatePost";

const CreatePostPage = () => {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Create Post
        </h1>
        <CreatePost />
      </div>
    </div>
  );
};

export default CreatePostPage;
