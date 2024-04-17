import BlogPost from "../components/blogpost";
import Update from "../components/update";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Breadcrumb from "../components/breadcrumb";

export default function InsGuide(){
    return(
        <>
        <Header />
    <div id="main">
		
<Update />
<Breadcrumb title="Installation Guide" />
<br/>
<br/>
        <div>
            <h2>How to install ALECOM App</h2>
            <ul>
                <li>Open <a href="https://al-ecommerce.github.io/-/">https://al-ecommerce.github.io/-/</a> on any browser. If you are already on the alecom website then don't bother to open the link.</li>
                <li>On the top right corner of the browser you will see an icon <i className="fa fa-ellipsis-v"></i>. Click on that icon.</li>
                <li>A modal box will display the controls of the browser. For example, when you open alecom webpage on chrome, click the <i className="fa fa-ellipsis-v"></i> icon at the top right of the page, a modal box displaying "new tab","new window", "new incognito window" etc will show.</li>
                <li>On the modal box, scroll and find "Install App" in the list.</li>
                <li>Click on "Install app". This will take some moment to install the app on your device.</li>
            </ul>
        </div>

        <p>Some browsers may not allow you to install the app. This mostly occurs when the browser is outdated.</p>
        <p>Try updating the browser if you face challenges of installing the app</p><p>You can <a href="#/contact">Contact</a> us for help.</p>
<Sidebar />


</div>

<Footer />
        </>
    )
}