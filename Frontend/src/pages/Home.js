import React from "react";
import { Carousel } from "react-bootstrap";
import { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-scroll";
import { useNavigate } from "react-router-dom";
import "../App.css";
import Groupimg1 from "../Asset/aboutusgrp.png"; // Use relative path
import Groupimg2 from "../Asset/aboutusimg.png"; // Use relative path
import Whyusbox1 from "../Asset/Whyusbox1.png"; // Use relative path
import Whyusbox2 from "../Asset/Whyusbox2.png"; // Use relative path
import Whyusbox3 from "../Asset/Whyusbox3.png"; // Use relative path
import Whyusbox4 from "../Asset/Whyusbox4.png"; // Use relative path
import facebook from "../Asset/facebook.png"; // Use relative path
import instagram from "../Asset/instagram.png"; // Use relative path
import linkedin from "../Asset/linkedin.png"; // Use relative path
import cardimg1 from "../Asset/D-card-img1.png"; // Use relative path
import cardimg2 from "../Asset/D-card-img2.png"; // Use relative path
import cardimg3 from "../Asset/D-card-img3.png"; // Use relative path
import logo from"../Asset/bali loogoo.svg";
import { Navbar, Nav, Container } from "react-bootstrap";
const App = () => {
  const navigate = useNavigate();

  var Visit = () => {
    navigate("/dashboardPreferences");
  }

  var VisitIP = () => {
    navigate("/itineraryPage");
  }
  const handleClick = () => {
    navigate("/signup");
  }
    const GetStarted= () => {
      navigate("/signup");
  };
  return (
    <div>
     
     <Navbar  className="fw-bold" expand="lg" style={{ backgroundColor: "#F8F2E5" }} variant="light" sticky="top">
      <Container>
        <Navbar.Brand href="#"><img src={logo} alt="only2bali" className="logo" /></Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto "> {/* Added spacing between links */}
            <Nav.Link className="px-3" href="#home">Home</Nav.Link>
            <Nav.Link className="px-3" href="#about">About Us</Nav.Link>
            <Nav.Link className="px-3" href="#whyus">Why Us</Nav.Link>
            <Nav.Link className="px-3" href="#Destinations">Destinations</Nav.Link>
            <button className="px-3" href="#GetStarted" onClick={GetStarted}>Get Started</button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>

      <div id="home">
        <div className="Home-hero-img">
          <h1 className="Home-hero-h1"> Only2Bali.com </h1>

          <p className="Home-hero-p1">Your Bali Dream, Perfectly Crafted </p>
          <p className="Home-hero-p2">
            Create your ideal Balinese adventure. We connect you with local
            experts to design a
          </p>
          <p className="Home-hero-p2">
            {" "}
            culturally immersive experience uniquely suited to your Indian
            preferences.
          </p>
          <div className="Home-hero-div">
            <a href="#about">
            <button className="Home-hero-button" src="/GetStarted">
              
              Plan My Trip{" "}
              <svg
    xmlns="http://www.w3.org/2000/svg"
    width="30"
    height="30"
    viewBox="0 0 24 24"
    style={{ fill: "white", paddingTop: "1px" }}
  >
    <path d="M12 16l4-4h-3V4h-2v8H8l4 4z" />
  </svg>
            </button>
            </a>
          </div>
        </div>
      </div>

      <div className="about-container" id="about">
        {/* Left Grid */}

        <div className="Aboutus-textbox">
          <h1 className="Aboutus-h1">About Us</h1>
          <br></br>
          <p className="Aboutus-p1">
            The 1st Bali Trip Planner for Indian Travelers
          </p>
          <br></br>
          <p className="Aboutus-p2">
          Planning a Bali trip should be exciting, not overwhelming.
           At Only2Bali, <span className="P-span"> The only Bali trip planner exclusively for India,</span> we take the stress out of planning by 
           connecting you with trusted local experts who create your ideal Balinese getaway.
           Think of us as more than a booking platform—we’re your personal travel companions!
          </p>
          <br></br>
          <p className="Aboutus-p2">
          As a dedicated platform for <span className="P-span">Indian travelers</span> we deeply understand your preferences. Our curated selection of local partners ensures culturally sensitive experiences, from accommodations
           tailored to your needs to activities that reflect your interests.
           Bonus if you’re vegan
           Tell us your dream Bali vacation, and we'll make it happen.
          </p>
          <p className="Aboutus-p2">
            Let's create unforgettable memories together!
          </p>
          <br></br>
          <div className="Aboutus-button-div">
             <a href="#whyus">
            <button className="Home-hero-button">
              Create Your memories{" "}
              <svg
    xmlns="http://www.w3.org/2000/svg"
    width="30"
    height="30"
    viewBox="0 0 24 24"
    style={{ fill: "white", paddingTop: "1px" }}
  >
    <path d="M12 16l4-4h-3V4h-2v8H8l4 4z" />
  </svg>
            </button>
            </a>
          </div>
        </div>

        {/* Right Grid */}
        <div className="Aboutus-group d-none d-md-block">
  <img src={Groupimg1} alt="About Us Group" className="Aboutus-image1" />
  <img src={Groupimg2} alt="About Us Group" className="Aboutus-image2" />
</div>
      </div>
      <div id="whyus">
        <div className="Whyus-bg">
          <h1 className="Whyus-h1">Why Us</h1>
          <p className="Whyus-p1">
            We’re not a booking platform, we're your personal travel friends
          </p>
          <br></br>
          <div className="Whyus-Box">
            <div className="Whyus-container">
              <img
                src={Whyusbox1}
                alt="Whyus-image1"
                className="Whyus-image1"
              />
              <p className="Whyus-p2">Culturally Sensitive Experiences</p>
              <p className="Whyus-p3">
                Indian preferences are rich in culture. Our partnerships with
                local Balinese experts ensure your trip is not just enjoyable
                but also respectful and culturally enriching.
              </p>
            </div>
            <div className="Whyus-container">
              <img
                src={Whyusbox2}
                alt="Whyus-image1"
                className="Whyus-image1"
              />
              <p className="Whyus-p2">Trusted Local Partner</p>
              <p className="Whyus-p3">
                Trust is a must. We only work with vetted and reliable partners
                in Bali. ensuring a seamless and stress-free experience from
                beginning to end.
              </p>
            </div>
          </div>
          <br></br>
          <br></br>
          <div className="Whyus-Box">
            <div className="Whyus-container">
              <img
                src={Whyusbox3}
                alt="Whyus-image1"
                className="Whyus-image1"
              />
              <p className="Whyus-p2">Highly Customizable Itineraries</p>
              <p className="Whyus-p3">
                We don’t believe in one-size-fits-all travel. Work with us to
                create an itinerary that perfectly aligns with your interests,
                budget, and group size. whether it's a family vacation, a
                corporate retreat, or a solo adventure.
              </p>
            </div>
            <div className="Whyus-container">
              <img
                src={Whyusbox4}
                alt="Whyus-image1"
                className="Whyus-image1"
              />
              <p className="Whyus-p2">Dedicated Support</p>
              <p className="Whyus-p3">
                We Assist You Like Your friends. Our team is here to assist you
                every step of the way, offering personalized support and
                answering any questions you may have.
              </p>
            </div>
          </div>
          <br></br>

          <div className="Whyus-button-div">
             <a href="#Destinations">
            <button className="Home-hero-button">
              Plan Your Holiday{" "}
              <svg
    xmlns="http://www.w3.org/2000/svg"
    width="30"
    height="30"
    viewBox="0 0 24 24"
    style={{ fill: "white", paddingTop: "1px" }}
  >
    <path d="M12 16l4-4h-3V4h-2v8H8l4 4z" />
  </svg>
            </button>
            </a>
          </div>
          <br></br>
        </div>
      </div>
      <div className="Destinations-Bg" id="Destinations">
        <h1 className="Destinations-h1">Destinations</h1>
        <p className="Destinations-p1">
          Your Personalized Bali Awaits. Discover:
        </p>
        <div className="carousel-div">
          <div style={{ display: "block", width: 600, padding: 30 }}>
            <Carousel  interval={2000} indicators={false}>
              <Carousel.Item>
                <div className="carousel-content">
                  <img
                    className="d-block w-100 "
                    src={cardimg1}
                    alt="First Slide"
                  />
                  <h3 className="carousel-heading">Natural Beauty and Beaches</h3>
                  <p className="carousel-description">
                  Relax and Explore - Enjoy beautiful beaches like Nusa Dua, peaceful rice paddies in Tegalalang, and stunning cliff views at Uluwatu Temple. 
                  </p>
                </div>
              </Carousel.Item>
              <Carousel.Item>
                <div className="carousel-content">
                  <img
                    className="d-block w-100"
                    src={cardimg2}
                    alt="Second Slide"
                  />
                  <h3 className="carousel-heading">Local Culture & Traditions</h3>
                  <p className="carousel-description">
                  Experience Bali's Heart - Explore the Ubud Monkey Forest, see the Tanah Lot Temple, and enjoy a traditional Balinese dance performance. 
                  </p>
                </div>
              </Carousel.Item>
              <Carousel.Item>
                <div className="carousel-content">
                  <img
                    className="d-block w-100"
                    src={cardimg3}
                    alt="Third Slide"
                  />
                  <h3 className="carousel-heading">Wellness & Relaxation</h3>
                  <p className="carousel-description">
                  Unwind and Rejuvenate - Relax with spas in Ubud, yoga near Canggu, or a traditional Balinese massage. 
                  </p>
                </div>
              </Carousel.Item>
            </Carousel>
          </div>
        </div>
      </div>
      <div className="Get-Started-bg" id="GetStarted">
        <h1 className="Get-Started-h1">
          Get Your Itinerary<br></br> in Just Few Minutes
        </h1>
        <br></br>
        <div className="Get-Started-button-div">
          <button className="Get-Started-button" onClick={handleClick}>
            SIGN UP{" "}
          </button>
          
        </div>
       
   
      </div>

      <div className="Get-Started-footer">
        <table class="footer-table">
          <thead>
            <tr>
              <th class="footer-table-tr1">Only 2 Bali</th>
              <th class="footer-table-tr2">
                <img src={facebook} className="social-icon" alt=""/>
                <img src={instagram} className="social-icon" alt=""/>
                <img src={linkedin} className="social-icon" alt=""/>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="copyright">Copyright ©2025 Only2Bali. All Rights Reserved</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
