import { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import ChatWidget from "./components/Chat/ChatWidget";
import { SignalRProvider } from "./contexts/SignalRContext";
import {
  checkAuthState,
  checkTokenExpiration,
  selectIsAuthenticated,
  selectUser,
} from "./store/slices/authSlice";
import Dashboard from "./admin/Dashboard";
import UserManagement from "./admin/UserManagement";
import ChatSupport from "./admin/ChatSupport";
import ExchangeRequests from "./admin/ExchangeRequests";
import PromoCodeManagement from "./admin/PromoCodeManagement";

import "./scss/app.scss";

function App() {
  const aboutRef = useRef(null);
  const transactionRef = useRef(null);
  const homeRef = useRef(null);
  const testimonialRef = useRef(null);
  const frequentlyQARef = useRef(null);

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  useEffect(() => {
    dispatch(checkTokenExpiration());

    const tokenCheckInterval = setInterval(() => {
      dispatch(checkTokenExpiration());
    }, 60000);

    return () => clearInterval(tokenCheckInterval);
  }, [dispatch]);

  useEffect(() => {
    const protectedRoutes = ["/profile", "/admin"];
    const currentPath = location.pathname;

    const isProtectedRoute = protectedRoutes.some(
      (route) => currentPath === route || currentPath.startsWith(route + "/")
    );

    if (isProtectedRoute && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, location.pathname, navigate]);

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
    <SignalRProvider>
      <div className="wrapper">
        <Header
          onNavigate={(section) => {
            if (section === "about") handleScroll(aboutRef);
            if (section === "transaction") handleScroll(transactionRef);
            if (section === "home") handleScroll(homeRef);
            if (section === "testimonial") handleScroll(testimonialRef);
            if (section === "frequentlyQA") handleScroll(frequentlyQARef);
          }}
        />
        <div className="content">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  homeRef={homeRef}
                  aboutRef={aboutRef}
                  transactionRef={transactionRef}
                  testimonialRef={testimonialRef}
                  frequentlyQARef={frequentlyQARef}
                />
              }
            />
            <Route path="/payment/:orderId" element={<Payment />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />}>
              <Route
                index
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="requests" element={<ExchangeRequests />} />
              <Route path="chats" element={<ChatSupport />} />
              <Route path="promocodes" element={<PromoCodeManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />;
          </Routes>
        </div>
        <Footer />
        {location.pathname === "/" &&
          isAuthenticated &&
          user &&
          user.role !== "admin" && <ChatWidget />}
      </div>
    </SignalRProvider>
  );
}

export default App;
