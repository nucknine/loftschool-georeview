/* globals svg4everybody, ymaps */

(function() {
    'use strict';

    svg4everybody();    

    function getAddress(coords) {
        return new Promise((resolve) => {
            ymaps.geocode(coords).then(function (res) {
                var firstGeoObject = res.geoObjects.get(0);
                var address =  firstGeoObject.getAddressLine();
                return resolve(address);
            });
        });
    }

    var reviews = {
        items: []
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

        reviews.items.push(review);
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
            // console.log(e.get('target'));

            if (!myMap.balloon.isOpen()) {
                var coords = e.get('coords');

                var p = new Promise(async function(resolve) {
                    var bl = await myMap.balloon.open(coords, {
                        content: '<div id="form" class="baloon-body"><div>'
                    });
                    var form;
                    
                    // setTimeout(() => {
                        form = document.querySelector('#form');
                        console.log(bl);
                        resolve(form);                        
                    // }, 500);

                });

                p.then(function(form) {
                    renderForm(form);

                    document.querySelector('#button-add').addEventListener('click', () => {

                        createReview(form, coords);
                        createPlaceMark(coords);

                        console.log(reviews);
                    });
                });

            } else {
                myMap.balloon.close();
            }

        });

        function renderForm (balloon) {
            let template;

            template = document.querySelector('#template').textContent;

            const render = Handlebars.compile(template);
            const html = render(reviews);

            balloon.innerHTML = html;
        }

        function createPlaceMark (coords) {
            let myPlacemark = new ymaps.Placemark(coords, {
                hintContent: 'Собственный значок метки',
                balloonContent: [
                    '<div id="result" class="baloon-body">',
                    '</div>'
                ].join('')
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'assets/img/icons/mark-gray.png',
                iconImageSize: [22, 33], //44 x 66
            });

            myPlacemark.events.add('click', function (e) {
                console.log(e);
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

})();