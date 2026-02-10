import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth-context";
import { useApiKey } from "./ApiKeyContext";
import ApiKeyModal from "./ApiKeyModal";

interface Topic {
  id: string;
  name: string;
  created_at: string;
}

export default function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [topicName, setTopicName] = useState("");
  const { user } = useAuth();
  const { apiKey, clearApiKey } = useApiKey();
  const [aiMode, setAiMode] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchTopics();
  }, [user]);

  async function fetchTopics() {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error) setTopics(data || []);
  }

  async function createTopic() {
    if (!topicName.trim() || !user) return;

    const { error } = await supabase.from("topics").insert({
      name: topicName,
      user_id: user.id,
    });

    if (!error) {
      setTopicName("");
      setShowModal(false);
      fetchTopics();
    }
  }

  async function deleteTopic(id: string) {
    const { error } = await supabase
      .from("topics")
      .delete()
      .eq("id", id);

    if (!error) {
      setTopics((prev) => prev.filter((t) => t.id !== id));
    }
  }


  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="sticky top-0 bg-gray-50 z-10 pb-4">

          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Your Topics</h1>

            <button
              onClick={() => setShowModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg"
            >
              + Create Topic
            </button>
          </div>

          {/* AI Mode */}
          <div className="flex items-center justify-between mb-6 border p-4 rounded-xl bg-white">
            <div>
              <p className="font-medium">AI Interview Mode</p>
              <p className="text-sm text-gray-500">
                Use your own Groq API key for AI interviews
              </p>
            </div>

            <div className="flex items-center gap-3">
              {apiKey && (
                <button
                  onClick={clearApiKey}
                  className="text-sm border px-3 py-1 rounded-lg"
                >
                  Change API Key
                </button>
              )}

              <button
                onClick={() => {
                  if (!apiKey) {
                    setShowApiModal(true);
                    return;
                  }
                  setAiMode(v => !v);
                }}
                className={`px-4 py-2 rounded-lg text-white ${aiMode ? "bg-green-600" : "bg-gray-400"
                  }`}
              >
                {aiMode ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg p-3 mb-6"
          />

          {/* Topics */}
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="grid md:grid-cols-2 gap-5">
              {filteredTopics.map((topic) => (
                <div key={topic.id} className="bg-white p-4 rounded-xl border">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2
                      className="text-base font-medium truncate"
                      title={topic.name}
                    >
                      {topic.name}
                    </h2>

                    <button
                      onClick={() => deleteTopic(topic.id)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/topic/${topic.id}`)}
                      className="flex-1 border rounded-lg py-1.5 text-sm"
                    >
                      Questions
                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          aiMode
                            ? `/topic/${topic.id}/interview-ai`
                            : `/topic/${topic.id}/interview`
                        )
                      }
                      className="flex-1 bg-black text-white rounded-lg py-1.5 text-sm"
                    >
                      Interview
                    </button>
                  </div>
                </div>

              ))}
            </div>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-4">Create Topic</h3>

                <input
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="Topic name"
                  className="w-full border rounded-lg p-3 mb-4"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 border rounded-lg py-2"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={createTopic}
                    className="flex-1 bg-black text-white rounded-lg py-2"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          <ApiKeyModal
            open={showApiModal}
            onClose={() => setShowApiModal(false)}
          />
        </div>
      </div>
    </div>
  );
}
