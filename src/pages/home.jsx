import { useEffect, useState } from "react"
import Header from "../components/header";
import Banner from "../components/banner";
import "../style.css";
import "../bootstrap.css";
import Latest from "../fetch_product/latest_products";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";



function Home() {

//   var path="http://localhost:3001/terms"
// const [data, setData]=useState([])


// useEffect(()=>{
//   fetch(path)
//   .then(res=> res.json())
//   .then(json =>
//         setData(json)
//   )
//   .catch(err => console.log(err))  
// },[])
  


  return (
    <section>
    <Header />
    <div id="main">
   <Banner />

   <section class="features-area section_gap">
		<div class="container">
			<div class="row features-inner">
				<div class="col-lg-3 col-md-6 col-sm-6">
					<div class="single-features">
						<div class="f-icon">
						</div>
						<h6>Free Delivery</h6>
						<p>Free Shipping on all order</p>
					</div>
				</div>
				<div class="col-lg-3 col-md-6 col-sm-6">
					<div class="single-features">
						<div class="f-icon">
						</div>
						<h6>Return Policy</h6>
						<p>Free Shipping on all order</p>
					</div>
				</div>
				<div class="col-lg-3 col-md-6 col-sm-6">
					<div class="single-features">
						<div class="f-icon">
						</div>
						<h6>24/7 Support</h6>
						<p>Free Shipping on all order</p>
					</div>
				</div>
				<div class="col-lg-3 col-md-6 col-sm-6">
					<div class="single-features">
						<div class="f-icon">
						</div>
						<h6>Secure Payment</h6>
						<p>Free Shipping on all order</p>
					</div>
				</div>
			</div>
		</div>
	</section>
<Latest />
<Sidebar />

</div>

<Footer />
    </section>
   
  )
}

export default Home