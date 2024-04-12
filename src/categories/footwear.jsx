import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";
import FootWear from "../fetch_product/footwear";
import ScrollToTop from "react-scroll-to-top";



function Footwear() {



  return (
    <section>
    <Header />
    <div id="main">
<Update />
   <Breadcrumb title="Footwear and Shoes" />
<FootWear />
<Sidebar />


</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default Footwear