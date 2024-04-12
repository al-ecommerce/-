import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Fash from "../fetch_product/fash";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";
import ScrollToTop from "react-scroll-to-top";


function Fashion() {



  return (
    <section>
    <Header />
    <div id="main">
<Update />
   <Breadcrumb title="Fashion and Clothing" />
<Fash />
<Sidebar />

</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default Fashion