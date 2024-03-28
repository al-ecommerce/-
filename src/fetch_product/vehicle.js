import { useEffect, useState } from "react";
import "./product.css"
import React from "react";
import Details from "../pages/details";
import PlaceO from "../pages/place_order";




function proD(){
    document.getElementById("productsV").style.display="block";
    document.getElementById("prds").style.display="none";
    
    document.getElementById("details").style.display="none"
    
    document.getElementById("chkout").style.display="none"
}

function Vehicle(){

    const details=document.getElementById("details");
      const prds=document.getElementById("prds");
      const chkout=document.getElementById("chkout");
      const prodV=document.getElementById("productsV");
const handleDes = (el) => {
    var  prev_det=document.getElementById("preview_details");
    var  prev_mat=document.getElementById("preview_material");
    var  prev_cont=document.getElementById("preview_contact");
   
    prodV.style.display="none";
    chkout.style.display="none";
    prds.style.display="block";
    details.style.display="block";


    prev_det.innerHTML=`${el.description}`;
    prev_mat.innerHTML=`${el.materialU}`;
    prev_cont.innerHTML=`${el.contact}`;
  }

  const placeOrder = (el) => {
    var chk_prod=document.getElementById("chk_prod");
    var chk_pd=document.getElementById("chk_pd");
    document.getElementById("chk_prc").innerHTML=`${el.price}`
    document.getElementById("chk_eml").value=`${el.email}`
    chk_prod.value=`${el.product}`;
    chk_pd.innerHTML=`${el.product}`;

    prodV.style.display="none";
    chkout.style.display="block";
    prds.style.display="block";
    details.style.display="none";

  }
    
const [product, setProduct]=useState([]);


var path="http://localhost:3001/vehicle";

const fetching= ()=>{
    fetch(path)
    .then(res => res.json())
    .then(data =>setProduct(data))
    .catch(err => console.log(err))
    
}


useEffect(()=>{
        fetching()
},[])

    return(
        <>
        <a onClick={proD}  id="prds" style={{display:"none",color:"blue",cursor:"pointer",position:"fixed",right:"30px",marginTop:"40px"}}>Products</a>
        <section className="product spad" id="productsV">
            <div className="container">
                <div className="row product__filter">
                    
                    {product.map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            <span className="label">New</span>
                            <ul className="product__hover">
                                <li><a title="description" onClick={()=>handleDes(el)}><i className="fa fa-heart-o"></i></a></li>
                                <li><a href="#"><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a href="#"><i className="fa fa-search"></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6>{el.product}</h6>
                            <a  className="add-cart" onClick={()=>placeOrder(el)}>+ Place Order</a>
                            <div className="rating">
                                <i className="fa fa-star-o"></i>
                                <i className="fa fa-star-o"></i>
                                <i className="fa fa-star-o"></i>
                                <i className="fa fa-star-o"></i>
                                <i className="fa fa-star-o"></i>
                            </div>
                            <h5>{el.price}</h5>
                          
                            <div className="product__color__select">
                                <label htmlFor="pc-1">
                                    <input type="radio" id="pc-1"/>
                                </label>
                                <label className="active black" htmlFor="pc-2">
                                    <input type="radio" id="pc-2"/>
                                </label>
                                <label className="grey" htmlFor="pc-3">
                                    <input type="radio" id="pc-3"/>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                    ))}
          

                </div>
            </div>
        </section>
        
     <div id="details" style={{display: "none"}}>
        <Details />
        <br/>
     </div>

     <div id="chkout" style={{display:"none"}}>
        <PlaceO />
        <br/>
     </div>
        </>
    )
};

export default Vehicle;