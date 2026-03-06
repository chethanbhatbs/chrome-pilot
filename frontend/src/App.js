import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TabPilotPreview from "@/pages/TabPilotPreview";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TabPilotPreview />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
