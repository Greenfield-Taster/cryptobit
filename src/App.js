import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound"
import Header from "./components/Header"
import Footer from "./components/Footer"

import "./scss/app.scss"

function App() {
  return (
    <div className="wrapper">
      <Header />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />;
        </Routes>
      </div>
      <Footer/>
    </div>
  );
}

export default App;
