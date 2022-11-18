import { templates, select, settings, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.selectedTable = 0;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      bookings: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,

      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,

      ],
    };

    // console.log('getData params', params);

    const urls = {
      bookings: settings.db.url + '/' + settings.db.bookings
        + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event
        + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event
        + '?' + params.eventsRepeat.join('&'),
    };

    // console.log('getData urls', urls);
    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);

      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }


    //console.log('thisBooking booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);



    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      //console.log(hourBlock);
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }

    }

  }

  initTables(clickedElement) {
    const thisBooking = this;
    thisBooking.previousSelectedTable = document.querySelector('.table[data-table="' + thisBooking.selectedTable + '"]');

    if (clickedElement.classList.contains(classNames.booking.table)) {
      if (!clickedElement.classList.contains(classNames.booking.tableBooked)) {
        //console.log(thisBooking.selectedTable, clickedElement);
        //console.log(thisBooking.previousSelectedTable);
        if (thisBooking.selectedTable == 0) {
          clickedElement.classList.add(classNames.booking.chosenTable);
          thisBooking.selectedTable = clickedElement.getAttribute(settings.booking.tableIdAttribute);
        } else if (thisBooking.selectedTable == clickedElement.getAttribute(settings.booking.tableIdAttribute)) {
          clickedElement.classList.remove(classNames.booking.chosenTable);
          thisBooking.selectedTable = 0;
        } else if (thisBooking.previousSelectedTable != clickedElement) {
          thisBooking.previousSelectedTable.classList.remove(classNames.booking.chosenTable);
          clickedElement.classList.add(classNames.booking.chosenTable);
          thisBooking.selectedTable = clickedElement.getAttribute(settings.booking.tableIdAttribute);
        }

      } else {
        alert('Stolik jest zajety. Wybierz inny lub zmień parametry rezerwacji!');
      }
    }
  }

  render(container) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = container;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePickerInput = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hoursPickerInput = document.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = document.querySelectorAll(select.booking.tables);
    thisBooking.dom.containerOfTables = document.querySelector(select.containerOf.tables);
    thisBooking.dom.phoneInput = document.querySelector(select.booking.phone);
    thisBooking.dom.addressInput = document.querySelector(select.booking.address);
    thisBooking.dom.form = document.querySelector(select.booking.form);
    thisBooking.peopleAmountInput = thisBooking.dom.peopleAmount.querySelector('.amount');
    thisBooking.hoursAmountInput = thisBooking.dom.hoursAmount.querySelector('.amount');
    thisBooking.startersArray = document.querySelectorAll('.checkbox [type="checkbox"');
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('updated', function () {
      console.log('peopleAmmount');
    });


    thisBooking.hourAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('updated', function () {
      console.log('hoursAmount');
    });

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerInput);

    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hoursPickerInput);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
      for (let table of thisBooking.dom.tables) {
        table.classList.remove(classNames.booking.chosenTable);
      }
      thisBooking.selectedTable = 0;
    });

    thisBooking.dom.containerOfTables.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.initTables(event.target);
    });

    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();

    });

  }

  checkDuration(duration, table, date) {
    const thisBooking = this;

    for (let hourBlock = thisBooking.hour; hourBlock < thisBooking.hour + duration; hourBlock += 0.5) {
      if (thisBooking.booked[date][hourBlock].indexOf(table) == false) {
        return true;
      }
    }
  }

  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;

    const payload = {};
    payload.date = thisBooking.date;
    payload.hour = utils.numberToHour(thisBooking.hour);
    payload.table = parseInt(thisBooking.selectedTable);
    payload.duration = parseInt(thisBooking.hoursAmountInput.value);
    payload.ppl = parseInt(thisBooking.peopleAmountInput.value);
    payload.starters = [];
    payload.phone = thisBooking.dom.phoneInput.value;
    payload.address = thisBooking.dom.addressInput.value;

    for (let starter of thisBooking.startersArray) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }
    console.log(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    };


    if (payload.table != 0) {
      if (thisBooking.checkDuration(payload.duration, payload.table, payload.date) != true) {
        fetch(url, options)
          .then(function (response) {
            return response.json();
          }).then(function (parsedResponse) {
            console.log('parsedResponse', parsedResponse);
          }).then(function () {
            thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
            thisBooking.updateDOM();
            for (let table of thisBooking.dom.tables) {
              table.classList.remove(classNames.booking.chosenTable);
            }
            thisBooking.selectedTable = 0;
          });
      } else alert('Twoja rezerwacja jest za długa, zmień stolik lub dlugość rezerwacji');
    } else alert('Wybierz stolik lub zmień parametry rezerwacji');
  }
}

export default Booking;
