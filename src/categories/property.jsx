import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Propty from "../fetch_product/propty";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";
import ScrollToTop from "react-scroll-to-top";



function Property() {



  return (
    <section>
    <Header />
    <div id="main">
      
<Update />
   <Breadcrumb title="Property" />
<Propty />
<Sidebar />
</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default Property