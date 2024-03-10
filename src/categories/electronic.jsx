import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Elect from "../fetch_product/elect";
import Breadcrumb from "../components/breadcrumb";


function Electronic() {



  return (
    <section>
    <Header />
    <div id="main">
   <Breadcrumb title="Electronics"/>
<Elect />
<Sidebar />

</div>

<Footer />
    </section>
   
  )
}

export default Electronic