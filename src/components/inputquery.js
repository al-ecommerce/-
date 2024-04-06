function Input(){
var input=document.getElementById("search_prd");
    var filter=input.value.toUpperCase();

    var prd=document.getElementsByClassName("key_prd");
    
    
    for(var i=0; i < prd.length; i++){
        var h6=prd[i].getElementsByClassName("ppp")[0];
        var h6_value=h6.innerHTML;

        if(h6_value.toUpperCase().indexOf(filter) > -1){
            prd[i].style.display="";
        
        document.getElementById("searching").style.display="none";
    if(input.value == ""){
         document.getElementById("searching").style.display="";
               
        }    
        }
                    
           
          else{
            prd[i].style.display="none";
             document.getElementById("searching").style.display="";
               
        }

    }
}

export default function Inputq(){
    return(
        <>
        
        <input type="text" id="search_prd" onKeyUp={Input} placeholder="Search..."/>
        </>
    
    )
}
