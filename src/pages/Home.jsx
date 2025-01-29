import React from "react";

import AboutSection from "../components/Sections/AboutSection";
import ContactSection from "../components/Sections/ContactSection";
import TransactionSection from "../components/Sections/TransactionSection";
import HomeSection from "../components/Sections/HomeSection";

const Home = ({ homeRef, aboutRef, contactRef, transactionRef }) => {
  const handleNavigation = (section) => {
    if (section === "about") {
      const yOffset = -84;
      const y =
        aboutRef.current?.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
    if (section === "contact") {
      const yOffset = -84;
      const y =
        contactRef.current?.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
    if (section === "transaction") {
      const yOffset = -84;
      const y =
        transactionRef.current?.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
    if (section === "home") {
      const yOffset = -84;
      const y =
        homeRef.current?.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  };
  return (
    <>
      <div ref={homeRef}>
        <HomeSection onNavigate={handleNavigation} />
      </div>
      <div ref={aboutRef}>
        <AboutSection />
      </div>
      {/* <div ref={transactionRef}>
        <TransactionSection />
      </div> */}
      <div ref={contactRef}>
        <ContactSection />
      </div>
    </>
  );
};

export default Home;
