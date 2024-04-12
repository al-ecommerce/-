import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import ArtC from "../fetch_product/art";
import Breadcrumb from "../components/breadcrumb";
import ScrollToTop from "react-scroll-to-top";



function Art() {



  return (
    <section>
    <Header />
    <div id="main">
   <Breadcrumb title="Art and Craft" />
<ArtC />
<Sidebar />

</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default Art