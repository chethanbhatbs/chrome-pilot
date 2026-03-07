import "@/App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import TabPilotPreview from "@/pages/TabPilotPreview";

function App() {
  return (
    <div className="App">
      <HashRouter>
        <Routes>
          <Route path="/" element={<TabPilotPreview />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
