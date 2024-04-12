import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import H_B from "../fetch_product/h&b";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";
import ScrollToTop from "react-scroll-to-top";



function HB() {



  return (
    <section>
    <Header />
    <div id="main">
<Update />
   <Breadcrumb title="Health and Beauty" />
<H_B />
<Sidebar />

</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default HB