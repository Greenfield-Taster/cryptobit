import { useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import { checkTokenExpiration } from "./store/slices/authSlice";

import "./scss/app.scss";

function App() {
  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const transactionRef = useRef(null);
  const homeRef = useRef(null);
  const testimonialRef = useRef(null);
  const frequentlyQARef = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(checkTokenExpiration());
    }, 60000);

    return () => clearInterval(interval);
  }, [dispatch]);

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
          if (section === "testimonial") handleScroll(testimonialRef);
          if (section === "frequentlyQA") handleScroll(frequentlyQARef);
        }}
      />
      <div className="content">
        <Routes>
          <Route
            path="cryptobit"
            element={
              <Home
                homeRef={homeRef}
                aboutRef={aboutRef}
                contactRef={contactRef}
                transactionRef={transactionRef}
                testimonialRef={testimonialRef}
                frequentlyQARef={frequentlyQARef}
              />
            }
          />
          <Route path="payment/:orderId" element={<Payment />} />
          <Route path="payment-success" element={<PaymentSuccess />} />
          <Route path="auth" element={<Auth />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin/*" element={<Admin />} />
          <Route path="*" element={<NotFound />} />;
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
