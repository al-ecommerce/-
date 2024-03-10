import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import BabiesK from "../fetch_product/b&k";
import Breadcrumb from "../components/breadcrumb";



function BK() {



  return (
    <section>
    <Header />
    <div id="main">
   <Breadcrumb title="Babies and Kids" />
<BabiesK />
<Sidebar />

</div>

<Footer />
    </section>
   
  )
}

export default BK