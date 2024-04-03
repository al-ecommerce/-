export default function Details(){
    
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
    </>
    )
}