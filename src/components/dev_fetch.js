import { useEffect, useState } from "react"


const get= {
    color:"orange",
    textTransform:"uppercase",
    fontWeight:"700",
    cursor:"pointer",
    padding:"10px 12px"
}

var cat_path="http://localhost:3001/categories"
var acc_path="http://localhost:3001/account"
var upd_path="http://localhost:3001/update"


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
        <td class="td_email" style="color;blue" onclick="document.location.href='mailto:${data[i].email}'">${data[i].email}</td>
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
    fetch(`http://localhost:3001/account/${ac_id}`,{
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
    fetch(`http://localhost:3001/account/${ac_id}`,{
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
    fetch(`http://localhost:3001/update/${upd_id}`,{
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
    var p_cat=document.getElementById("p_cat").value;
    var p_val=document.getElementById("p_val").value;
    var p_link=document.getElementById("p_link").value;
  
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    fetch("http://localhost:3001/categories",{
        method:"POST",
        body:JSON.stringify({
            "category":p_cat,
            "value":p_val,
            "link":p_link
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

function delCtg(){
    var prompty=prompt("Enter Code");

    if(prompty == "200618"){
    var p_id=document.getElementById("p_id").value;
    fetch(`http://localhost:3001/categories/${p_id}`,{
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
export default function Devfetch(){


    return(
    <>

    <section>
        <div>
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
        <input placeholder="Category" id="p_cat" style={{padding:"4px 20px"}}/>
   <input placeholder="value" id="p_val" style={{padding:"4px 20px"}}/>
   <input placeholder="link" id="p_link" style={{padding:"4px 20px"}}/>
 
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
    </section>
    </>
    )
}