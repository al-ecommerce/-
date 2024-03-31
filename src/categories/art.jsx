import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import ArtC from "../fetch_product/art";
import Breadcrumb from "../components/breadcrumb";



function Art() {



  return (
    <section>
    <Header />
    <div id="main">
   <Breadcrumb title="Art and Craft" />
<ArtC />
<Sidebar />

</div>

<Footer />
    </section>
   
  )
}

export default Art