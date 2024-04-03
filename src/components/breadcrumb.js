export default function Breadcrumb(props){
    return(
        <section className="breadcrumb-option">
        <div className="container">
            <div className="row">
                <div className="col-lg-12">
                    <div className="breadcrumb__text">
                        <h4>{props.title}</h4>
                        
                    </div>
                </div>
            </div>
        </div>
    </section>
    )
}