import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MalayalamToSign from "./pages/MalayalamToSign/MalayalamToSign";
import SignToMalayalam from "./pages/SignToMalayalam/SignToMalayalam";
import LearnMSL from "./pages/LearnMSL/LearnMSL";

import Sidebar from "./components/Sidebar/Sidebar";

import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<MalayalamToSign />} />
            <Route path="/sign-to-malayalam" element={<SignToMalayalam />} />
            <Route path="/learn-msl" element={<LearnMSL />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

