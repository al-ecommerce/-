import { useEffect, useState } from "react"


const get= {
    color:"orange",
    textTransform:"uppercase",
    fontWeight:"700",
    cursor:"pointer",
    padding:"10px 12px"
}

var cat_path="https://faint-dandelion-lilac.glitch.me/categories"
var acc_path="https://faint-dandelion-lilac.glitch.me/account"
var upd_path="https://faint-dandelion-lilac.glitch.me/update"


function ctg(){
    
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch(cat_path)
    .then(res => res.json())
    .then(data => appendCat(data))
    .catch(err=> console.log(err))
    }
}

function appendCat(data){
    for(var i=0; i< data.length; i++){
        var tr=document.createElement("tr");
        tr.innerHTML=`
        <td>${data[i].id}</td>
        <td>${data[i].category}</td>
        <td>${data[i].value}</td>
        <td>${data[i].link}</td>
        `

        var table=document.getElementById("table1");

        table.appendChild(tr);
    }
}



function blg(){
    
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch("https://faint-dandelion-lilac.glitch.me/blog")
    .then(res => res.json())
    .then(data => appendBlg(data))
    .catch(err=> console.log(err))
    }
}

function appendBlg(data){
    for(var i=0; i< data.length; i++){
        var tr=document.createElement("tr");
        tr.innerHTML=`
        <td>${data[i].id}</td>
        <td>${data[i].title}</td>
        <td>${data[i].image}</td>
        <td>${data[i].link}</td>
        <td>${data[i].date}</td>
        `

        var table=document.getElementById("table4");

        table.appendChild(tr);
    }
}



function acc(){
    
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch(acc_path)
    .then(res => res.json())
    .then(data => appendAcc(data))
    .catch(err=> console.log(err))
    }
}

function appendAcc(data){
    for(var i=0; i< data.length; i++){
        document.getElementById("acc_length").innerHTML=data.length;
        var tr=document.createElement("tr");
        tr.className="tr";
        tr.innerHTML=`
        <td>${data[i].id}</td>
        <td>${data[i].username}</td>
        <td className="td_email" style="color;blue" onclick="document.location.href='mailto:${data[i].email}'">${data[i].email}</td>
        <td>${data[i].phone}</td>
        <td>${data[i].notice}</td>
        `

        var table=document.getElementById("table");

        table.appendChild(tr);
    
    }
}

function upd(){
    
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch(upd_path)
    .then(res => res.json())
    .then(data => appendUpd(data))
    .catch(err=> console.log(err))
    }
}

function appendUpd(data){
    for(var i=0; i< data.length; i++){
        var tr=document.createElement("tr");
       
        tr.innerHTML=`
        <td>${data[i].id}</td>
        <td>${data[i].text}</td>
        <td>${data[i].color}</td>
        <td>${data[i].display}</td>
        `

        var table=document.getElementById("table2");

        table.appendChild(tr);
    
    }
}


function Getall(){
    var endpoint=document.getElementById("url_all").value;

    
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch(`https://faint-dandelion-lilac.glitch.me/${endpoint}`)
        .then(res => res.json())
        .then(data=> appendGetall(data))
        .catch(err=> console.log(err))
    }
    
}

function appendGetall(data){
    for(var i=0; i < data.length;i++){
        var table=document.getElementById("table3");
        var tr=document.createElement("tr");
        tr.innerHTML=`
        <td>${data[i].id}</td>
        <td>${data[i].email}</td>
        <td>${data[i].seller_name}</td>
        <td>${data[i].product}</td>
        <td>${data[i].image}</td>
        <td>${data[i].country}</td>
        <td>${data[i].contact}</td>
        <td>${data[i].category}</td>
        <td>${data[i].price}</td>
        <td>${data[i].date}</td>
        <td>${data[i].description}</td>
        <td>${data[i].email_to}</td>
        <td>${data[i].color}</td>`

        table.appendChild(tr)
    }
}

function Deleteall(){
    var endpoint=document.getElementById("url_all").value;

    
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch(`https://faint-dandelion-lilac.glitch.me/${endpoint}`,{
        method:"DELETE",
        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
    alert("Deleted Success")
    })
    .catch(err => console.log(err))
}
}


function accS(){
    var input=document.getElementById("acc_search");
    var filter=input.value.toUpperCase();

    var tr=document.getElementsByClassName("tr");

    for(var i=0; i < tr.length; i++){
        var td=tr[i].getElementsByClassName("td_email")[0];
        var td_value=td.innerHTML;

        if(td_value.toUpperCase().indexOf(filter) > -1){
            tr[i].style.display="";
        }
        else{
            tr[i].style.display="none";
        }

    }
}


function deleteAcc(){
    var ac_id=document.getElementById("acc_id").value;
    
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch(`https://faint-dandelion-lilac.glitch.me/account/${ac_id}`,{
        method:"DELETE",
        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res=> res.json())
    .then(data =>{
        console.log(data)
        alert("Success! Deleted")
})
.catch(err=> console.log(err))
    }
}

function PatchAcc(){
    var ac_id=document.getElementById("acc_id").value;
    var notice=document.getElementById("jsstyle").value;
   
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch(`https://faint-dandelion-lilac.glitch.me/account/${ac_id}`,{
        method:"PATCH",
        body:JSON.stringify({
            "notice":notice
        }),
        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res=> res.json())
    .then(data =>{
        console.log(data)
        alert("Updated")
})
.catch(err=> console.log(err))
    }
}



function updU(){
    var upd_id=document.getElementById("upd_id").value;
    var upd_color=document.getElementById("upd_color").value;
    var upd_display=document.getElementById("upd_display").value;
    var upd_text=document.getElementById("upd_text").value;
   
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch(`https://faint-dandelion-lilac.glitch.me/update/${upd_id}`,{
        method:"PATCH",
        body:JSON.stringify({
            "text":upd_text,
            "color":upd_color,
            "display":upd_display
        }),
        headers:{
            "Content-type":"application/json"
        }
    })
    .then(res=> res.json())
    .then(data =>{
        console.log(data)
        alert("Updates uploaded")
})
.catch(err=> console.log(err))
    }
}


function postCtg(){
    
    var id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
        const catp=document.getElementById("catp").value;
        const valp=document.getElementById("valp").value;
        const linkp=document.getElementById("linkp").value;
        
        fetch("https://faint-dandelion-lilac.glitch.me/categories",{
        method:"POST",
        body:JSON.stringify({
            "category":catp,
            "value":valp,
            "link":linkp,
            "id":id
        }),
        headers:{
            "Content-type":"applicaton/json"
        }
    })
    .then(res=> res.json())
    .then(data => {
        console.log(data)
    alert("Added Cat")
    })
    .catch(err => console.log(err))
}
}


function postBlg(){
    var b_title=document.getElementById("b_title").value;
    var b_img=document.getElementById("b_img").value;
    var b_link=document.getElementById("b_link").value;
    var d=new Date();
  var time=d.toLocaleDateString();
  var id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch("https://faint-dandelion-lilac.glitch.me/blog",{
        method:"POST",
        body:JSON.stringify({
            "id":id,
            "title":b_title,
            "image":b_img,
            "link":b_link,
            "date":time
        }),
        headers:{
            "Content-type":"applicaton/json"
        }
    })
    .then(res=> res.json())
    .then(data => {
        console.log(data)
    alert("Added Blog")
    })
    .catch(err => console.log(err))
}
}

function delCtg(){
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    var p_id=document.getElementById("p_id").value;
    fetch(`https://faint-dandelion-lilac.glitch.me/categories/${p_id}`,{
        method:"DELETE",
        headers:{
            "Content-type":"applicaton/json"
        }
    })
    .then(res=> res.json())
    .then(data => {
        console.log(data)
    alert("Deleted Cat")
    })
    .catch(err => console.log(err))

}

}



function delBlg(){
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    var b_id=document.getElementById("b_id").value;
    fetch(`https://faint-dandelion-lilac.glitch.me/blog/${b_id}`,{
        method:"DELETE",
        headers:{
            "Content-type":"applicaton/json"
        }
    })
    .then(res=> res.json())
    .then(data => {
        console.log(data)
    alert("Deleted Cat")
    })
    .catch(err => console.log(err))

}

}

function Database(){
    
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    document.getElementById("dt").href="https://faint-dandelion-lilac.glitch.me/";
    }
}
export default function Devfetch(){


    return(
    <>

    <section>
        <div>
<a onClick={Database} id="dt">Database</a>

        <h4>Account</h4>
        <p>Number of Account : <a id="acc_length"></a></p>
        
            <a onClick={acc} style={get}>GET</a>
            <a onClick={deleteAcc} style={get}>DELETE</a>
            <a onClick={PatchAcc} style={get}>UPDATE</a>
        
        <br/>
        <br/>
        
        <input placeholder="ID" id="acc_id" style={{padding:"4px 20px"}}/>
        <br/>
        <textarea id="jsstyle"></textarea>
        <br/>
            <input placeholder="Search" id="acc_search" style={{padding:"4px 20px"}} onKeyUp={accS}/>
            <table className="table" id="table">
                <tr>
                   <th>Id</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Notice</th>
                </tr>
       
            </table>
        </div>


        <div>
            <h4>Category</h4>
            <a onClick={ctg} style={get}>GET</a>
            <a onClick={postCtg} style={get}>POST</a>
            <a onClick={delCtg} style={get}>DELETE</a>
            
        <br/>
        <br/>
        
        <input placeholder="id" id="p_id" style={{padding:"4px 20px"}}/>
   <br/>
        <input placeholder="Category" id="catp" style={{padding:"4px 20px"}}/>
   <input placeholder="value" id="valp" style={{padding:"4px 20px"}}/>
   <input placeholder="link" id="linkp" style={{padding:"4px 20px"}}/>
 
            <table className="table" id="table1">
                <tr>
                   <th>Id</th>
                    <th>Category</th>
                    <th>Value(db_name)</th>
                    <th>Link</th>
                </tr>
       
            </table>
        </div>

        <div>
            <h4>Blog</h4>
            <a onClick={blg} style={get}>GET</a>
            <a onClick={postBlg} style={get}>POST</a>
            <a onClick={delBlg} style={get}>DELETE</a>
            
        <br/>
        <br/>
        
        <input placeholder="id" id="b_id" style={{padding:"4px 20px"}}/>
   <br/>
        <input placeholder="blog_title" id="b_title" style={{padding:"4px 20px"}}/>
   <input placeholder="image" id="b_img" style={{padding:"4px 20px"}}/>
   <input placeholder="link" id="b_link" style={{padding:"4px 20px"}}/>
 
            <table className="table" id="table4">
                <tr>
                   <th>Id</th>
                    <th>Title</th>
                    <th>Image</th>
                    <th>Link</th>
                    <th>Date</th>
                </tr>
       
            </table>
        </div>

        <div>
            <h4>Updates</h4>
            <a onClick={upd} style={get}>GET</a>
            <a onClick={updU} style={get}>UPDATE</a>
        
        <br/>
        <br/>
        

            <input placeholder="ID" id="upd_id" style={{padding:"4px 20px"}}/>
        <textarea id="upd_text"></textarea>
        <input placeholder="color" id="upd_color" style={{padding:"4px 20px"}}/>
        <input placeholder="display" id="upd_display" style={{padding:"4px 20px"}}/>
            <table className="table" id="table2">
                <tr>
                   <th>Id</th>
                    <th>Text</th>
                    <th>Color</th>
                    <th>Display</th>
                </tr>
       
            </table>
        </div>

        <div>
        <h4>All</h4>
            <a onClick={Getall} style={get}>GET</a>
            <a onClick={Deleteall} style={get}>DELETE</a>
        
        <br/>
        <br/>
        <input type="text" style={{padding:"4px 20px"}} id="url_all"/>


        <table className="table" id="table3">

        </table>
        </div>
    </section>
    </>
    )
}