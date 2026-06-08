document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    const fallback = document.getElementById('galleryFallback');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');

    let currentIdx = 0;
    let autoSlideInterval = null;
    let touchStartX = 0;
    let touchEndX = 0;

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(() => moveCarousel(1), 5000);
    }

    function addSlide(src, altText) {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.style.backgroundImage = `url(${src})`;
        const img = document.createElement('img');
        img.src = src;
        img.alt = altText;
        slide.appendChild(img);
        track.appendChild(slide);
    }

    function createDots(count) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => { updateCarousel(i); resetAutoSlide(); });
            dotsContainer.appendChild(dot);
        }
    }

    function updateCarousel(idx) {
        const slides = Array.from(track.children);
        if (!slides.length) return;
        currentIdx = ((idx % slides.length) + slides.length) % slides.length;
        track.style.transform = `translateX(${currentIdx * 100}%)`;
        Array.from(dotsContainer.children).forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIdx);
        });
    }

    function moveCarousel(direction) {
        const slides = Array.from(track.children);
        if (!slides.length) return;
        updateCarousel(currentIdx + direction);
    }

    function finalizeGallery() {
        const slides = Array.from(track.children);
        if (!slides.length) {
            if (fallback) fallback.textContent = 'לא נמצאו תמונות בגלריה.';
            return;
        }

        if (fallback) fallback.style.display = 'none';
        createDots(slides.length);
        updateCarousel(0);
        prevBtn?.addEventListener('click', () => { moveCarousel(-1); resetAutoSlide(); });
        nextBtn?.addEventListener('click', () => { moveCarousel(1); resetAutoSlide(); });

        track.parentElement?.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        track.parentElement?.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].clientX;
            if (touchStartX - touchEndX > 50) { moveCarousel(-1); resetAutoSlide(); }
            if (touchEndX - touchStartX > 50) { moveCarousel(1); resetAutoSlide(); }
        }, { passive: true });

        autoSlideInterval = setInterval(() => moveCarousel(1), 5000);
    }

    function probeImage(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    // Try .jpg first, then .jpeg as fallback
    function probeNumber(n) {
        return probeImage(`assets/${n}.jpg`)
            .then(result => result || probeImage(`assets/${n}.jpeg`));
    }

    async function loadGalleryImages() {
        const poolSrc = await probeImage('assets/pool.jpeg');

        // Probe all numbers 2–99 in parallel
        const probes = [];
        for (let n = 2; n <= 99; n++) probes.push(probeNumber(n));
        const numbered = (await Promise.all(probes)).filter(Boolean);

        // Shuffle numbered images (Fisher-Yates)
        for (let i = numbered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbered[i], numbered[j]] = [numbered[j], numbered[i]];
        }

        const allImages = poolSrc ? [poolSrc, ...numbered] : numbered;
        allImages.forEach((src, i) => addSlide(src, `תמונה ${i + 1}`));
        finalizeGallery();
    }

    loadGalleryImages();
    window.moveCarousel = moveCarousel;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal, .reveal-right, .reveal-left').forEach(el => observer.observe(el));
});
