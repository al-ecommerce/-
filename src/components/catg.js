import { Link } from "react-router-dom";

export default function Catg(){
    return(
        <>
        <div className="wide-banners outer-bottom-xs">
          <div className="row">
            <div className="col-md-4 col-sm-4">
              <div className="wide-banner cnt-strip">
                <div className="image"> <img className="img-responsive" src={require("../img/banner/home-banner1.jpg")} alt="" /> </div>
              </div>
            </div>
            
            <div className="col-md-4 col-sm-4">
              <div className="wide-banner cnt-strip">
                <div className="image"> <img className="img-responsive" src={require("../img/banner/home-banner3.jpg")} alt="" /> </div>
              </div>
            </div>
            
            <div className="col-md-4 col-sm-4">
              <div className="wide-banner cnt-strip">
                <div className="image"> <img className="img-responsive" src={require("../img/banner/home-banner2.jpg")} alt="" /> </div>
              </div>
            </div>
          </div>
        </div>

<br/>
<br/>
<br/>
<br/><br/>
<br/>


        <section className="category-area">
            <center><h2>COMING SOON</h2></center>
            <br/>
<br/>
		<div className="container">
			<div className="row justify-content-center">
				<div className="col-lg-8 col-md-12">
					<div className="row">
						<div className="col-lg-8 col-md-8">
							<div className="single-deal">
								<div className="overlay"></div>
								<img className="img-fluid w-100" src={require("../img/banner/banner-7.jpg")} alt=""/>
								
							</div>
						</div>
						<div className="col-lg-4 col-md-4">
							<div className="single-deal">
								<div className="overlay"></div>
								<img className="img-fluid w-100" src={require("../img/banner/banner-4.jpg")} alt=""/>
								
							</div>
						</div>
						<div className="col-lg-4 col-md-4">
							<div className="single-deal">
								<div className="overlay"></div>
								<img className="img-fluid w-100" src={require("../img/banner/banner-5.jpg")} alt=""/>
									
								
							</div>
						</div>
						<div className="col-lg-8 col-md-8">
							<div className="single-deal">
								<div className="overlay"></div>
								<img className="img-fluid w-100" src={require("../img/banner/home-banner4.jpg")} alt=""/>
								
							</div>
						</div>
					</div>
				</div>
				<div className="col-lg-4 col-md-6">
					<div className="single-deal">
						<div className="overlay"></div>
						<img className="img-fluid w-100" src={require("../img/banner/banner-9.jpg")} alt=""/>
							
					</div>
				</div>
			</div>
		</div>
	</section>
	

    <br/>
<br/>
 

        <section className="categories spad">
            <div className="container">
                <div className="row">
                    <div className="col-lg-3">
                        <div className="categories__text">
                            <h2>Clothings Hot <br /> <span>Kitchenware</span> <br /> Accessories</h2>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="categories__hot__deal">
                            <img src={require("../img/products/knife-holder.jpg")} alt="" style={{maxWidth:"120px",maxHeight: "400px"}}/>
                            <div className="hot__deal__sticker">
                                <span>Sale Of</span>
                                <h5>GHC99.99</h5>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 offset-lg-1">
                        <div className="categories__deal__countdown">
                            <span>Deal Of The Week</span>
                            <h2>Knife Holder</h2>
                            <div className="categories__deal__countdown__timer" id="countdown">
                                <div className="cd-item">
                                    <span>3</span>
                                    <p>Days</p>
                                </div>
                                <div className="cd-item">
                                    <span>1</span>
                                    <p>Hours</p>
                                </div>
                                <div className="cd-item">
                                    <span>50</span>
                                    <p>Minutes</p>
                                </div>
                                <div className="cd-item">
                                    <span>18</span>
                                    <p>Seconds</p>
                                </div>
                            </div>
                            <Link to="/home_appl">
                            <a className="primary-btn">Shop now</a>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        </>
    )
}