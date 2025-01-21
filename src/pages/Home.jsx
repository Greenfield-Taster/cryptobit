import React from "react";

import AboutSection from "../components/Sections/AboutSection";
import ContactSection from "../components/Sections/ContactSection";
import TransactionSection from "../components/Sections/TransactionSection";
import HomeSection from "../components/Sections/HomeSection";

const Home = ({ homeRef, aboutRef, contactRef, transactionRef }) => {
  return (
    <>
      <div ref={homeRef}>
        <HomeSection />
      </div>
      <div ref={aboutRef}>
        <AboutSection />
      </div>
      <div ref={transactionRef}>
        <TransactionSection />
      </div>
      <div ref={contactRef}>
        <ContactSection />
      </div>
    </>
  );
};


export default Home;
