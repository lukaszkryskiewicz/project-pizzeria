import { select, classNames, templates, settings } from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();

    //console.log('new Cart', thisCart);
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);

  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function () {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function () {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function (event) {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisCart.sendOrder();

    });

  }

  add(menuProduct) {
    const thisCart = this;

    console.log('adding product', menuProduct);

    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    console.log(generatedDOM);
    thisCart.dom.productList.appendChild(generatedDOM);
    console.log(thisCart.dom.productList);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    console.log('thisCart.products', thisCart.products);
    thisCart.update();

  }

  update() {
    const thisCart = this;

    const deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (let product of thisCart.products) {
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
      console.log(thisCart.totalNumber);
      console.log(thisCart.subtotalPrice);
    }
    if (thisCart.totalNumber >= 1) {
      thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
    } else thisCart.totalPrice = 0;
    console.log(thisCart.totalPrice);


    thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    for (let totalPricePlace of thisCart.dom.totalPrice) {
      totalPricePlace.innerHTML = thisCart.totalPrice;
    }

  }

  remove(removedProduct) {
    const thisCart = this;

    removedProduct.dom.wrapper.remove();
    thisCart.products.splice(thisCart.products.indexOf(removedProduct), 1);
    thisCart.update();


  }

  sendOrder() {
    const thisCart = this;

    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {};
    payload.address = thisCart.dom.address.value;
    payload.phone = thisCart.dom.phone.value;
    payload.totalPrice = thisCart.totalPrice;
    payload.subtotalPrice = thisCart.subtotalPrice;
    payload.totalNumber = thisCart.totalNumber;
    payload.deliveryFee = settings.cart.defaultDeliveryFee;
    payload.products = [];

    for (let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    console.log(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
      });

  }
}

export default Cart;
