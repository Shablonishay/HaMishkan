document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ===================== GALLERY ===================== */
    // Fixed, curated order: exterior → pool → spa → interior → bedrooms → yard.
    // To add a photo: put NN.webp in assets/gallery and a 240px copy in assets/gallery/thumbs, then add a line here.
    const PHOTOS = [
        ['01', 'הוילה בשעת ערב'],
        ['02', 'החצר האחורית עם רדת החשכה'],
        ['03', 'חזית האחוזה'],
        ['04', 'בריכת השחייה הענקית'],
        ['05', 'הבריכה – כניסה במדרגות'],
        ['06', 'הבריכה המגודרת והמקורה'],
        ['07', 'הבריכה המקורה'],
        ['08', 'מתחם הספא המחומם – ג׳קוזי'],
        ['09', 'ג׳קוזי מול הנוף'],
        ['10', 'רגע של פינוק'],
        ['11', 'הסלון ופינת האוכל'],
        ['12', 'פינת הישיבה'],
        ['13', 'הסלון והטלוויזיה'],
        ['14', 'המטבח ופינת האוכל'],
        ['15', 'המטבח'],
        ['16', 'פינת אוכל ומטבח'],
        ['17', 'גרם המדרגות והגלריה'],
        ['18', 'פינת ישיבה בערב'],
        ['19', 'חדר שינה'],
        ['20', 'חדר שינה עם מקלחת ושירותים צמודים'],
        ['21', 'חדר שינה'],
        ['22', 'חדר שינה'],
        ['23', 'חדר שינה'],
        ['24', 'חדר רחצה'],
        ['25', 'המטבח החיצוני והבר'],
        ['26', 'מרפסת הנוף'],
        ['27', 'הדק עם הנוף לגליל'],
        ['28', 'פינות ישיבה מול הנוף'],
        ['29', 'החצר'],
        ['30', 'שולחן פינג־פונג'],
        ['31', 'מגרש משחקים'],
        ['32', 'טרמפולינה'],
        ['33', 'גן שעשועים'],
    ].map(([n, alt]) => ({ src: `assets/gallery/${n}.webp`, thumb: `assets/gallery/thumbs/${n}.webp`, alt }));

    const track = document.getElementById('carouselTrack');
    const trackWrap = track.parentElement;
    const thumbs = document.getElementById('carouselThumbs');
    const caption = document.getElementById('carouselCaption');
    const count = document.getElementById('carouselCount');
    const total = PHOTOS.length;
    let current = 0;
    let autoTimer = null;
    let userTouched = false;
    let galleryVisible = false;

    PHOTOS.forEach((p, i) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-label', `${i + 1} מתוך ${total}`);
        const eager = i < 2 ? 'eager' : 'lazy';
        slide.innerHTML =
            `<img class="slide-bg" src="${p.thumb}" alt="" aria-hidden="true" loading="${eager}">` +
            `<img class="slide-img" src="${p.src}" alt="${p.alt}" loading="${eager}" decoding="async">`;
        slide.addEventListener('click', () => openLightbox(i));
        track.appendChild(slide);

        const t = document.createElement('button');
        t.type = 'button';
        t.className = 'thumb';
        t.setAttribute('aria-label', `תמונה ${i + 1}: ${p.alt}`);
        t.innerHTML = `<img src="${p.thumb}" alt="" loading="lazy" width="120" height="80">`;
        t.addEventListener('click', () => { goTo(i); stopAuto(true); });
        thumbs.appendChild(t);
    });

    function goTo(i) {
        current = (i % total + total) % total;
        track.style.transform = `translateX(${current * 100}%)`; // RTL: positive X reveals the next slide
        caption.textContent = PHOTOS[current].alt;
        count.textContent = `${current + 1} / ${total}`;
        [...thumbs.children].forEach((t, k) => t.classList.toggle('active', k === current));
        const active = thumbs.children[current];
        if (active) { // centre the active thumb (works for RTL scroll too, page never scrolls)
            const a = active.getBoundingClientRect(), t = thumbs.getBoundingClientRect();
            thumbs.scrollBy({ left: (a.left + a.width / 2) - (t.left + t.width / 2), behavior: reduceMotion ? 'auto' : 'smooth' });
        }
    }
    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    function startAuto() {
        if (reduceMotion || userTouched || autoTimer || !galleryVisible) return;
        autoTimer = setInterval(next, 5000);
    }
    function stopAuto(byUser) {
        clearInterval(autoTimer); autoTimer = null;
        if (byUser) userTouched = true; // once the visitor takes control, stop auto-play for good
    }

    document.querySelector('.carousel-btn.next').addEventListener('click', e => { e.stopPropagation(); next(); stopAuto(true); });
    document.querySelector('.carousel-btn.prev').addEventListener('click', e => { e.stopPropagation(); prev(); stopAuto(true); });
    document.querySelector('.carousel-expand').addEventListener('click', e => { e.stopPropagation(); openLightbox(current); });
    trackWrap.addEventListener('mouseenter', () => stopAuto(false));
    trackWrap.addEventListener('mouseleave', startAuto);

    // Swipe (RTL: swiping right moves forward)
    function addSwipe(el, onNext, onPrev) {
        let x0 = null, y0 = null;
        el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
        el.addEventListener('touchend', e => {
            if (x0 === null) return;
            const dx = e.changedTouches[0].clientX - x0;
            const dy = e.changedTouches[0].clientY - y0;
            x0 = null;
            if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
            dx > 0 ? onNext() : onPrev();
        }, { passive: true });
    }
    addSwipe(trackWrap, () => { next(); stopAuto(true); }, () => { prev(); stopAuto(true); });

    new IntersectionObserver(([e]) => {
        galleryVisible = e.isIntersecting;
        galleryVisible ? startAuto() : stopAuto(false);
    }, { threshold: 0.4 }).observe(trackWrap);

    goTo(0);

    /* ===================== LIGHTBOX ===================== */
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lbImg');
    const lbCap = document.getElementById('lbCaption');
    let lbIndex = 0;
    let lastFocus = null;

    function showLb(i) {
        lbIndex = (i % total + total) % total;
        const p = PHOTOS[lbIndex];
        lbImg.src = p.src;
        lbImg.alt = p.alt;
        lbCap.textContent = `${p.alt} · ${lbIndex + 1} / ${total}`;
        [lbIndex + 1, lbIndex - 1].forEach(k => { new Image().src = PHOTOS[(k + total) % total].src; });
    }
    function openLightbox(i) {
        stopAuto(true);
        lastFocus = document.activeElement;
        showLb(i);
        lb.hidden = false;
        document.body.classList.add('no-scroll');
        requestAnimationFrame(() => lb.classList.add('open'));
        lb.querySelector('.lb-close').focus();
    }
    function closeLightbox() {
        lb.classList.remove('open');
        document.body.classList.remove('no-scroll');
        setTimeout(() => { lb.hidden = true; }, 250);
        goTo(lbIndex);
        if (lastFocus) lastFocus.focus();
    }
    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-next').addEventListener('click', () => showLb(lbIndex + 1));
    lb.querySelector('.lb-prev').addEventListener('click', () => showLb(lbIndex - 1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-figure')) closeLightbox(); });
    addSwipe(lb, () => showLb(lbIndex + 1), () => showLb(lbIndex - 1));

    document.addEventListener('keydown', e => {
        if (!lb.hidden) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showLb(lbIndex + 1);   // RTL: left = forward
            if (e.key === 'ArrowRight') showLb(lbIndex - 1);
        }
    });

    /* ===================== POOL BUTTON ===================== */
    const poolBtn = document.querySelector('.pool-peek-wrap');
    if (poolBtn) poolBtn.addEventListener('click', () => {
        document.querySelector('.pool-spotlight').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    /* ===================== STICKY CONTACT BAR ===================== */
    const sticky = document.getElementById('stickyContact');
    const heroButtons = document.querySelector('.hero-buttons');
    const footerCta = document.querySelector('.cta-footer');
    let heroOut = false, footerIn = false;
    const updateSticky = () => sticky.classList.toggle('show', heroOut && !footerIn);
    new IntersectionObserver(([e]) => { heroOut = !e.isIntersecting; updateSticky(); }).observe(heroButtons);
    new IntersectionObserver(([e]) => { footerIn = e.isIntersecting; updateSticky(); }, { threshold: 0.15 }).observe(footerCta);

    /* ===================== AVAILABILITY → WHATSAPP ===================== */
    const form = document.getElementById('availForm');
    const today = new Date().toISOString().slice(0, 10);
    form.from.min = today;
    form.to.min = today;
    form.from.addEventListener('change', () => {
        form.to.min = form.from.value || today;
        if (form.to.value && form.to.value <= form.from.value) form.to.value = '';
    });
    const fmt = v => v.split('-').reverse().join('/');
    form.addEventListener('submit', e => {
        e.preventDefault();
        if (form.to.value <= form.from.value) { form.to.setCustomValidity('תאריך העזיבה צריך להיות אחרי ההגעה'); form.to.reportValidity(); form.to.setCustomValidity(''); return; }
        let msg = `שלום, אני מעוניין/ת לבדוק זמינות באחוזת המשכן\nהגעה: ${fmt(form.from.value)}\nעזיבה: ${fmt(form.to.value)}`;
        if (form.guests.value) msg += `\nמספר אורחים: ${form.guests.value}`;
        window.open(`https://wa.me/972505555925?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    });

    /* ===================== REVEAL ON SCROLL ===================== */
    const revealEls = document.querySelectorAll('.reveal, .reveal-right, .reveal-left');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(el => el.classList.add('visible'));
    } else {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => io.observe(el));
    }
});
