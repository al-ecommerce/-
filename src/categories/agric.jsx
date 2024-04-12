import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Agricl from "../fetch_product/agric";
import Breadcrumb from "../components/breadcrumb";
import ScrollToTop from "react-scroll-to-top";



function Agric() {



  return (
    <section>
    <Header />
    <div id="main">
   <Breadcrumb title="Agriculture and Food" />
<Agricl />
<Sidebar />

</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default Agric