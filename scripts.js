document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel-inner');
    const items = document.querySelectorAll('.carousel-item');
    const itemCount = items.length;
    let currentIndex = 0;

    function showNextItem() {
        currentIndex = (currentIndex + 1) % itemCount;
        updateCarousel();
    }

    function updateCarousel() {
        const offset = -currentIndex * 100;
        carousel.style.transform = `translateX(${offset}%)`;
    }

    // Initialize the carousel
    updateCarousel();

    // Change image every 5 seconds
    setInterval(showNextItem, 5000);

    console.log('Carousel initialized');
});

// Stripe footer code
if (document.getElementById('jetbookiframe')) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const order = urlParams.get('order')
    if (order) {
        var url = new URL(document.getElementById('jetbookiframe').src);
        url.searchParams.append('order', order);
        document.getElementById('jetbookiframe').src = url.href;
    }
}