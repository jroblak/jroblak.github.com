;function blinks(hide) {
    if (hide === 1) {
        $('.blinker').show();
        hide = 0;
    }
    else {
        $('.blinker').hide();
        hide = 1;
    }
    setTimeout("blinks("+hide+")", 400);
}

$(document).ready(function(){
    blinks(1);
});
