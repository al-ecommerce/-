import { useEffect, useState } from "react";
import "./product.css"
import React from "react";
import Details from "../pages/details";
import PlaceO from "../pages/place_order"; 
import Inputq from "../components/inputquery";




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
    var  prev_image=document.getElementById("preview_image");
    var  prev_product=document.getElementById("preview_product");
    var  prev_price=document.getElementById("preview_price");
        var  prev_color=document.getElementById("preview_color");
    var  prev_seller=document.getElementById("preview_seller");
   
   
    prodV.style.display="none";
    chkout.style.display="none";
    prds.style.display="block";
    details.style.display="block";


    prev_det.innerHTML=`${el.description}`;
    prev_mat.innerHTML=`${el.materialU}`;
    prev_cont.innerHTML=`${el.contact}`;
    prev_cont.href=`tel:${el.contact}`;
    prev_image.src=`${el.image}`;
    prev_product.innerHTML=`${el.product}`;
    
    prev_price.innerHTML=`${el.price}`;
    prev_seller.innerHTML="Posted by: "+`${el.seller_name}`
    prev_color.innerHTML="Available Color: "+`${el.color}`
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
        {/* <section className="product spad" id="productsV">
            <div className="container">
                <div className="row product__filter">
                    
                    {product.map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a title="description" onClick={()=>handleDes(el)}><i className="fa fa-heart-o"></i></a></li>
                                <li><a href="#"><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a href="#"><i className="fa fa-search"></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
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
 */}


        
<br/>
<br/>

        <section class="shop spad" id="productsV">
        <div class="container">
            <div class="row">
                <div class="col-lg-3">
                    <div class="shop__sidebar">
                        <div class="shop__sidebar__search">
                            <form>
                                <Inputq />
                            </form>
                        </div>
                        <div class="shop__sidebar__accordion">
                            <div class="accordion" id="accordionExample">
                                
                                <div class="card">
                                    <div class="card-heading">
                                        <a data-toggle="collapse" data-target="#collapseTwo">Branding</a>
                                    </div>
                                    <div id="collapseTwo" class="collapse show" data-parent="#accordionExample">
                                        <div class="card-body">
                                            <div class="shop__sidebar__brand">
                                                <ul>
                                                    <li><a href="#">Louis Vuitton</a></li>
                                                    <li><a href="#">Chanel</a></li>
                                                    <li><a href="#">Hermes</a></li>
                                                    <li><a href="#">Gucci</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card">
                                    <div class="card-heading">
                                        <a data-toggle="collapse" data-target="#collapseThree">Filter Price</a>
                                    </div>
                                    <div id="collapseThree" class="collapse show" data-parent="#accordionExample">
                                        <div class="card-body">
                                            <div class="shop__sidebar__price">
                                                <ul>
                                                    <li><a href="#">$0.00 - $50.00</a></li>
                                                    <li><a href="#">$50.00 - $100.00</a></li>
                                                    <li><a href="#">$100.00 - $150.00</a></li>
                                                    <li><a href="#">$150.00 - $200.00</a></li>
                                                    <li><a href="#">$200.00 - $250.00</a></li>
                                                    <li><a href="#">250.00+</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card">
                                    <div class="card-heading">
                                        <a data-toggle="collapse" data-target="#collapseFour">Size</a>
                                    </div>
                                    <div id="collapseFour" class="collapse show" data-parent="#accordionExample">
                                        <div class="card-body">
                                            <div class="shop__sidebar__size">
                                                <label for="xs">xs
                                                    <input type="radio" id="xs"/>
                                                </label>
                                                <label for="sm">s
                                                    <input type="radio" id="sm"/>
                                                </label>
                                                <label for="md">m
                                                    <input type="radio" id="md"/>
                                                </label>
                                                <label for="xl">xl
                                                    <input type="radio" id="xl"/>
                                                </label>
                                                <label for="2xl">2xl
                                                    <input type="radio" id="2xl"/>
                                                </label>
                                                <label for="xxl">xxl
                                                    <input type="radio" id="xxl"/>
                                                </label>
                                                <label for="3xl">3xl
                                                    <input type="radio" id="3xl"/>
                                                </label>
                                                <label for="4xl">4xl
                                                    <input type="radio" id="4xl"/>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card">
                                    <div class="card-heading">
                                        <a data-toggle="collapse" data-target="#collapseFive">Colors</a>
                                    </div>
                                    <div id="collapseFive" class="collapse show" data-parent="#accordionExample">
                                        <div class="card-body">
                                            <div class="shop__sidebar__color">
                                                <label class="c-1" for="sp-1">
                                                    <input type="radio" id="sp-1"/>
                                                </label>
                                                <label class="c-2" for="sp-2">
                                                    <input type="radio" id="sp-2"/>
                                                </label>
                                                <label class="c-3" for="sp-3">
                                                    <input type="radio" id="sp-3"/>
                                                </label>
                                                <label class="c-4" for="sp-4">
                                                    <input type="radio" id="sp-4"/>
                                                </label>
                                                <label class="c-5" for="sp-5">
                                                    <input type="radio" id="sp-5"/>
                                                </label>
                                                <label class="c-6" for="sp-6">
                                                    <input type="radio" id="sp-6"/>
                                                </label>
                                                <label class="c-7" for="sp-7">
                                                    <input type="radio" id="sp-7"/>
                                                </label>
                                                <label class="c-8" for="sp-8">
                                                    <input type="radio" id="sp-8"/>
                                                </label>
                                                <label class="c-9" for="sp-9">
                                                    <input type="radio" id="sp-9"/>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-9">
                    <div class="shop__product__option">
                        <div class="row">
                            <div class="col-lg-6 col-md-6 col-sm-6">
                                <div class="shop__product__option__left">
                                    <p id="results">Showing...</p>
                                </div>
                            </div>
                            <div class="col-lg-6 col-md-6 col-sm-6">
                                <div class="shop__product__option__right">
                                    <p>Sort by Price:</p>
                                    <select>
                                        <option value="">Low To High</option>
                                        <option value="">$0 - $55</option>
                                        <option value="">$55 - $100</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                    {product.map((el)=>(
                        <div class="col-lg-4 col-md-6 col-sm-6 key_prd" key={el.id}>
                            <div class="product__item">
                                <div class="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                                    <ul class="product__hover">
                                        <li><a href="#" onClick={()=>handleDes(el)}><img src={require("../img/icon/heart.png")} alt=""/></a></li>
                                        <li><a href="#"><img src={require("../img/icon/compare.png")} alt=""/> <span>Compare</span></a>
                                        </li>
                                        <li><a href="#"><img src={require("../img/icon/search.png")} alt=""/></a></li>
                                    </ul>
                                </div>
                                <div class="product__item__text">
                                    <h6 className="ppp">{el.product}</h6>
                                    <a href="#" class="add-cart" onClick={()=>placeOrder(el)}>+ Add To Cart</a>
                                    <div class="rating">
                                        <i class="fa fa-star-o"></i>
                                        <i class="fa fa-star-o"></i>
                                        <i class="fa fa-star-o"></i>
                                        <i class="fa fa-star-o"></i>
                                        <i class="fa fa-star-o"></i>
                                    </div>
                                    <h5>{el.price}</h5>
                                    <div class="product__color__select">
                                        <label for="pc-40">
                                            <input type="radio" id="pc-40"/>
                                        </label>
                                        <label class="active black" for="pc-41">
                                            <input type="radio" id="pc-41"/>
                                        </label>
                                        <label class="grey" for="pc-42">
                                            <input type="radio" id="pc-42"/>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                    
                    
                </div>
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