import { useRef } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";

import "./scss/app.scss";

function App() {
  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const transactionRef = useRef(null);
  const homeRef = useRef(null);

  const handleScroll = (ref) => {
    if (ref.current) {
      const yOffset = -84;
      const element = ref.current;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="wrapper">
      <Header
        onNavigate={(section) => {
          if (section === "about") handleScroll(aboutRef);
          if (section === "contact") handleScroll(contactRef);
          if (section === "transaction") handleScroll(transactionRef);
          if (section === "home") handleScroll(homeRef);
        }}
      />
      <div className="content">
        <Routes>
          <Route
            path="/cryptobit"
            element={
              <Home
                homeRef={homeRef}
                aboutRef={aboutRef}
                contactRef={contactRef}
                transactionRef={transactionRef}
              />
            }
          />
          <Route path="*" element={<NotFound />} />;
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
