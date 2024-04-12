import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";
import Auto from "../fetch_product/auto";
import ScrollToTop from "react-scroll-to-top";



function AutoP() {



  return (
    <section>
    <Header />
    <div id="main">
<Update />
   <Breadcrumb title="Auto Parts" />
<Auto />
<Sidebar />


</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default AutoP