import BlogPost from "../components/blogpost";
import Update from "../components/update";
import Header from "../components/header";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Breadcrumb from "../components/breadcrumb";

export default function Upload(){
    return(
        <>
        <Header />
    <div id="main">
		
<Update />
<Breadcrumb title="Upload Local Photos" />
<br/>
<br/>
        <div>
            <h2>How to upload photos in ALECOM selling page</h2>
           <p>There are a few steps to take to upload a local image in the "image url" field. In most cases getting an online image url it quite easy because you jsut search the image in a browser and copy the image address and paste. That is very simple.</p>
           <p>But when it comes to uploading an image on your device it seems a bit difficult. But there is a way.</p>
           <em>Uploading a local image</em>
           <ul>
            <li>Download Google photos app.</li>
            <li>Open the app and find the photo and click on it</li>
            <li>On the photo, you will see a "share icon" at the bottom of the picture.(some devices may not show the share icon. If so click on the <i className="fa fa-ellipsis-v"></i> icon and find share.)</li>
            <li>After clicking on the share icon, you will see a "create link" button.</li>
            <li>Click on the create link button. This will create a link for you. Copy the link.</li>
            <li>Now visit <a href="https://rojuka.com/tools/google-photos">https://rojuka.com/tools/google-photos</a></li>
            <li>After the webpage is loaded, paste the link you copied in the google photo app in the space provided in the <a href="https://rojuka.com/tools/google-photos">https://rojuka.com/tools/google-photos</a> webpage.</li>
            <li>After pasting, click on "Get permanent Google Photo(s) url" button.</li>
            <li>The "Get permanent Google Photo(s) url" button will create a link below.</li>
            <li>Copy that link and come back to our selling page.</li>
            <li>Then, paste the copied link in the Image Url field on our selling page.</li>
           </ul>
        </div>

        <p>That is all.</p>
        <p>You can <a href="#/contact">Contact</a> us for help.</p>
<Sidebar />


</div>

<Footer />
        </>
    )
}