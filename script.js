/* ===== Theme (Light/Dark) ===== */
const THEME_STORAGE_KEY = 'goalscorer_theme';
const THEME_VALUE_DARK = 'dark';
const THEME_VALUE_LIGHT = 'light';

function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === THEME_VALUE_DARK || stored === THEME_VALUE_LIGHT) return stored;
    return null;
}

function applyTheme(theme) {
    const shouldBeDark = theme === THEME_VALUE_DARK;
    document.body.classList.toggle('dark-mode', shouldBeDark);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.setAttribute('aria-pressed', shouldBeDark ? 'true' : 'false');
        btn.textContent = shouldBeDark ? 'Dark' : 'Light';
    }
}

function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const storedTheme = getPreferredTheme();
    if (storedTheme) applyTheme(storedTheme);

    toggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        const nextTheme = isDark ? THEME_VALUE_LIGHT : THEME_VALUE_DARK;
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
        console.log('[theme-toggle] body.classList.contains("dark-mode") =', document.body.classList.contains('dark-mode'));
    });

    // Apply a default if nothing stored yet (keep light by default)
    if (!storedTheme) applyTheme(THEME_VALUE_LIGHT);
}

// Update Date
const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
const currentDateEl = document.getElementById('current-date');
if (currentDateEl) currentDateEl.textContent = new Date().toLocaleDateString('en-US', dateOptions);

if (typeof $ === "function" && typeof gsap !== "undefined") {
  $(document).ready(function () {
    initThemeToggle();

    // 1. SHUTTER LOADER ANIMATION
    const tl = gsap.timeline();

    // Counter
    let countObj = { val: 0 };
    tl.to(countObj, {
        val: 100,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: function () {
            $("#loader-count").text(Math.floor(countObj.val));
        }
    })
        // Fade out Counter, Reveal Brand
        .to("#loader-count", { opacity: 0, duration: 0.5, scale: 0.8 }, "-=0.3")
        .to("#loader-brand", { opacity: 1, scale: 1, duration: 0.8, ease: "power4.out" }, "-=0.3")
        // Pause
        .to({}, { duration: 0.5 })
        // Open Shutters
        .to("#shutter-top", { height: 0, duration: 1.2, ease: "power3.inOut" })
        .to("#shutter-bottom", { height: 0, duration: 1.2, ease: "power3.inOut" }, "<")
        // Fade Content out
        .to("#loader-content", { opacity: 0, duration: 0.5 }, "<")
        .set("#loader-overlay", { display: "none" });


    // 2. Navbar Scroll Effect
    const header = $('#main-header');
    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            header.addClass('shadow-md');
        } else {
            header.removeClass('shadow-md');
        }
    });

    // 3. Mobile Menu Logic
    $('#hamburger').click(function () {
        $('#mobile-menu').removeClass('-translate-x-full');
        $('body').addClass('overflow-hidden');
    });

    $('#close-mobile').click(function () {
        $('#mobile-menu').addClass('-translate-x-full');
        $('body').removeClass('overflow-hidden');
    });

    // 4. Mobile Dropdown Toggle
    $('#mobile-dropdown-btn').click(function () {
        $('#mobile-dropdown-content').slideToggle(300);
        $(this).toggleClass('mobile-dropdown-open');
        // Icon rotation handled by CSS class
    });

    // 5. Search Overlay Logic
    $('#search-trigger').click(function () {
        $('#search-overlay').removeClass('hidden').addClass('flex');
        setTimeout(() => {
            $('#search-overlay').removeClass('opacity-0');
        }, 10);
        $('body').addClass('overflow-hidden');
        $('#search-overlay input').focus();
    });

    $('#close-search').click(function () {
        $('#search-overlay').addClass('opacity-0');
        setTimeout(() => {
            $('#search-overlay').removeClass('flex').addClass('hidden');
        }, 300);
        $('body').removeClass('overflow-hidden');
    });

    // 6. Curated Collections Slider
    const slider = document.getElementById('category-slider');
    $('#slide-next').click(function () {
        slider.scrollBy({ left: 300, behavior: 'smooth' });
    });
    $('#slide-prev').click(function () {
        slider.scrollBy({ left: -300, behavior: 'smooth' });
    });

    // 7. Scroll to Top Logic
    const scrollTopBtn = $('#scroll-top-btn');
    const progressCircle = document.getElementById('scroll-progress');
    const circumference = 138;

    $(window).scroll(function () {
        const scrollTop = $(this).scrollTop();
        const docHeight = $(document).height() - $(window).height();
        const scrollPercent = scrollTop / docHeight;

        if (scrollTop > 300) {
            scrollTopBtn.addClass('visible');
            scrollTopBtn.removeClass('invisible translate-y-4 opacity-0');
        } else {
            scrollTopBtn.removeClass('visible');
            scrollTopBtn.addClass('invisible translate-y-4 opacity-0');
        }

        const offset = circumference - (scrollPercent * circumference);
        progressCircle.style.strokeDashoffset = offset;
    });

    scrollTopBtn.click(function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 8. Cookie Popup Logic
    const cookieBanner = $('#cookie-banner');
    const acceptBtn = $('#accept-cookies');
    const rejectBtn = $('#reject-cookies');
    const closeBtn = $('#close-cookie');

    // Check if user has already made a choice
    if (!localStorage.getItem('velocity_cookies_consent')) {
        // Show banner after delay
        setTimeout(() => {
            cookieBanner.addClass('visible');
        }, 2000);
    }

    function closeBanner() {
        cookieBanner.removeClass('visible');
    }

    acceptBtn.click(function () {
        localStorage.setItem('velocity_cookies_consent', 'accepted');
        closeBanner();
    });

    rejectBtn.click(function () {
        localStorage.setItem('velocity_cookies_consent', 'rejected');
        closeBanner();
    });

    closeBtn.click(function () {
        closeBanner();
    });

    // Keydown Escape
    $(document).keydown(function (e) {
        if (e.key === "Escape") {
            $('#close-search').click();
            $('#close-mobile').click();
        }
    });
});


// close: if (typeof $ === "function" && typeof gsap !== "undefined")
};


// ===== Fraud-Video Upload Previews (3 images) =====
// This block is safe to run even on pages that don't have the upload elements.
(function initFraudUploadPreviews() {
    const previewTargets = [
        { inputId: "input-1", previewId: "preview-1" }, // Đôi ngũ uy tín
        { inputId: "input-2", previewId: "preview-2" }, // Công việc nhẹ nhàng
        { inputId: "input-3", previewId: "preview-3" }, // Môi trường đảm bảo
    ];

    const MAX_BYTES = 8 * 1024 * 1024; // 8MB per image
    const ACCEPT_PREFIX = "image/";

    function clearPreview(previewEl) {
        while (previewEl.firstChild) previewEl.removeChild(previewEl.firstChild);
        previewEl.classList.add("is-empty");
    }

    function renderPreview(previewEl, file) {
        clearPreview(previewEl);

        const objectUrl = URL.createObjectURL(file);

        const img = document.createElement("img");
        img.alt = file.name || "Ảnh tải lên";
        img.src = objectUrl;

        previewEl.appendChild(img);
        previewEl.classList.remove("is-empty");

        // Revoke after a tick once image is loaded (avoids premature revoke issues)
        img.addEventListener("load", () => {
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        });
    }

    function attach(inputEl, previewEl) {
        if (!inputEl || !previewEl) return;

        clearPreview(previewEl);

        inputEl.addEventListener("change", () => {
            const files = inputEl.files;
            if (!files || files.length === 0) {
                clearPreview(previewEl);
                return;
            }

            const file = files[0];

            if (!file.type || !file.type.startsWith(ACCEPT_PREFIX)) {
                alert("Vui lòng chọn đúng tệp ảnh.");
                inputEl.value = "";
                clearPreview(previewEl);
                return;
            }

            if (file.size > MAX_BYTES) {
                alert("Ảnh quá lớn (tối đa 8MB). Vui lòng chọn ảnh khác.");
                inputEl.value = "";
                clearPreview(previewEl);
                return;
            }

            renderPreview(previewEl, file);
        });
    }

    for (const t of previewTargets) {
        const inputEl = document.getElementById(t.inputId);
        const previewEl = document.getElementById(t.previewId);
        attach(inputEl, previewEl);
    }
})();
