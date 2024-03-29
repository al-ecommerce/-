import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/home";
import VehicleC from "./categories/vehicle";
import Art from "./categories/art";
import Fashion from "./categories/fashion";
import Property from "./categories/property";
import HB from "./categories/h&b";
import Electronic from "./categories/electronic";
import Agric from "./categories/agric";
import BK from "./categories/babies_kids";
import Error from "./pages/error";
import HomeA from "./categories/home_furn";
import SignLog from "./components/sign_login";
import Details from "./pages/details";
import PlaceO from "./pages/place_order";
// import Sell from "./pages/sell";


function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Error />} />
        <Route path="/fashion" element={<Fashion />} />
        {/* <Route path="/sell" element={<Sell />} /> */}
        <Route path="/sign_login" element={<SignLog />} />
        <Route path="/h&b" element={<HB />} />
        <Route path="/home_appl" element={<HomeA />} />
        <Route path="/B&K" element={<BK />} />
        <Route path="/art" element={<Art />} />
        <Route path="/agric" element={<Agric />} />
        <Route path="/property" element={<Property />} />
       <Route path="/electronics" element={<Electronic />} />
       <Route path="/checkout" element={<PlaceO />} />
       <Route path="/details" element={<Details />} />
        <Route path="/vehicle" element={<VehicleC />} />
      </Route>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
