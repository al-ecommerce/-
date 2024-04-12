import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Vehicle from "../fetch_product/vehicle";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";
import ScrollToTop from "react-scroll-to-top";



function VehicleC() {



  return (
    <section>
    <Header />
    <div id="main">
<Update />
   <Breadcrumb title="Vehicles" />
<Vehicle />
<Sidebar />


</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default VehicleC