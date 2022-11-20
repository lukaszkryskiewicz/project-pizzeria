import { select, templates } from '../settings.js';
import Carousel from './Carousel.js';

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
    thisHome.initWidgets();

  }

  render(element) {
    const thisHome = this;

    const generatedHTML = templates.homeWidget();
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    thisHome.dom.carousel = document.querySelector(select.containerOf.carousel);

  }


  initWidgets() {
    const thisHome = this;

    // eslint-disable-next-line no-undef
    thisHome.carousel = new Carousel(thisHome.dom.carousel);
  }
}

export default Home;