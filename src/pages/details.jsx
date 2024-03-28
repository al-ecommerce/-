export default function Details(){
    
    return(
        <>
        <section class="shop-details">
        <div class="product__details__content">
            <div class="container">
                
                <div class="row">
                    <div class="col-lg-12">
                        <div class="product__details__tab">
                            <ul class="nav nav-tabs" role="tablist">
                                <li class="nav-item">
                                    <a class="nav-link active" data-toggle="tab" href="#tabs-5"
                                    role="tab">Description</a>
                                </li>
                              
                            </ul>
                            <div class="tab-content">
                                <div class="tab-pane active" id="tabs-5" role="tabpanel">
                                    <div class="product__details__tab__content">
                                        
                                        <div class="product__details__tab__content__item">
                                            <h5>Products Infomation</h5>
                                            <p id="preview_details"></p>
                                        </div>
                                        <div class="product__details__tab__content__item">
                                            <h5>Material used</h5>
                                            <p id="preview_material"></p>
                                        </div>

                                        <div class="product__details__tab__content__item">
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