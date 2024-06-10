export default function Catarea(){
    return(
        <>
        <section className="category-area">
		<div className="container">
			<div className="row justify-content-center">
				<div className="col-lg-8 col-md-12">
					<div className="row">
						<div className="col-lg-8 col-md-8">
							<div className="single-deal">
								<div className="overlay"></div>
								<img className="img-fluid w-100" id="single_deal1" alt=""/>
								
							</div>
						</div>
						<div className="col-lg-4 col-md-4">
							<div className="single-deal">
								<div className="overlay"></div>
								<img className="img-fluid w-100" src={require("../img/category/c2.jpg")} alt=""/>
								
							</div>
						</div>
						<div className="col-lg-4 col-md-4">
							<div className="single-deal">
								<div className="overlay"></div>
								<img className="img-fluid w-100" id="single_deal2" alt=""/>
									<div className="deal-details">
										<h6 className="deal-title">Product for sale</h6>
									</div>
								
							</div>
						</div>
						<div className="col-lg-8 col-md-8">
							<div className="single-deal">
								<div className="overlay"></div>
								<img className="img-fluid w-100" src={require("../img/category/c4.jpg")} alt=""/>
								
							</div>
						</div>
					</div>
				</div>
				<div className="col-lg-4 col-md-6">
					<div className="single-deal">
						<div className="overlay"></div>
						<img className="img-fluid w-100" src={require("../img/category/c5.jpg")} alt=""/>
							
					</div>
				</div>
			</div>
		</div>
	</section>
	       </>
    )
}