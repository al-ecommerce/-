import { useEffect, useState } from "react"
import Header from "../components/header";
import Banner from "../components/banner";
import "../style.css";
import "../bootstrap.css";
import Latest from "../fetch_product/latest_products";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Update from "../components/update";
import Catarea from "../components/catarea";
import Catg from "../components/catg";



function Home() {

//   var path="https://faint-dandelion-lilac.glitch.me/terms"
// const [data, setData]=useState([])


// useEffect(()=>{
//   fetch(path)
//   .then(res=> res.json())
//   .then(json =>
//         setData(json)
//   )
//   .catch(err => console.log(err))  
// },[])
  

function loadApp(){
setTimeout(()=>{
	
var loadery=document.getElementById("loadery");
var the_main=document.getElementById("the_main");

	loadery.style.display="none";
	the_main.style.display="block";
}, 5000)
}
  return (
    <section onLoad={loadApp()}>
		<div id="loadery" className="loadery">
			<center>
				<div className="text">
			<a>AL<span>ECOM</span></a>
			<p>The best sales app</p>
			</div>
			</center>
		</div>
		<div id="the_main" style={{display:"none"}}>
    <Header />
    <div id="main">
		
<Update />
   <Banner />

   <section className="features-area section_gap">
		<div className="container">
			<div className="row features-inner">
				<div className="col-lg-3 col-md-6 col-sm-6">
					<div className="single-features">
						<div className="f-icon">
						</div>
						<h6>Free Delivery</h6>
						<p>Free Shipping on all order</p>
					</div>
				</div>
				<div className="col-lg-3 col-md-6 col-sm-6">
					<div className="single-features">
						<div className="f-icon">
						</div>
						<h6>Return Policy</h6>
						<p>Free Shipping on all order</p>
					</div>
				</div>
				<div className="col-lg-3 col-md-6 col-sm-6">
					<div className="single-features">
						<div className="f-icon">
						</div>
						<h6>24/7 Support</h6>
						<p>Free Shipping on all order</p>
					</div>
				</div>
				<div className="col-lg-3 col-md-6 col-sm-6">
					<div className="single-features">
						<div className="f-icon">
						</div>
						<h6>Secure Payment</h6>
						<p>Free Shipping on all order</p>
					</div>
				</div>
			</div>
		</div>
	</section>
<br/><br/><br/>
	
<Catarea />
<Latest />
<Catg />
<Sidebar />


</div>

<Footer />
</div>
    </section>
   
  )
}

export default Home