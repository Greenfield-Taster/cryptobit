import React from 'react'

import AboutSection from "../components/Home/AboutSection"
import ContactSection from "../components/Home/ContactSection";
import TransactionSection from "../components/Home/TransactionSection";

const Home = () => {
  return (
    <>
      <AboutSection />
      <TransactionSection />
      <ContactSection />
    </>
  )
}

export default Home