<script>
    (function () {
        function initCarousels() {
            document.querySelectorAll('[data-lc-carousel]').forEach(function (root) {
                if (root.getAttribute('data-lc-carousel-ready') === '1') {
                    return;
                }

                root.setAttribute('data-lc-carousel-ready', '1');

                var track = root.querySelector('[data-lc-carousel-track]');
                var slides = root.querySelectorAll('[data-lc-slide]');
                var previousButton = root.querySelector('[data-lc-prev]');
                var nextButton = root.querySelector('[data-lc-next]');
                var dots = Array.prototype.slice.call(root.querySelectorAll('[data-lc-dot]'));
                var dotsContainer = root.querySelector('[data-lc-dots]');

                if (!track || slides.length === 0) {
                    return;
                }

                var loop = root.getAttribute('data-loop') === '1';
                var autoplay = root.getAttribute('data-autoplay') === '1';
                var interval = parseInt(root.getAttribute('data-interval') || '4000', 10);
                var timer = null;
                var scrollFallbackTimer = null;
                var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

                if (reducedMotion) {
                    autoplay = false;
                }

                function slideStep() {
                    return slides[0].getBoundingClientRect().width;
                }

                function visibleCount() {
                    var step = slideStep();
                    return Math.max(1, Math.min(slides.length, Math.round(track.clientWidth / step)));
                }

                function maxIndex() {
                    return Math.max(0, slides.length - visibleCount());
                }

                function currentIndex() {
                    var step = slideStep();
                    return step > 0 ? Math.round(track.scrollLeft / step) : 0;
                }

                function scrollToIndex(index) {
                    var target = Math.min(Math.max(index, 0), maxIndex());
                    var expected = target * slideStep();
                    var behavior = reducedMotion ? 'instant' : 'smooth';

                    if (scrollFallbackTimer) {
                        window.clearTimeout(scrollFallbackTimer);
                        scrollFallbackTimer = null;
                    }

                    track.scrollTo({ left: expected, behavior: behavior });

                    if (!reducedMotion) {
                        scrollFallbackTimer = window.setTimeout(function () {
                            scrollFallbackTimer = null;

                            if (Math.abs(track.scrollLeft - expected) > 2) {
                                track.scrollTo({ left: expected, behavior: 'instant' });
                                updateControls();
                            }
                        }, 700);
                    }
                }

                function updateControls() {
                    var index = currentIndex();
                    var max = maxIndex();

                    dots.forEach(function (dot, dotIndex) {
                        dot.hidden = dotIndex > max;
                        dot.setAttribute('data-active', dotIndex === index ? 'true' : 'false');
                    });

                    if (dotsContainer) {
                        dotsContainer.style.display = max === 0 ? 'none' : 'flex';
                    }

                    if (previousButton) {
                        previousButton.style.display = max === 0 ? 'none' : '';
                        previousButton.disabled = !loop && index <= 0;
                    }

                    if (nextButton) {
                        nextButton.style.display = max === 0 ? 'none' : '';
                        nextButton.disabled = !loop && index >= max;
                    }
                }

                function goNext() {
                    var index = currentIndex();
                    if (index >= maxIndex()) {
                        scrollToIndex(loop ? 0 : maxIndex());
                        return;
                    }
                    scrollToIndex(index + 1);
                }

                function goPrevious() {
                    var index = currentIndex();
                    if (index <= 0) {
                        scrollToIndex(loop ? maxIndex() : 0);
                        return;
                    }
                    scrollToIndex(index - 1);
                }

                function startAutoplay() {
                    if (!autoplay || timer || maxIndex() === 0) {
                        return;
                    }
                    timer = window.setInterval(goNext, interval);
                }

                function stopAutoplay() {
                    if (timer) {
                        window.clearInterval(timer);
                        timer = null;
                    }
                }

                if (previousButton) {
                    previousButton.addEventListener('click', goPrevious);
                }

                if (nextButton) {
                    nextButton.addEventListener('click', goNext);
                }

                dots.forEach(function (dot, index) {
                    dot.addEventListener('click', function () {
                        scrollToIndex(index);
                    });
                });

                track.addEventListener('scroll', updateControls, { passive: true });
                root.addEventListener('mouseenter', stopAutoplay);
                root.addEventListener('mouseleave', startAutoplay);
                root.addEventListener('focusin', stopAutoplay);
                root.addEventListener('focusout', startAutoplay);
                window.addEventListener('resize', updateControls);

                updateControls();
                startAutoplay();
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initCarousels);
        } else {
            initCarousels();
        }
    })();
</script>
