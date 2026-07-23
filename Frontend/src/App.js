// import React from 'react';
// import { Routes, Route } from 'react-router-dom';
// import HomePage from './Pages/Home';
// import "./App.css";
// import OtpContainer from './Otpverfication';  // Ensure this is Otpverfication.js, not Otpverfication.js
// import SignUp from './SignUp';  // Ensure this is SignUp.js, not Signup.js
// import Signin from './Signin';  // Ensure this is Signin.js, not Signup.js
// import Forgotpassword from './Forgotpassword';  // Ensure this is Forgotpassword.js, not Signup.js
// import PasswordReset from './PasswordReset';  // Ensure this is PasswordReset.js, not Signup.js
// import DashboardPreferences from './DashboardPreferences';  // Ensure this is DashboardPreferences.js, not Signup.js
// import StartJourney from './JourneyStart';
// import Placestovisit from './Placestovisit';
// import BalineseAdventureForm from './BalineseAdventureForm';
// import Placetostay from './Placestostay';
// import Choosefoods from './Choosefoods';
// import Transports from './Transports';
// import Tourguide from './Tourguide';
// import IndianFood from './Indianfood';
// import Paperwork from './paperwork';
// import Vendor from './vendor';
// import ExtraRequest from './ExtraRequest';  
// import ItineraryPage from './ItineraryPage';  
// import Settings from './Settings';
// import Editproflie from './Editproflie';
// import FaqPage from './FaqPage';
// import { useEffect } from "react";
// import ItineraryDate from './Itinerarydate';
// import AllItineraryPages from './AllItineraryPages';
// import FunkyCursor from "./StopMotionCursor";


// function App() {
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);
//   return (
// <>  <FunkyCursor />
//       <Routes >
         
//         <Route path="/" element={<HomePage />} />
//         <Route path="/signup" element={<SignUp />} />
//         <Route path="/otpverfication" element={<OtpContainer />} />
//         <Route path="/signin" element={<Signin />} />
//         <Route path='/forgotpassword' element={<Forgotpassword />} />
//         <Route path='/passwordreset' element={<PasswordReset />} />
//         <Route path='/dashboardPreferences' element={<DashboardPreferences />} />
//         <Route path='/reset-password/:uid/:token' element={<PasswordReset />} />
//       <Route path='/journeystart' element={<StartJourney/>} />
//       <Route path='/placestovisit' element={<Placestovisit/>} />  
//       <Route path='/balineseAdventureForm' element={<BalineseAdventureForm/>} />    
//     <Route path='/placetostay' element={<Placetostay/>} />
//     <Route path='/choosefoods' element={<Choosefoods/>} />
//         <Route path='/Transports' element={<Transports/>} />
//         <Route path='/Tourguide' element={<Tourguide/>} />
//         <Route path='/Indianfood' element={<IndianFood/>}/>
//         <Route path='/paperwork' element={<Paperwork/>} />
//         <Route path='/vendor' element={<Vendor/>} />
//         <Route path='/ExtraRequest' element={<ExtraRequest/>} />
//         <Route path='/ItineraryPage' element={<ItineraryPage/>} />
//         <Route path='/Settings' element={<Settings/>} />
//         <Route path='/Editprofile' element={<Editproflie/>} />
//         <Route path='/FaqPage' element={<FaqPage/>} />
//         <Route path='/ItineraryDate' element={<ItineraryDate/>} />
//         <Route path='/AllItineraryPages' element={<AllItineraryPages/>} />
      
//       </Routes>
//     </>
//   );
// }

// export default App;


import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// './pages', lower case. Home.js used to be tracked under 'Pages/' while every
// other page sat in 'pages/'. Windows merges the two, Linux does not, so the
// repository carried two directories differing only by case.
import HomePage from './pages/Home';
import SignUp from './SignUp';
import OtpContainer from './Otpverfication';
import Signin from './Signin';
import Forgotpassword from './Forgotpassword';
import PasswordReset from './PasswordReset';
import DashboardPreferences from './DashboardPreferences';
import StartJourney from './JourneyStart';
import Placestovisit from './Placestovisit';
import BalineseAdventureForm from './BalineseAdventureForm';
import Placetostay from './Placestostay';
import Choosefoods from './Choosefoods';
import Transports from './Transports';
import Tourguide from './Tourguide';
import IndianFood from './Indianfood';
import Paperwork from './paperwork';
import Vendor from './vendor';
import VendorOnboarding from './VendorOnboarding';
import ExtraRequest from './ExtraRequest';
import ItineraryPage from './ItineraryPage';
import Settings from './Settings';
import Editproflie from './Editproflie';
import FaqPage from './FaqPage';
import ItineraryDate from './Itinerarydate';
import AllItineraryPages from './AllItineraryPages';
import FunkyCursor from './StopMotionCursor';
import GlobalLoader from './GlobalLoader';
import PlanTrip from './pages/PlanTrip';
import ItineraryPageNew from './pages/Itinerary';
import BookingPage from './pages/Booking';
import NotFound from './pages/NotFound';

const AppContent = () => {
  // 1. Set up a state to track loading
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // 2. Listen for route changes and simulate loading
  useEffect(() => {
    // When the route changes, set loading to true
    setLoading(true);

    // Simulate an async operation (like fetching data)
    // Replace the timeout with your actual logic
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Clear timer if component unmounts or location changes again
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      {/* 3. Display the global loader */}
      <GlobalLoader loading={loading} />

      {/* 4. Render your routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/otpverfication" element={<OtpContainer />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/forgotpassword" element={<Forgotpassword />} />
        <Route path="/passwordreset" element={<PasswordReset />} />
        <Route path="/dashboardPreferences" element={<DashboardPreferences />} />
        <Route path="/journeystart" element={<StartJourney />} />
        <Route path="/placestovisit" element={<Placestovisit />} />
        <Route path="/balineseAdventureForm" element={<BalineseAdventureForm />} />
        <Route path="/placetostay" element={<Placetostay />} />
        <Route path="/choosefoods" element={<Choosefoods />} />
        <Route path="/Transports" element={<Transports />} />
        <Route path="/Tourguide" element={<Tourguide />} />
        <Route path="/Indianfood" element={<IndianFood />} />
        <Route path="/paperwork" element={<Paperwork />} />
        <Route path="/vendor" element={<Vendor />} />
        <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
        <Route path="/ExtraRequest" element={<ExtraRequest />} />
        <Route path="/ItineraryPage" element={<ItineraryPage />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/Editprofile" element={<Editproflie />} />
        <Route path="/FaqPage" element={<FaqPage />} />
        <Route path="/ItineraryDate" element={<ItineraryDate />} />
        <Route path="/AllItineraryPages" element={<AllItineraryPages />} />
        <Route path="/plan" element={<PlanTrip />} />
        <Route path="/itinerary" element={<ItineraryPageNew />} />
        <Route path="/booking" element={<BookingPage />} />
        {/* Anything else. Without this the app rendered a blank page and the
            host answered 200, so unmatched URLs were indexed as real pages. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <FunkyCursor />
      <AppContent />
      {/* The chat widget was removed on 2026-07-23. It called the FastAPI
          service in Backend/app/, which is deployed nowhere, so it showed
          "We're offline" on every page of the live site. */}
    </>
  );
}

export default App;
