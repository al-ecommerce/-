import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Fash from "../fetch_product/fash";
import Breadcrumb from "../components/breadcrumb";


function Fashion() {



  return (
    <section>
    <Header />
    <div id="main">
   <Breadcrumb title="Fashion" />
<Fash />
<Sidebar />

</div>

<Footer />
    </section>
   
  )
}

export default Fashion