import { useEffect, useState } from "react";
import "./product.css"
import React from "react";




function Latest(){


    
const [product, setProduct]=useState([]);
const [vehicle, setVehicle]=useState([]);

const [fashion, setFashion]=useState([]);
const [art_craft, setAc]=useState([]);
const [bk, setBk]=useState([]);
const [hb, setHb]=useState([]);
const [pr, setP]=useState([]);
const [ag, setAg]=useState([]);
const [ele, setEl]=useState([]);
const [ft, setFt]=useState([]);
const [jl, setJl]=useState([]);


var path="https://faint-dandelion-lilac.glitch.me/products";
var pathv="https://faint-dandelion-lilac.glitch.me/vehicle";

var pathf="https://faint-dandelion-lilac.glitch.me/fashion"
var patha="https://faint-dandelion-lilac.glitch.me/art_craft"
var pathbk="https://faint-dandelion-lilac.glitch.me/babies_kids"
var pathhb="https://faint-dandelion-lilac.glitch.me/health_beauty"
var pathp="https://faint-dandelion-lilac.glitch.me/property"
var pathe="https://faint-dandelion-lilac.glitch.me/electronic"
var pathag="https://faint-dandelion-lilac.glitch.me/agric"
var pathfw="https://faint-dandelion-lilac.glitch.me/footwear"
var pathjw="https://faint-dandelion-lilac.glitch.me/jewellery"

const fetching= ()=>{
    fetch(path)
    .then(res => res.json())
    .then(data =>setProduct(data))
    .catch(err => console.log(err))
    
}


const Vehicle= ()=>{
    fetch(pathv)
    .then(res => res.json())
    .then(data =>setVehicle(data))
    .catch(err => console.log(err))
}

const Footwear= ()=>{
    fetch(pathfw)
    .then(res => res.json())
    .then(data =>setFt(data))
    .catch(err => console.log(err))
}


const Fashion= ()=>{
    fetch(pathf)
    .then(res => res.json())
    .then(data =>setFashion(data))
    .catch(err => console.log(err))
}

const Property= ()=>{
    fetch(pathp)
    .then(res => res.json())
    .then(data =>setP(data))
    .catch(err => console.log(err))
}

const HB= ()=>{
    fetch(pathhb)
    .then(res => res.json())
    .then(data =>setHb(data))
    .catch(err => console.log(err))
}


const Jw= ()=>{
    fetch(pathjw)
    .then(res => res.json())
    .then(data =>setJl(data))
    .catch(err => console.log(err))
}

const Electronic= ()=>{
    fetch(pathe)
    .then(res => res.json())
    .then(data =>setEl(data))
    .catch(err => console.log(err))
}

const Agric= ()=>{
    fetch(pathag)
    .then(res => res.json())
    .then(data =>setAg(data))
    .catch(err => console.log(err))
}

const BK= ()=>{
    fetch(pathbk)
    .then(res => res.json())
    .then(data =>setBk(data))
    .catch(err => console.log(err))
}

const AC= ()=>{
    fetch(patha)
    .then(res => res.json())
    .then(data =>setAc(data))
    .catch(err => console.log(err))
}


useEffect(()=>{
        fetching();
        Vehicle();
        Fashion();
        Property();
        HB();
        Electronic();
        Footwear();
        Agric();
        BK();
        AC();
},[])

    return(
        <section className="product spad">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">
                        <ul className="filter__controls">
                            <li className="active">Featured Collection</li>
                        </ul>
                    </div>
                </div>
                <div className="row product__filter">
                    
                    {product.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i><span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a href="#/home_appl" className="add-cart">+ Place Order</a>
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
                

                {vehicle.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/vehicle" className="add-cart">+ Place Order</a>
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
                
                {fashion.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/fashion" className="add-cart">+ Place Order</a>
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


{art_craft.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/art" className="add-cart">+ Place Order</a>
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
                

                {bk.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/B&K" className="add-cart">+ Place Order</a>
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


                {jl.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/jewellery" className="add-cart">+ Place Order</a>
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
                    
                {ft.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/footwear" className="add-cart">+ Place Order</a>
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
                  
                  {hb.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/h&b" className="add-cart">+ Place Order</a>
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
                
                
                {pr.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/property" className="add-cart">+ Place Order</a>
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
                
                {ag.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/agric" className="add-cart">+ Place Order</a>
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
                



                {ele.slice(0, 2).map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            
                            <ul className="product__hover">
                                <li><a ><i className="fa fa-id-card-o"></i></a></li>
                                <li><a ><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a ><i className="fa fa-file-code-o" onClick={()=>{navigator.clipboard.writeText(el.product);alert("Copied the text: " + el.product)}}></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6 className="ppp">{el.product}</h6>
                            <a  href="#/electronics" className="add-cart">+ Place Order</a>
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
        
    )
};

export default Latest;