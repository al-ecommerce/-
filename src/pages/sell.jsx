import { useEffect, useState } from "react"
import Header from "../components/header";
import "../style.css";
import "../bootstrap.css";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";


function myPost(){
    fetch("http://localhost:3001/vehicle")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/property")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/fashion")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    fetch("http://localhost:3001/agric")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/products")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    fetch("http://localhost:3001/art_craft")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/babies_kids")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    fetch("http://localhost:3001/electronic")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    
    fetch("http://localhost:3001/health_beauty")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))
}

function fetchDetails(data){
    var email=document.getElementById("loginemail").value;
   
    for(var i=0; i< data.length; i++){
    if(email === data[i].email){
var det=document.getElementById("det");
var div=document.createElement("div");

div.innerHTML+=`
<table class="table">
<tr>
<th>Product</th>
<th>Price</th>
<th>Category</th>
<th>Descrip</th>
</tr>


<tr>
<td>${data[i].product}</td>
<td>${data[i].price}</td>
<td>${data[i].category}</td>
<td>${data[i].description}</td>
</tr>
</table>
`

det.appendChild(div)
    }
    }
}


function PostGo(){
    var cat=document.getElementById("select").value;
    var email=document.getElementById("loginemail").value;
    var product=document.getElementById("prod").value;
    var price=document.getElementById("price").value;
    var color=document.getElementById("color").value;
    var country=document.getElementById("country").value;
    var name=document.getElementById("name").value;
    var size=document.getElementById("size").value;
    var contact=document.getElementById("contact").value;
    var descrip=document.getElementById("descrip").value;
    
    fetch(`http://localhost:3001/${cat}`, {
        method:"POST",
        body:JSON.stringify({
            "email":email,
            "product":product,
            "price":price,
            "color":color,
            "country":country,
            "seller_name":name,
            "size":size,
            "contact":contact,
            "description":descrip,
            "category":cat
        }),

        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
    alert(`<a>Success</a>`);
    document.getElementById("prod").value="";
    document.getElementById("price").value="";
    document.getElementById("color").value="";
    document.getElementById("country").value="";
    document.getElementById("name").value="";
    document.getElementById("size").value="";
    document.getElementById("contact").value="";
    document.getElementById("descrip").value="";
    
    }
    )
    .catch(err => console.log(err))
}


function Sell() {

const [cat, setCat]=useState([]);


useEffect(()=>{
    fetch("http://localhost:3001/categories")
    .then(res => res.json())
    .then(data => setCat(data))
    .catch(err => console.log(err))

}, [])
    
  return (
    <section>
    <Header />
    <div id="main">
<Sidebar />

<br/>
<br/>
<br/>

<section className="checkout spad">
        <div className="container">
            <h2 style={{textAlign:"justify",fontWeight:"700"}}>Welcome <a id="wlcm"></a></h2>
            <div className="checkout__form">
                <form action="#" onSubmit={PostGo}>
                    <div className="row">
                        <div className="col-lg-8 col-md-6">
                            <h6 className="checkout__title">Details</h6>
                            <input id="loginemail" style={{visibility:"hidden"}} readOnly/>
                            <div className="row">
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Product Name<span>*</span></p>
                                        <input id="prod" type="text" required/>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Price<span>*</span></p>
                                        <input id="price" type="text" required/>
                                    </div>
                                </div>
                            </div>
                            <div className="checkout__input">
                                <p>Country<span>*</span></p>
                                <input id="country" type="text" required/>
                            </div>
                            <div className="checkout__input">
                                <p>Your Name<span>*</span></p>
                                <input id="name" type="text" className="checkout__input__add" required/>
                            </div>
                            <div className="checkout__input">
                                <p>Size<span>*</span></p>
                                <input id="size" type="text"/>
                            </div>
                            <div className="checkout__input">
                                <p>Color<span>*</span></p>
                                <input id="color" type="text"/>
                            </div>
                            <div className="checkout__input">
                                <p>Product Category<span>*</span></p>
                                <select style={{width:"100%"}} id="select">
                                    {cat.map(category =>(
                                        <option value={category.value}>{category.category}</option>
                                    ))}
                                    </select>
                            </div>
                            <div className="row">
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Contact<span>*</span></p>
                                        <input id="contact" type="number" required/>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Description<span>*</span></p>
                                        <textarea id="descrip" placeholder="brief" type="text" required></textarea>
                                    </div>
                                </div>
                            </div>
                           
                        
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="checkout__order">
                                <h4 className="order__title" >My POST</h4>
                                <h6 style={{cursor:"pointer",color:"orange", fontWeight:"800"}} onClick={myPost}>GET</h6>
                                <section className="checkout__total__products" id="det">
                                   
                                   
                                </section>
                                
                                
                                <button type="submit" className="site-btn">POST</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </section>
</div>

<Footer />
    </section>
   
  )
}

export default Sell