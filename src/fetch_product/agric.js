import { useEffect, useState } from "react";
import "./product.css"
import React from "react";


function Agricl(){


    
const [product, setProduct]=useState([]);


var path="http://localhost:3001/agric";

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
        <section className="product spad">
            <div className="container">
                <div className="row product__filter">
                    
                    {product.map((el)=>(
                        
                        <div className="col-lg-3 col-md-6 col-sm-6 mix new-arrivals animate__animated animate__fadeInUp" key={el.id}>
                    <div className="product__item">
                        <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                            <span className="label">New</span>
                            <ul className="product__hover">
                                <li><a href="#"><i className="fa fa-heart-o"></i></a></li>
                                <li><a href="#"><i className="fa fa-reorder"></i> <span>Compare</span></a></li>
                                <li><a href="#"><i className="fa fa-search"></i></a></li>
                            </ul>
                        </div>
                        <div className="product__item__text">
                            <h6>{el.product}</h6>
                            <a href="./cart.html" className="add-cart">+ Place Order</a>
                            <div className="rating">
                                <i className="fa fa-star-o"></i>
                                <i className="fa fa-star-o"></i>
                                <i className="fa fa-star-o"></i>
                                <i className="fa fa-star-o"></i>
                                <i className="fa fa-star-o"></i>
                            </div>
                            <h5>GHC {el.price}</h5>
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

export default Agricl;