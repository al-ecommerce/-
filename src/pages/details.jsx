import { useEffect, useState } from "react";

export default function Details(){
    const [product, setProduct]=useState([]);


var path="https://faint-dandelion-lilac.glitch.me/fashion";

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
    <section className="shop-details">
       
        <div className="product__details__pic">
            <div className="container">
                <div className="row">
                    <div className="col-lg-6 col-md-9">
                        <div className="tab-content">
                            <div className="tab-pane active" id="tabs-1" role="tabpanel">
                                <div className="product__details__pic__item">
                                    <img id="preview_image" style={{width:"100%",maxHeight:"400px"}} alt=""/>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="product__details__content">
            <div className="container">
                <div className="row d-flex justify-content-center">
                    <div className="col-lg-8">
                        <div className="product__details__text">
                            <h4 id="preview_product"></h4>
                            <div className="rating">
                                <i className="fa fa-star"></i>
                                <i className="fa fa-star"></i>
                                <i className="fa fa-star"></i>
                                <i className="fa fa-star"></i>
                                <i className="fa fa-star-o"></i>
                                <span> - 5 Reviews</span>
                            </div>
                            <h3 id="preview_price"></h3>
                            <p id="preview_color"></p>
                          
                            <h5 id="preview_seller"></h5>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="product__details__tab">
                            <ul className="nav nav-tabs" role="tablist">
                                <li className="nav-item">
                                    <a className="nav-link active" data-toggle="tab" href="#tabs-5"
                                    role="tab">Description</a>
                                </li>
                               
                                <li className="nav-item">
                                    <a className="nav-link"  role="tab">Additional
                                    information</a>
                                </li>
                            </ul>
                            <div className="tab-content">
                                <div className="tab-pane active" id="tabs-5" role="tabpanel">
                                    <div className="product__details__tab__content">
                                       
                                        <div className="product__details__tab__content__item">
                                            <h5>Products Infomation</h5>
                                            <p id="preview_details"></p>
                                        </div>
                                        <div className="product__details__tab__content__item">
                                            <h5>Material used</h5>
                                            <p id="preview_material"></p>
                                        </div>
                                        <div className="product__details__tab__content__item">
                                            <h5>Seller Contact</h5>
                                            <a id="preview_contact"></a>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>


    <section class="product spad">
        <div class="container">
            <div class="row">
                <div class="col-lg-12">
                    <h3 class="product-title">Related Product</h3>
                </div>
            </div>
            <div class="row">
            {product.slice(0,4).map((el)=>(
                        <div className="col-lg-4 col-md-6 col-sm-6 key_prd" key={el.id}>
                            <div className="product__item">
                                <div className="product__item__pic set-bg" style={{background: `url(${el.image})` , backgroundRepeat:"no-repeat",backgroundSize:"cover"}}>
                                    <ul className="product__hover">
                                        <li><a  onClick={()=>window.location.reload()}><i className="fa fa-id-card-o"></i></a></li>
                                        <li><a><i className="fa fa-reorder"></i><span>Compare</span></a>
                                        </li>
                                        <li><a><i className="fa fa-file-code-o"></i></a></li>
                                    </ul>
                                </div>
                                <div className="product__item__text">
                                    <h6 className="ppp">{el.product}</h6>
                                    <a className="add-cart" onClick={()=>window.location.reload()}>+ Add To Cart</a>
                                    <div className="rating">
                                        <i className="fa fa-star-o"></i>
                                        <i className="fa fa-star-o"></i>
                                        <i className="fa fa-star-o"></i>
                                        <i className="fa fa-star-o"></i>
                                        <i className="fa fa-star-o"></i>
                                    </div>
                                    <h5>{el.price}</h5>
                                    <div className="product__color__select">
                                        <label for="pc-40">
                                            <input type="radio" id="pc-40"/>
                                        </label>
                                        <label className="active black" for="pc-41">
                                            <input type="radio" id="pc-41"/>
                                        </label>
                                        <label className="grey" for="pc-42">
                                            <input type="radio" id="pc-42"/>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                    
            </div>
        
    </section>
    
    </>
    )
}