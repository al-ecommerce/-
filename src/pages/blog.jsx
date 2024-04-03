import BlogPost from "../components/blogpost";
import Update from "../components/update";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Breadcrumb from "../components/breadcrumb";

export default function Blog(){
    return(
        <>
        <Header />
    <div id="main">
		
<Update />
<Breadcrumb title="Our Blog" />
        <BlogPost />
<Sidebar />


</div>

<Footer />
        </>
    )
}