import React from "react";
import "../../scss/main.scss";
import contactBGImage from "../../assets/images/cartoon-bg.png";
import deliveryManImage from "../../assets/images/cartoon.png";
import mainIcon from "../../assets/images/Contact-1.png";

function Contact() {
  return (
    <section className="section">
      <div className="section__contact">
        <div className="section__contact__container">
          <div className="section__contact__header">
            <h3>Contact Info</h3>
            <h2>Write Us Something</h2>
          </div>

          <div className="section__contact__content">
            <div className="section__contact__images">
              <img
                className="section__contact__images__post"
                src={contactBGImage}
                alt="Contact illustration"
              />

              <img
                className="section__contact__images__deliveryMan"
                src={deliveryManImage}
                alt="deliveryManImage"
              />
            </div>

            <div className="section__contact__form">
              <h2>Get In Touch</h2>
              <form>
                <div className="section__contact__form-row">
                  <input type="text" placeholder="Your Name" />
                  <input type="email" placeholder="Enter E-Mail" />
                </div>
                <input
                  type="text"
                  placeholder="Subject"
                  className="section__contact__subject"
                />
                <textarea
                  placeholder="Message"
                  rows="6"
                  className="section__contact__subject"
                ></textarea>
                <div className="section__contact__submit">
                  <button type="submit">
                    <img src={mainIcon} alt="mail icon" />
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
