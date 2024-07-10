// document.addEventListener('DOMContentLoaded', function() {
//     var carousel = document.querySelector('.carousel-inner');
//     var items = document.querySelectorAll('.carousel-item');
//     var itemCount = items.length;
//     let currentIndex = 0;

//     function showNextItem() {
//         currentIndex = (currentIndex + 1) % itemCount;
//         updateCarousel();
//     }

//     function updateCarousel() {
//         var offset = -currentIndex * 100;
//         carousel.style.transform = `translateX(${offset}%)`;
//     }

//     // Initialize the carousel
//     updateCarousel();

//     // Change image every 5 seconds
//     setInterval(showNextItem, 5000);

//     console.log('Carousel initialized with ' + itemCount + ' items');
// });

// Stripe footer code
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