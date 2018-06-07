/* globals svg4everybody, ymaps */

    svg4everybody();

    closeBalloon();

    function getAddress(coords) {
        return new Promise((resolve) => {
            ymaps.geocode(coords).then(function (res) {
                var firstGeoObject = res.geoObjects.get(0);
                var address = firstGeoObject.getAddressLine();

                return resolve(address);
            });
        });
    }

    function closeBalloon () {
        const form = document.querySelector('#form');

        form.style.display = 'none';
    }

    var reviews = {
        items: [],
        clickAddress: {
            address: ''
        }
    };

    function createReview (form, coords) {
        let review = {};

        review.coords = coords;
        review.name = form.querySelector('#firstName').value;
        review.spot = form.querySelector('#spot').value;
        getAddress(coords).then((result)=>{
            review.address = result;
        });
        review.comment = form.querySelector('#comment').value;
        review.date = new Date().toLocaleString();
        console.log(reviews);
        if (review.name && review.spot && review.comment) {
            reviews.items.push(review);            
            form.querySelector('#firstName').value = null;
            form.querySelector('#spot').value = null;
            form.querySelector('#comment').value = null;

            return true;
        }

        return false;

    }

    let clusterer;

    new Promise(resolve => ymaps.ready(resolve)) // ждем загрузку карты
    .then(() => {
        var myMap = new ymaps.Map('map', {
            center: [55.76, 37.64], // Москва
            zoom: 15
        }, {
            searchControlProvider: 'yandex#search'
        });

        /**
         * click по карте
         */
        myMap.events.add('click', function (e) {
            var coords = e.get('coords');

            getAddress(coords).then((result)=>{
                reviews.clickAddress.address = result;
            });
            
            console.log(reviews.clickAddress.address);

            let form = document.querySelector('#form');

            if (form.style.display !== 'block') {

                var position = e.get('position');

                openBalloon(position, form);
                renderForm(form, coords);
                renderFeed(form, coords);

            } else {
                closeBalloon();
            }
        });

        function openBalloon ([left, top], form) {

            form.style.display = 'block';
            form.style.left = left + 'px';

            let toTopEdge = window.innerHeight - top;
            let toLeftEdge = window.innerWidth - left;

            form.style.top = toTopEdge > form.offsetHeight ? top + 'px' : top - form.offsetHeight + 'px';
            form.style.left = toLeftEdge > form.offsetWidth ? left + 'px' : left - form.offsetWidth + 'px';

        }

        function renderFeed(form, [x, y]) {
            let feed = form.querySelector('#feed');
            const template = document.querySelector('#feed-template').textContent;
            const comments = getReviews(x, y);
            const render = Handlebars.compile(template);
            const html = render(comments);

            feed.innerHTML = html;
        }

        function renderForm (form, coords) {

            let template;

            template = document.querySelector('#template').textContent;

            const render = Handlebars.compile(template);

            const html = render(reviews.clickAddress);

            form.innerHTML = html;

            document.querySelector('#button-add').addEventListener('click', () => {
                if (createReview(form, coords)) {
                    createPlaceMark(coords);
                    renderFeed(form, coords);
                } else {
                    return false;
                }
            });
        }

        function getReviews (x, y) {
            let feed = {
                items: []
            };

            for (let item of reviews.items) {
                let [coordX, coordY] = item.coords;

                if (x == coordX && y == coordY) {
                    feed.items.push(item);
                }
            }

            return feed;
        }

        function createPlaceMark (coords) {
            let myPlacemark = new ymaps.Placemark(coords, {
                hintContent: 'Место с отзывом',
                balloonContent: '',
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'assets/img/icons/mark-gray.png',
                iconImageSize: [22, 33], //44 x 66
            });

            myPlacemark.events.add('click', function (e) {
                var coords = myPlacemark.geometry.getCoordinates();

                var position = e.get('position');
                let form = document.querySelector('#form');

                openBalloon(position, form);
                renderForm(form, coords);
                renderFeed(form, coords);
            });
            clusterer.add(myPlacemark);
        }

        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcons',
            clusterDisableClickZoom: true,
            openBalloonOnClick: false
        });

        myMap.geoObjects
        .add(clusterer);
    }) // инициализация карты
    .catch(e => alert('Ошибка: ' + e.message));