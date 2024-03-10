import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import H_B from "../fetch_product/h&b";
import Breadcrumb from "../components/breadcrumb";



function HB() {



  return (
    <section>
    <Header />
    <div id="main">
   <Breadcrumb title="Health and Beauty" />
<H_B />
<Sidebar />

</div>

<Footer />
    </section>
   
  )
}

export default HB