document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const stickySection = document.querySelector(".sticky");
  const slidesContainer = document.querySelector(".slides");
  const slider = document.querySelector(".slider");
  const slides = document.querySelectorAll(".slide");

  const stickyHeight = window.innerHeight * 6;
  const totalMove = slidesContainer.offsetWidth - slider.offsetWidth;
  const slideWidth = slider.offsetWidth;

  slides.forEach((slide) => {
    const title = slide.querySelector(".title h1");
    gsap.set(title, { y: -200 });
  });

  let currentVisibleIndex = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const currentIndex = Array.from(slides).indexOf(entry.target);
        const titles = Array.from(slides).map((slide) =>
          slide.querySelector(".title h1")
        );

        if (entry.intersectionRatio >= 0.25) {
          currentVisibleIndex = currentIndex;
          titles.forEach((title, index) => {
            gsap.to(title, {
              y: index === currentIndex ? 0 : -200,
              duration: 0.5,
              ease: "power2.out",
              overwrite: true,
            });
          });
        } else if (
          entry.intersectionRatio < 0.25 &&
          currentVisibleIndex === currentIndex
        ) {
          const prevIndex = currentIndex - 1;
          currentVisibleIndex = prevIndex >= 0 ? prevIndex : null;

          titles.forEach((title, index) => {
            gsap.to(title, {
              y: index === prevIndex ? 0 : -200,
              duration: 0.5,
              ease: "power2.out",
              overwrite: true,
            });
          });
        }
      });
    },
    {
      root: slider,
      threshold: [0, 0.25],
    }
  );

  slides.forEach((slide) => observer.observe(slide));

  ScrollTrigger.create({
    trigger: stickySection,
    start: "top top",
    end: `+=${stickyHeight}px`,
    scrub: 1,
    pin: true,
    pinSpacing: true,
    onUpdate: (self) => {
      const progress = self.progress;
      const mainMove = progress * totalMove;

      gsap.set(slidesContainer, {
        x: -mainMove,
      });

      const currentSlide = Math.floor(mainMove / slideWidth);
      const slideProgress = (mainMove % slideWidth) / slideWidth;

      slides.forEach((slide, index) => {
        const image = slide.querySelector("img");
        if (image) {
          if (index === currentSlide || index === currentSlide + 1) {
            const relativeProgress =
              index === currentSlide ? slideProgress : slideProgress - 1;
            const parallaxAmount = relativeProgress * slideWidth * 0.25;
            gsap.set(image, {
              x: parallaxAmount,
              scale: 1.35,
            });
          } else {
            gsap.set(image, {
              x: 0,
              scale: 1.35,
            });
          }
        }
      });
    },
  });
});
