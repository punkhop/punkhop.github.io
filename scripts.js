let currentIndex = 0;
const items = document.querySelectorAll('.carousel-item');
const itemCount = items.length;

function showNextItem() {
    items[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % itemCount;
    items[currentIndex].classList.add('active');
    
    // Update transform property of carousel-inner
    const carouselInner = document.querySelector('.carousel-inner');
    carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;
}

// Change interval to 2000ms (2 seconds)
setInterval(showNextItem, 2000);

// Initialize the first item as active
items[0].classList.add('active');