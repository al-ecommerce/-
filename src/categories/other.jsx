import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Breadcrumb from "../components/breadcrumb";
import ScrollToTop from "react-scroll-to-top";
import Others from "../fetch_product/other";



function Other() {



  return (
    <section>
    <Header />
    <div id="main">
   <Breadcrumb title="Other Products" />
<Others />
<Sidebar />

</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default Other