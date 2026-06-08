import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SuccessPage from "./pages/SuccessPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/success" element={<SuccessPage />} />
    </Routes>
  );
}
