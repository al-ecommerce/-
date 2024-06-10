import { useEffect, useState } from "react"
import Header from "../components/header";
import "../style.css";
import "../bootstrap.css";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Update from "../components/update";
import ScrollToTop from "react-scroll-to-top";
import { Link } from "react-router-dom";

const oper={
    fontFamily:"sans-serif",
    textTransform: "uppercase",
    fontWeight: "500",
    fontSize: "16px",
    letterSpacing: "1px",
    display: "inline-block",
    background:"#3bb0de",
    padding: "8px 28px",
    borderRadius: "4px",
    transition: "0.5s",
    border: "2px solid #fff",
    color: "#fff"
}

function myPost(){
    fetch("https://tarry-hail-koala.glitch.me/vehicle")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/property")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/fashion")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/agric")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/products")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/art_craft")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/babies_kids")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/electronic")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/health_beauty")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    
    fetch("https://tarry-hail-koala.glitch.me/footwear")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    
    fetch("https://tarry-hail-koala.glitch.me/jewellery")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    
    fetch("https://tarry-hail-koala.glitch.me/auto")
    .then(res=> res.json())
    .then(data=> fetchDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/other")
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
<td onclick="navigator.clipboard.writeText(${data[i].id});alert('Copied ${data[i].id}');">${data[i].id}</td>
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
    document.getElementById("checkingord").style.display="block";
    
    document.getElementById("checkingord").scrollIntoView();
   
    fetch("https://tarry-hail-koala.glitch.me/orders")
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
<td>${data[i].payment_method}</td>
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
    var avail=document.getElementById("avail").value;
    var gender=document.getElementById("gender").value;
    var image=document.getElementById("img").value;
    // const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const d=new Date();
// let monthy = month[d.getMonth()];
// let year= d.getFullYear();
    
    // var date=d.getDate();

    let date=d.toLocaleDateString()
   let time=d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
   var id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    if(image == ""){
        image="https://miro.medium.com/v2/resize:fit:1400/1*okbBhXU2x0f_eFyUVyc-gA.gif";
    }

    fetch(`https://tarry-hail-koala.glitch.me/${cat}`, {
        method:"POST",
        body:JSON.stringify({
            "id":id,
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
            "availability":avail,
            "description":descrip,
            "materialU":material,
            "category":cat,
            "gender":gender,
            "status":"posted"
        }),

        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res => res.json())
    .then(data => {
        
    alert(`Success! Product pushed to Category: ${cat}`);
        console.log(data);

    document.getElementById("prod").value="";
    document.getElementById("price").value="";
    document.getElementById("color").value="";
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
    fetch("https://tarry-hail-koala.glitch.me/vehicle")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/property")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/fashion")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/agric")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/products")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/art_craft")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/babies_kids")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/electronic")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/health_beauty")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/footwear")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/auto")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/jewellery")
    .then(res=> res.json())
    .then(data=> updateDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/other")
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
        document.getElementById("availupd").value=data[i].availability;
        document.getElementById("descripupd").value=data[i].description;
        document.getElementById("materialupd").value=data[i].materialU;
    document.getElementById("imgupd").value=data[i].image;
    }
    
    }
}



function deleteID(){
    fetch("https://tarry-hail-koala.glitch.me/vehicle")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/property")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/fashion")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/agric")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/products")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/art_craft")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/babies_kids")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))

    fetch("https://tarry-hail-koala.glitch.me/electronic")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    fetch("https://tarry-hail-koala.glitch.me/health_beauty")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))

    
    fetch("https://tarry-hail-koala.glitch.me/auto")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


    
    fetch("https://tarry-hail-koala.glitch.me/jewellery")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))

    
    fetch("https://tarry-hail-koala.glitch.me/footwear")
    .then(res=> res.json())
    .then(data=> deleteDetails(data))
    .catch(err => console.log(err))


     fetch("https://tarry-hail-koala.glitch.me/other")
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



fetch(`https://tarry-hail-koala.glitch.me/${catdel}/${prodid}`, {
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
    var availupd=document.getElementById("availupd").value;
    var genderupd=document.getElementById("genderupd").value;
    var descripupd=document.getElementById("descripupd").value;
    var materialupd=document.getElementById("materialupd").value;
var imgupd=document.getElementById("imgupd").value;
var prodid=document.getElementById("prodid").value;



fetch(`https://tarry-hail-koala.glitch.me/${catupd}/${prodid}`, {
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
        "availability":availupd,
        "gender":genderupd,
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
document.getElementById("availupd").value="";
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
    fetch("https://tarry-hail-koala.glitch.me/categories")
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


<div style={{background:"gold",color:"black",padding:"10px 12px",width:"100%"}} id="notice_brd">
    <a id="notice"></a>
</div>
<br/>
<br/>
<Link to="/personal_details">
<button style={oper} >My Personal Details</button>
  </Link>
<div id="checkingord" style={{display:"none"}}>
                            <div className="checkout__order">
                                <h4 className="order__title" >Order Details</h4>
                                <section style={{overflowX:"auto"}} className="checkout__total__products">
                                <h6>Customer details</h6>
                                <table className="table"  id="ordd">
                                    <tr>
                                    <th>Email</th>
                                    <th>Product</th>
                                    <th>Phone</th>
                                    <th>Name</th>
                                    <th>Quantity</th>
                                    <th>Country</th>
                                    <th>Address</th>
                                    <th>Pay_method</th>
                                    <th>Ordered Date</th>
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
                      
                <form  id="pst" onSubmit={PostGo}>
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
                                <select id="country">
                <option value="Ghana">Ghana</option>
                <option value="Afghanistan">Afghanistan</option>
                <option value="Åland Islands">Åland Islands</option>
                <option value="Albania">Albania</option>
                <option value="Algeria">Algeria</option>
                <option value="American Samoa">American Samoa</option>
                <option value="Andorra">Andorra</option>
                <option value="Angola">Angola</option>
                <option value="Anguilla">Anguilla</option>
                <option value="Antarctica">Antarctica</option>
                <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                <option value="Argentina">Argentina</option>
                <option value="Armenia">Armenia</option>
                <option value="Aruba">Aruba</option>
                <option value="Australia">Australia</option>
                <option value="Austria">Austria</option>
                <option value="Azerbaijan">Azerbaijan</option>
                <option value="Bahamas">Bahamas</option>
                <option value="Bahrain">Bahrain</option>
                <option value="Bangladesh">Bangladesh</option>
                <option value="Barbados">Barbados</option>
                <option value="Belarus">Belarus</option>
                <option value="Belgium">Belgium</option>
                <option value="Belize">Belize</option>
                <option value="Benin">Benin</option>
                <option value="Bermuda">Bermuda</option>
                <option value="Bhutan">Bhutan</option>
                <option value="Bolivia">Bolivia</option>
                <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                <option value="Botswana">Botswana</option>
                <option value="Bouvet Island">Bouvet Island</option>
                <option value="Brazil">Brazil</option>
                <option value="British Indian Ocean Territory">British Indian Ocean Territory</option>
                <option value="Brunei Darussalam">Brunei Darussalam</option>
                <option value="Bulgaria">Bulgaria</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Burundi">Burundi</option>
                <option value="Cambodia">Cambodia</option>
                <option value="Cameroon">Cameroon</option>
                <option value="Canada">Canada</option>
                <option value="Cape Verde">Cape Verde</option>
                <option value="Cayman Islands">Cayman Islands</option>
                <option value="Central African Republic">Central African Republic</option>
                <option value="Chad">Chad</option>
                <option value="Chile">Chile</option>
                <option value="China">China</option>
                <option value="Christmas Island">Christmas Island</option>
                <option value="Cocos (Keeling) Islands">Cocos (Keeling) Islands</option>
                <option value="Colombia">Colombia</option>
                <option value="Comoros">Comoros</option>
                <option value="Congo">Congo</option>
                <option value="Congo, The Democratic Republic of The">Congo, The Democratic Republic of The</option>
                <option value="Cook Islands">Cook Islands</option>
                <option value="Costa Rica">Costa Rica</option>
                <option value="Cote D'ivoire">Cote D'ivoire</option>
                <option value="Croatia">Croatia</option>
                <option value="Cuba">Cuba</option>
                <option value="Cyprus">Cyprus</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Denmark">Denmark</option>
                <option value="Djibouti">Djibouti</option>
                <option value="Dominica">Dominica</option>
                <option value="Dominican Republic">Dominican Republic</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Egypt">Egypt</option>
                <option value="El Salvador">El Salvador</option>
                <option value="Equatorial Guinea">Equatorial Guinea</option>
                <option value="Eritrea">Eritrea</option>
                <option value="Estonia">Estonia</option>
                <option value="Ethiopia">Ethiopia</option>
                <option value="Falkland Islands (Malvinas)">Falkland Islands (Malvinas)</option>
                <option value="Faroe Islands">Faroe Islands</option>
                <option value="Fiji">Fiji</option>
                <option value="Finland">Finland</option>
                <option value="France">France</option>
                <option value="French Guiana">French Guiana</option>
                <option value="French Polynesia">French Polynesia</option>
                <option value="French Southern Territories">French Southern Territories</option>
                <option value="Gabon">Gabon</option>
                <option value="Gambia">Gambia</option>
                <option value="Georgia">Georgia</option>
                <option value="Germany">Germany</option>
                <option value="Ghana">Ghana</option>
                <option value="Gibraltar">Gibraltar</option>
                <option value="Greece">Greece</option>
                <option value="Greenland">Greenland</option>
                <option value="Grenada">Grenada</option>
                <option value="Guadeloupe">Guadeloupe</option>
                <option value="Guam">Guam</option>
                <option value="Guatemala">Guatemala</option>
                <option value="Guernsey">Guernsey</option>
                <option value="Guinea">Guinea</option>
                <option value="Guinea-bissau">Guinea-bissau</option>
                <option value="Guyana">Guyana</option>
                <option value="Haiti">Haiti</option>
                <option value="Heard Island and Mcdonald Islands">Heard Island and Mcdonald Islands</option>
                <option value="Holy See (Vatican City State)">Holy See (Vatican City State)</option>
                <option value="Honduras">Honduras</option>
                <option value="Hong Kong">Hong Kong</option>
                <option value="Hungary">Hungary</option>
                <option value="Iceland">Iceland</option>
                <option value="India">India</option>
                <option value="Indonesia">Indonesia</option>
                <option value="Iran, Islamic Republic of">Iran, Islamic Republic of</option>
                <option value="Iraq">Iraq</option>
                <option value="Ireland">Ireland</option>
                <option value="Isle of Man">Isle of Man</option>
                <option value="Israel">Israel</option>
                <option value="Italy">Italy</option>
                <option value="Jamaica">Jamaica</option>
                <option value="Japan">Japan</option>
                <option value="Jersey">Jersey</option>
                <option value="Jordan">Jordan</option>
                <option value="Kazakhstan">Kazakhstan</option>
                <option value="Kenya">Kenya</option>
                <option value="Kiribati">Kiribati</option>
                <option value="Korea, Democratic People's Republic of">Korea, Democratic People's Republic of</option>
                <option value="Korea, Republic of">Korea, Republic of</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Kyrgyzstan">Kyrgyzstan</option>
                <option value="Lao People's Democratic Republic">Lao People's Democratic Republic</option>
                <option value="Latvia">Latvia</option>
                <option value="Lebanon">Lebanon</option>
                <option value="Lesotho">Lesotho</option>
                <option value="Liberia">Liberia</option>
                <option value="Libyan Arab Jamahiriya">Libyan Arab Jamahiriya</option>
                <option value="Liechtenstein">Liechtenstein</option>
                <option value="Lithuania">Lithuania</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Macao">Macao</option>
                <option value="Macedonia, The Former Yugoslav Republic of">Macedonia, The Former Yugoslav Republic of</option>
                <option value="Madagascar">Madagascar</option>
                <option value="Malawi">Malawi</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Maldives">Maldives</option>
                <option value="Mali">Mali</option>
                <option value="Malta">Malta</option>
                <option value="Marshall Islands">Marshall Islands</option>
                <option value="Martinique">Martinique</option>
                <option value="Mauritania">Mauritania</option>
                <option value="Mauritius">Mauritius</option>
                <option value="Mayotte">Mayotte</option>
                <option value="Mexico">Mexico</option>
                <option value="Micronesia, Federated States of">Micronesia, Federated States of</option>
                <option value="Moldova, Republic of">Moldova, Republic of</option>
                <option value="Monaco">Monaco</option>
                <option value="Mongolia">Mongolia</option>
                <option value="Montenegro">Montenegro</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Morocco">Morocco</option>
                <option value="Mozambique">Mozambique</option>
                <option value="Myanmar">Myanmar</option>
                <option value="Namibia">Namibia</option>
                <option value="Nauru">Nauru</option>
                <option value="Nepal">Nepal</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Netherlands Antilles">Netherlands Antilles</option>
                <option value="New Caledonia">New Caledonia</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Nicaragua">Nicaragua</option>
                <option value="Niger">Niger</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Niue">Niue</option>
                <option value="Norfolk Island">Norfolk Island</option>
                <option value="Northern Mariana Islands">Northern Mariana Islands</option>
                <option value="Norway">Norway</option>
                <option value="Oman">Oman</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Palau">Palau</option>
                <option value="Palestinian Territory, Occupied">Palestinian Territory, Occupied</option>
                <option value="Panama">Panama</option>
                <option value="Papua New Guinea">Papua New Guinea</option>
                <option value="Paraguay">Paraguay</option>
                <option value="Peru">Peru</option>
                <option value="Philippines">Philippines</option>
                <option value="Pitcairn">Pitcairn</option>
                <option value="Poland">Poland</option>
                <option value="Portugal">Portugal</option>
                <option value="Puerto Rico">Puerto Rico</option>
                <option value="Qatar">Qatar</option>
                <option value="Reunion">Reunion</option>
                <option value="Romania">Romania</option>
                <option value="Russian Federation">Russian Federation</option>
                <option value="Rwanda">Rwanda</option>
                <option value="Saint Helena">Saint Helena</option>
                <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                <option value="Saint Lucia">Saint Lucia</option>
                <option value="Saint Pierre and Miquelon">Saint Pierre and Miquelon</option>
                <option value="Saint Vincent and The Grenadines">Saint Vincent and The Grenadines</option>
                <option value="Samoa">Samoa</option>
                <option value="San Marino">San Marino</option>
                <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Senegal">Senegal</option>
                <option value="Serbia">Serbia</option>
                <option value="Seychelles">Seychelles</option>
                <option value="Sierra Leone">Sierra Leone</option>
                <option value="Singapore">Singapore</option>
                <option value="Slovakia">Slovakia</option>
                <option value="Slovenia">Slovenia</option>
                <option value="Solomon Islands">Solomon Islands</option>
                <option value="Somalia">Somalia</option>
                <option value="South Africa">South Africa</option>
                <option value="South Georgia and The South Sandwich Islands">South Georgia and The South Sandwich Islands</option>
                <option value="Spain">Spain</option>
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="Sudan">Sudan</option>
                <option value="Suriname">Suriname</option>
                <option value="Svalbard and Jan Mayen">Svalbard and Jan Mayen</option>
                <option value="Swaziland">Swaziland</option>
                <option value="Sweden">Sweden</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Syrian Arab Republic">Syrian Arab Republic</option>
                <option value="Taiwan">Taiwan</option>
                <option value="Tajikistan">Tajikistan</option>
                <option value="Tanzania, United Republic of">Tanzania, United Republic of</option>
                <option value="Thailand">Thailand</option>
                <option value="Timor-leste">Timor-leste</option>
                <option value="Togo">Togo</option>
                <option value="Tokelau">Tokelau</option>
                <option value="Tonga">Tonga</option>
                <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                <option value="Tunisia">Tunisia</option>
                <option value="Turkey">Turkey</option>
                <option value="Turkmenistan">Turkmenistan</option>
                <option value="Turks and Caicos Islands">Turks and Caicos Islands</option>
                <option value="Tuvalu">Tuvalu</option>
                <option value="Uganda">Uganda</option>
                <option value="Ukraine">Ukraine</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="United States Minor Outlying Islands">United States Minor Outlying Islands</option>
                <option value="Uruguay">Uruguay</option>
                <option value="Uzbekistan">Uzbekistan</option>
                <option value="Vanuatu">Vanuatu</option>
                <option value="Venezuela">Venezuela</option>
                <option value="Viet Nam">Viet Nam</option>
                <option value="Virgin Islands, British">Virgin Islands, British</option>
                <option value="Virgin Islands, U.S.">Virgin Islands, U.S.</option>
                <option value="Wallis and Futuna">Wallis and Futuna</option>
                <option value="Western Sahara">Western Sahara</option>
                <option value="Yemen">Yemen</option>
                <option value="Zambia">Zambia</option>
                <option value="Zimbabwe">Zimbabwe</option>
            </select>
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
                                <p>Image Url<span>*</span>to add your own photos, read <a href="#/upload_photos">upload local photos</a> for more.</p>
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
                                        <p>Availability<span>*</span></p>
                                        <select id="avail">
                                           <option value="In stock">In Stock</option>
                                           <option value="Out of stock">Out of Stock</option> 
                                            </select>
                                    </div>
                                </div>
                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Gender<span>*</span></p>
                                        <select id="gender">
                                           <option value="both">Both</option>
                                           <option value="male">Male</option>
                                           <option value="female">Female</option> 
                                            </select>
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




                <form  onSubmit={UpdateGo} id="upd" style={{display:"none"}}>
                    <p>To update a product, type the product id or select the id from the "My POST" at post a product page.in the Product Id field. This will load the product enquiries to be edited.</p>
                    <div className="row">
                    <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Product ID<span>*</span></p>
                                        <input onKeyDown={fetchID} onInput={fetchID} id="prodid" type="text" required/>
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
                                        <p>Availability<span>*</span></p>
                                        <input id="availupd" type="text" />
                                    </div>
                                </div>

                                <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Gender<span>*</span></p>
                                        <input id="genderupd" type="text" />
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


                <form  onSubmit={DeleteGo} id="del"  style={{display:"none"}}>
                    <p>To delete a product, type the product id. If the product id exist, then it will load the product enquiries. Then click the Delete button to delete.</p>
                    <div className="row">
                    <div className="col-lg-6">
                                    <div className="checkout__input">
                                        <p>Product ID<span>*</span></p>
                                        <input onKeyDown={deleteID} onInput={deleteID} id="delid" type="text" required/>
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




<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<h4>Product Operations</h4>

    <button style={oper} onClick={()=>{document.getElementById("upd").style.display="none";document.getElementById("pst").style.display="";document.getElementById("del").style.display="none"}}>POST a Product</button>
   <br/><br/>
    <button style={oper} onClick={()=>{document.getElementById("pst").style.display="none";document.getElementById("upd").style.display="";document.getElementById("del").style.display="none"}}>Update a Product</button>
    <br/><br/>
    <button style={oper} onClick={()=>{document.getElementById("pst").style.display="none";document.getElementById("del").style.display="";document.getElementById("upd").style.display="none"}}>Delete a Product</button>
   
            </div>
        </div>
    </section>
</div>
<ScrollToTop />
<Footer />
    </section>
   
  )
}

export default Sell