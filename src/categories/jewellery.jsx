import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Breadcrumb from "../components/breadcrumb";
import Update from "../components/update";
import Jewelry from "../fetch_product/jewelry";



function Jewellery() {



  return (
    <section>
    <Header />
    <div id="main">
<Update />
   <Breadcrumb title="Footwear and Shoes" />
<Jewelry />
<Sidebar />


</div>

<Footer />
    </section>
   
  )
}

export default Jewellery