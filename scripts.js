// Stripe footer code

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        document.getElementById('holderImg').style.display = "none";
        document.querySelector('.carousel-inner').style.display = "flex";
    }, 100);
});

if (document.getElementById('jetbookiframe')) {
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);
    var order = urlParams.get('order')
    if (order) {
        var url = new URL(document.getElementById('jetbookiframe').src);
        url.searchParams.append('order', order);
        document.getElementById('jetbookiframe').src = url.href;
    }
}
