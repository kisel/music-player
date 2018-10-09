export function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/*
function scrollToTrack(elem) {
    $([document.documentElement, document.body]).animate({
        scrollTop: elem.offset().top - 200
    }, 100);
}
*/
