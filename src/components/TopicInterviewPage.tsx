import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import VoicePractice, { type Question } from "../components/VoicePractice";

export default function TopicInterviewPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) return;
    fetchQuestions();
  }, [topicId]);

  async function fetchQuestions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("questions")
      .select("id, question, answer")
      .eq("topic_id", topicId);

    if (!error && data) {
      setQuestions(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading questions...
      </div>
    );
  }

  return <VoicePractice questions={questions} />;
}
