import { useEffect, useState } from "react"
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import HomeAppl from "../fetch_product/home_furn";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";



function HomeA() {



  return (
    <section>
    <Header />
    <div id="main">
<Update />
   <Breadcrumb title="Home, Furniture & Appliances" />
<HomeAppl />
<Sidebar />
</div>

<Footer />
    </section>
   
  )
}

export default HomeA