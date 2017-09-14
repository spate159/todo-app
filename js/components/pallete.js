var pallete = (function(arr){

    if(arr.constructor === Array){
        var htmlString = "";
        arr.forEach(function(color){
            htmlString+="<span class=\"color-pallete-color\" style=\"background: "+color+";width: 20px;height:20px; margin:2px; display:inline-block\"></span>";
        });
        return htmlString;
    }else{
        return "";
    }
});
