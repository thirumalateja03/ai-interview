import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./auth-context";
import { useParams } from "react-router-dom";

interface Question {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

export default function QuestionManager() {
  const { user } = useAuth();
  const { topicId } = useParams<{ topicId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  useEffect(() => {
    if (user) fetchQuestions();
  }, [user, topicId]);

  async function fetchQuestions() {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false });

    if (!error) setQuestions(data || []);
  }

  async function createQuestion() {
    if (!newQuestion.trim() || !newAnswer.trim() || !user) return;

    const { error } = await supabase.from("questions").insert({
      question: newQuestion,
      answer: newAnswer,
      topic_id: topicId,
      user_id: user.id,
    });

    if (!error) {
      setNewQuestion("");
      setNewAnswer("");
      setShowModal(false);
      fetchQuestions();
    }
  }

  async function deleteQuestion(id: string) {
    await supabase.from("questions").delete().eq("id", id);
    fetchQuestions();
  }

  const filtered = questions.filter((q) =>
    q.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Questions</h1>

          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            + Add Question
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full border rounded-xl p-3 mb-6"
        />

        {/* List */}
        <div className="space-y-4">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="bg-white border rounded-2xl p-5 flex justify-between items-start"
            >
              <div>
                <p className="font-medium text-gray-900">{q.question}</p>
                <p className="text-gray-500 text-sm mt-1">{q.answer}</p>
              </div>

              <button
                onClick={() => deleteQuestion(q.id)}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-gray-400 mt-10">No questions found</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Question</h3>

            <input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Question"
              className="w-full border rounded-xl p-3 mb-3"
            />

            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Answer"
              className="w-full border rounded-xl p-3 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border rounded-xl py-2"
              >
                Cancel
              </button>

              <button
                onClick={createQuestion}
                className="flex-1 bg-black text-white rounded-xl py-2"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}