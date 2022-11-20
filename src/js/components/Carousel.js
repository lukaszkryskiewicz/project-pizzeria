class Carousel {
  constructor(element) {
    const thisCarousel = this;

    thisCarousel.render(element);
    thisCarousel.initPlugin();
  }

  render(element) {
    const thisCarousel = this;
    thisCarousel.dom = {};
    thisCarousel.dom.carousel = element;
  }

  initPlugin() {
    const thisCarousel = this;

    // eslint-disable-next-line no-undef
    thisCarousel.carousel = new Flickity(thisCarousel.dom.carousel, {
      cellAlign: 'left',
      contain: true,
      autoPlay: 3000,
      pauseAutoPlayOnHover: false,
      prevNextButtons: false,
    });
  }
}

export default Carousel;