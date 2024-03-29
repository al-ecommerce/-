import { useEffect, useState } from "react"
import Header from "../components/header";
import "../style.css";
import "../bootstrap.css";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Update from "../components/update";

const oper={
    color:"#3bbode",
    textDecoration:"underline",
    cursor:"pointer"
}

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
var tr=document.createElement("tr");

tr.innerHTML+=`
<td>${data[i].id}</td>
<td>${data[i].product}</td>
<td>${data[i].price}</td>
<td>${data[i].category}</td>
<td>${data[i].date}</td>

`

det.appendChild(tr)
    }
    }
}



function myOrder(){
    document.getElementById("checkingord").style.display="block"
   
    fetch("http://localhost:3001/orders")
    .then(res=> res.json())
    .then(data=> fetchOrder(data))
    .catch(err => console.log(err))
}

function fetchOrder(data){
    var email=document.getElementById("loginemail").value;
   
    for(var i=0; i< data.length; i++){
    if(email === data[i].email_to){
var ordd=document.getElementById("ordd");
var tr=document.createElement("tr");

tr.innerHTML+=`
<td onclick="document.location.href='mailto:${data[i].email}'" style="color:blue;cursor:pointer">${data[i].email}</td>
<td>${data[i].product}</td>
<td onclick="document.location.href='tel:${data[i].phone}'" style="color:blue;cursor:pointer">${data[i].phone}</td>
<td>${data[i].name}</td>
<td>${data[i].quantity}</td>
<td>${data[i].country}</td>
<td>${data[i].address}</td>
<td>${data[i].date}</td>

`

ordd.appendChild(tr)
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
    var material=document.getElementById("material").value;
    var image=document.getElementById("img").value;
    // const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const d=new Date();
// let monthy = month[d.getMonth()];
// let year= d.getFullYear();
    
    // var date=d.getDate();

    let date=d.toLocaleDateString()
   let time=d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

    if(image == ""){
        image="/img/products/loader.gif";
    }

    fetch(`http://localhost:3001/${cat}`, {
        method:"POST",
        body:JSON.stringify({
            "email":email,
            "product":product,
            "price":price,
            "color":color,
            "image":image,
            "country":country,
            "seller_name":name,
            "date":date+" "+time,
            "size":size,
            "contact":contact,
            "description":descrip,
            "materialU":material,
            "category":cat,
            "status":"posted"
        }),

        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
    alert(`Success! Product pushed to Category: ${cat}`);
    document.getElementById("prod").value="";
    document.getElementById("price").value="";
    document.getElementById("color").value="";
    document.getElementById("country").value="";
    document.getElementById("name").value="";
    document.getElementById("size").value="";
    document.getElementById("contact").value="";
    document.getElementById("descrip").value="";
    document.getElementById("material").value="";
    document.getElementById("img").value="";
      
    }
    )
    .catch(err => console.log(err))
}




function fetchID(){
    fetch("http://localhost:3001/vehicle")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/property")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/fashion")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))

    fetch("http://localhost:3001/agric")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/products")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))

    fetch("http://localhost:3001/art_craft")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/babies_kids")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))

    fetch("http://localhost:3001/electronic")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/health_beauty")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))
}


function updateDetails(data){
    var email=document.getElementById("loginemail").value;
   var prodid=document.getElementById("prodid").value;

    for(var i=0; i< data.length; i++){
    if(email === data[i].email && prodid === data[i].id){
        document.getElementById("updF").style.display="";
        document.getElementById("produpd").value=data[i].product;
        document.getElementById("priceupd").value=data[i].price;
        document.getElementById("colorupd").value=data[i].color;
        document.getElementById("countryupd").value=data[i].country;
        document.getElementById("catupd").value=data[i].category;
        document.getElementById("nameupd").value=data[i].seller_name;
        document.getElementById("sizeupd").value=data[i].size;
        document.getElementById("contactupd").value=data[i].contact;
        document.getElementById("descripupd").value=data[i].description;
        document.getElementById("materialupd").value=data[i].materialU;
    document.getElementById("imgupd").value=data[i].image;
    }
    
    }
}



function deleteID(){
    fetch("http://localhost:3001/vehicle")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/property")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/fashion")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))

    fetch("http://localhost:3001/agric")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/products")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))

    fetch("http://localhost:3001/art_craft")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/babies_kids")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))

    fetch("http://localhost:3001/electronic")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("http://localhost:3001/health_beauty")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))
}




function deleteDetails(data){
    var email=document.getElementById("loginemail").value;
   var prodid=document.getElementById("delid").value;

    for(var i=0; i< data.length; i++){
    if(email === data[i].email && prodid === data[i].id){
        document.getElementById("delF").style.display="";
        document.getElementById("proddel").value=data[i].product;
        document.getElementById("catdel").value=data[i].category;
    }
    
    }
}



function DeleteGo(){
   var catdel= document.getElementById("catdel").value;
var prodid=document.getElementById("delid").value;



fetch(`http://localhost:3001/${catdel}/${prodid}`, {
    method:"DELETE",
    headers:{
        "Content-type":"application/json"
    }
})
.then(res => res.json())
.then(data => {
    console.log(data)
alert("Success! Product deleted");
 document.getElementById("proddel").value="";
document.getElementById("delid").value="";
document.getElementById("catdel").value="";
document.getElementById("delF").style.display="none";

}
)
.catch(err => console.log(err))
}


function UpdateGo(){
    var produpd=document.getElementById("produpd").value;
   var priceupd= document.getElementById("priceupd").value;
    var colorupd=document.getElementById("colorupd").value;
    var countryupd=document.getElementById("countryupd").value;
   var catupd= document.getElementById("catupd").value;
    var nameupd=document.getElementById("nameupd").value;
    var sizeupd=document.getElementById("sizeupd").value;
    var contactupd=document.getElementById("contactupd").value;
    var descripupd=document.getElementById("descripupd").value;
    var materialupd=document.getElementById("materialupd").value;
var imgupd=document.getElementById("imgupd").value;
var prodid=document.getElementById("prodid").value;



fetch(`http://localhost:3001/${catupd}/${prodid}`, {
    method:"PATCH",
    body:JSON.stringify({
        "product":produpd,
        "price":priceupd,
        "color":colorupd,
        "image":imgupd,
        "country":countryupd,
        "seller_name":nameupd,
        "size":sizeupd,
        "contact":contactupd,
        "description":descripupd,
        "materialU":materialupd
    }),

    headers:{
        "Content-type":"application/json"
    }
})
.then(res => res.json())
.then(data => {
    console.log(data)
alert("Success! Product updated");
 document.getElementById("produpd").value="";
document.getElementById("priceupd").value="";
document.getElementById("colorupd").value="";
document.getElementById("countryupd").value="";
document.getElementById("nameupd").value="";
document.getElementById("sizeupd").value="";
document.getElementById("contactupd").value="";
document.getElementById("descripupd").value="";
document.getElementById("materialupd").value="";
document.getElementById("imgupd").value="";
document.getElementById("prodid").value="";
document.getElementById("catupd").value="";
document.getElementById("prodid").value="";
document.getElementById("updF").style.display="none";

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
<Update />
<br/>
<br/>
<br/>

<button id="chkorders" onClick={myOrder}>
    Check Orders
</button>

<div id="checkingord" style={{display:"none"}}>
                            <div className="checkout__order">
                                <h4 className="order__title" >Orders</h4>
                                <section style={{overflowX:"auto"}} className="checkout__total__products">
                                <table className="table"  id="ordd">
                                    <tr>
                                    <th>Email</th>
                                    <th>Product</th>
                                    <th>Phone</th>
                                    <th>Name</th>
                                    <th>Quantity</th>
                                    <th>Country</th>
                                    <th>Address</th>
                                    <th>Date_P</th>
                                    </tr>


                                </table>   
                                                                    
                                </section>
                                
                            
                         </div>
                         </div>


<section className="checkout spad">
        <div className="container">
            <h2 style={{textAlign:"justify",fontWeight:"700"}}>Welcome <a id="wlcm"></a></h2>
            <div className="checkout__form">
            <input id="loginemail" style={{visibility:"hidden"}} readOnly/>
                      
                <form action="#" id="pst" onSubmit={PostGo}>
                    <div className="row">
                        <div className="col-lg-8 col-md-6">
                            <h6 className="checkout__title">Details</h6>
                             <p>Post your products now for free. You can click on "check orders" button to see whether someone has ordered for your posted product. </p>
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
                                <p>Image Url<span>*</span></p>
                                <input id="img" type="text"/>
                            </div>
                            <div className="checkout__input">
                                <p>Product Category<span>*</span><small>your product name must suite the product category. Just change the product category to suite.</small></p>
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
                                        <p>Product Information<span>*</span></p>
                                        <textarea id="descrip" placeholder="brief" type="text" required></textarea>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Material Used<span>*</span></p>
                                        <textarea id="material" placeholder="material" type="text"></textarea>
                                    </div>
                                </div>
                            </div>
                          </div> 
                        
                        
                        <div className="col-lg-4 col-md-6">
                            <div className="checkout__order">
                                <h4 className="order__title" >My POST</h4>
                                <p>Click on GET to view your posts. If you haven't posted anything yet, then nothing would be shown. The id or product_id helps you to update and delete a post.</p>
                                <h6 style={{cursor:"pointer",color:"orange", fontWeight:"800"}} onClick={myPost}>GET</h6>
                                <section style={{overflowX:"auto"}} className="checkout__total__products">
                                <table className="table" id="det">
                                    <tr>
                                    <th>Id</th>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Category</th>
                                    <th>Date_P</th>
                                    </tr>


                                </table>   
                                                                    
                                </section>
                                
                                
                                <button type="submit" className="site-btn">POST</button>
                            
                         </div>
                        </div>
                    </div>
                </form>




                <form action="#" onSubmit={UpdateGo} id="upd" style={{display:"none"}}>
                    <p>To update a product, type the product id in the Product Id field. This will load the product enquiries to be edited.</p>
                    <div className="row">
                    <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Product ID<span>*</span></p>
                                        <input onKeyDown={fetchID} id="prodid" type="text" required/>
                                    </div>
                                </div>
                        <div className="col-lg-8 col-md-6" id="updF" style={{display:"none"}}>
                            <h6 className="checkout__title">Update</h6>
                             
                            <div className="row">
                    
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Product Name<span>*</span></p>
                                        <input id="produpd" type="text" />
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Price<span>*</span></p>
                                        <input id="priceupd" type="text" placeholder="GHC..."/>
                                    </div>
                                </div>
                            </div>
                            <div className="checkout__input">
                                <p>Country<span>*</span></p>
                                <input id="countryupd" type="text" />
                            </div>
                            <div className="checkout__input">
                                <p>Category<span>*</span></p>
                                <input id="catupd" type="text" readOnly/>
                            </div>
                            <div className="checkout__input">
                                <p>Your Name<span>*</span></p>
                                <input id="nameupd" type="text" className="checkout__input__add" />
                            </div>
                            <div className="checkout__input">
                                <p>Size<span>*</span></p>
                                <input id="sizeupd" type="text"/>
                            </div>
                            <div className="checkout__input">
                                <p>Color<span>*</span></p>
                                <input id="colorupd" type="text"/>
                            </div>

                            <div className="checkout__input">
                                <p>Image Url<span>*</span></p>
                                <input id="imgupd" type="text"/>
                            </div>
                            <div className="row">
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Contact<span>*</span></p>
                                        <input id="contactupd" type="number" />
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Product Information<span>*</span></p>
                                        <textarea id="descripupd" placeholder="brief" type="text"></textarea>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Material Used<span>*</span></p>
                                        <textarea id="materialupd" placeholder="material" type="text" ></textarea>
                                    </div>
                                </div>
                            </div>
                          </div> 
                        
                        
                        <div className="col-lg-4 col-md-6">
                            <div className="checkout__order">
                               
                                <button type="submit" className="site-btn">UPDATE</button>
                            
                            </div>
                        </div>
                    </div>
                </form>


                <form action="#" onSubmit={DeleteGo} id="del"  style={{display:"none"}}>
                    <p>To delete a product, type the product id. If the product id exist, then it will load the product enquiries. Then click the Delete button to delete.</p>
                    <div className="row">
                    <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Product ID<span>*</span></p>
                                        <input onKeyDown={deleteID} id="delid" type="text" required/>
                                    </div>
                                </div>
                        <div className="col-lg-8 col-md-6" id="delF" style={{display:"none"}}>
                            <h6 className="checkout__title">Delete</h6>
                             
                            <div className="row">
                    
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Product Name<span>*</span></p>
                                        <input id="proddel" type="text" readOnly/>
                                    </div>
                                </div>
                                
                            </div>
                            <div className="checkout__input">
                                <p>Category<span>*</span></p>
                                <input id="catdel" type="text" readOnly/>
                            </div>
                          
                          </div> 
                        
                        
                        <div className="col-lg-4 col-md-6">
                            <div className="checkout__order">
                               
                                <button type="submit" className="site-btn">DELETE</button>
                            
                            </div>
                        </div>
                    </div>
                </form>




<ul>
    <li><a style={oper} onClick={()=>{document.getElementById("upd").style.display="none";document.getElementById("pst").style.display="";document.getElementById("del").style.display="none"}}>POST a Product</a></li>
    <li><a style={oper} onClick={()=>{document.getElementById("pst").style.display="none";document.getElementById("upd").style.display="";document.getElementById("del").style.display="none"}}>Update a Product</a></li>
    <li><a style={oper} onClick={()=>{document.getElementById("pst").style.display="none";document.getElementById("del").style.display="";document.getElementById("upd").style.display="none"}}>Delete a Product</a></li>
   </ul>
            </div>
        </div>
    </section>
</div>

<Footer />
    </section>
   
  )
}

export default Sell