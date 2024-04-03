import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";
import FootWear from "../fetch_product/footwear";



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

<Footer />
    </section>
   
  )
}

export default Footwear