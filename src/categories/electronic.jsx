import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Elect from "../fetch_product/elect";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";
import ScrollToTop from "react-scroll-to-top";


function Electronic() {



  return (
    <section>
    <Header />
    <div id="main">
      
<Update />
   <Breadcrumb title="Electronics"/>
<Elect />
<Sidebar />

</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default Electronic