import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import AuthGate from './components/AuthGate'
import QuestionManager from './components/QuestionManager'
import TopicInterviewPage from './components/TopicInterviewPage'
import { ApiKeyProvider } from './components/ApiKeyContext'
import AIVoiceInterview from './components/AIVoiceInterview'

function App() {

  return (
    <ApiKeyProvider>
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path='/topic/:topicId/' element={<QuestionManager />} />
            <Route path="/topic/:topicId/interview" element={<TopicInterviewPage />} />
            <Route  path="/topic/:topicId/interview-ai" element={<AIVoiceInterview />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </ApiKeyProvider>
  )
}


export default App
