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
<Latest />
<Sidebar />

{/* 
{data.map(datas=>(
  <div>
    <p>{datas.abbreviation}</p>
    
    <p>{datas.mean}</p>
  </div>
))} */}
</div>

<Footer />
    </section>
   
  )
}

export default Home