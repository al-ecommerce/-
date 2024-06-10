function Input(){
    fetch("https://tarry-hail-koala.glitch.me/categories")
    .then(res=> res.json())
    .then(data => surfInput(data))
    .catch(err => console.log(err))
    

    fetch("https://tarry-hail-koala.glitch.me/products")
    .then(res=> res.json())
    .then(data => surfInput(data))
    .catch(err => console.log(err))
    }

    function surfInput(data){
        var input_srch=document.getElementById("search_prd").value;
        
        
        for (var i=0; i< data.length; i++){
            if(input_srch === data[i].category || input_srch === data[i].product){
                document.getElementById("r").style.display="block"
                var p=document.getElementById("rs");
                p.innerHTML=`
                Category ${data[i].category} , ${data[i].product}
                `
                p.href=data[i].link;
            }
            else{
             
                document.getElementById("r").style.display="block"
              
            }

        }
    }
    
    

export default function Banner(){
    return(
        <section id="banner">
           
           <center>
            <br/>
            <br/>
            <p>Place Order and Get the order in a snap</p>
            <br/>
            <br/>
            <input type="text" id="search_prd" onKeyUp={Input} placeholder="Find ..." className="banner_input" />
            <a onClick={Input}>Search</a>
            
            <div className="search_result" id="r" style={{display:"none"}}>
                <em>Search result:</em>
                <p id="rs" style={{color:"blue"}}></p>
            </div>
            <br/>
            <br/>
            </center>
       
        </section>
    )
}