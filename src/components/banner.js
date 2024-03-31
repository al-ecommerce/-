function Input(){
    var input=document.getElementById("search_prd");
        var filter=input.value.toUpperCase();
    
        var prd=document.getElementsByClassName("mix");
    
        for(var i=0; i < prd.length; i++){
            var h6=prd[i].getElementsByClassName("ppp")[0];
            var h6_value=h6.innerHTML;
    
            if(h6_value.toUpperCase().indexOf(filter) > -1){
                prd[i].style.display="";
            }
            else{
                prd[i].style.display="none";
            }
    
        }
    }
    
    

export default function Banner(){
    return(
        <section id="banner">
           
           <center>
            <br/>
            <br/>
            <p>Find anything now</p>
            <br/>
            <br/>
            <input type="text" id="search_prd" onKeyUp={Input} placeholder="Find ..." className="banner_input" />
            <a>Search</a>
            </center>
       
        </section>
    )
}