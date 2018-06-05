/* globals svg4everybody, ymaps */

(function() {
    'use strict';

    svg4everybody();

    const cache = new Map();

    function geocode(address) {
        if (cache.has(address)) {
            return Promise.resolve(cache.get(address));
        }

        return ymaps.geocode(address)
        .then(result => {
            const points = result.geoObjects.toArray();

            if (points.length) {
                const coors = points[0].geometry.getCoordinates();

                cache.set(address, coors);

                return coors;
            }
        });
    }
    var data = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'id': 0,
                'geometry': {
                    'type': 'Point',
                    'coordinates': [55.831903, 37.411961] },
                'properties': {
                    'balloonContent': 'Содержимое балуна',
                    'clusterCaption': 'Метка с iconContent',
                    'hintContent': 'Текст подсказки', 'iconContent': '1' },
                'options': {
                    'iconColor': '#ff0000',
                    'preset': 'islands#blueCircleIcon'
                }
            },
            {
                'type': 'Feature',
                'id': 1, 'geometry': {
                    'type': 'Point',
                    'coordinates': [55.763338, 37.565466]
                },
                'properties': {
                    'balloonContent': 'Содержимое балуна',
                    'clusterCaption': 'Еще одна метка',
                    'hintContent': 'Текст подсказки'
                }, 'options': {
                    'preset': 'islands#blueSportCircleIcon'
                }
            }
        ]
    };
    /**
     * Object manager
     */
    /*
    objectManager = new ymaps.ObjectManager({
        // Чтобы метки начали кластеризоваться, выставляем опцию.
        clusterize: true,
        // ObjectManager принимает те же опции, что и кластеризатор.
        gridSize: 32,
        clusterDisableClickZoom: true
    });

    // objectManager.objects.options.set('preset', 'islands#greenDotIcon');
    objectManager.clusters.options.set('preset', 'islands#invertedVioletClusterIcons');

    myMap.geoObjects.add(objectManager);
    objectManager.add(data);
    */

    // let myMap;
    let clusterer;

    new Promise(resolve => ymaps.ready(resolve)) // ждем загрузку карты
    .then(() => {
        var myMap = new ymaps.Map('map', {
                center: [55.76, 37.64], // Москва
                zoom: 5
            }, {
                searchControlProvider: 'yandex#search'
            }),
        /**
         * myPlacemarks
         */

            myPlacemark1 = new ymaps.Placemark([55.826479, 37.487208], {
                hintContent: 'Собственный значок метки',
                balloonContent: 'Это красивая метка'
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'assets/img/icons/mark-orange.png',
                iconImageSize: [44, 66], //44 x 66
            }),

            myPlacemark2 = new ymaps.Placemark([55.642063, 37.656123], {
                hintContent: 'Собственный значок метки',
                balloonContent: 'Это красивая метка'
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'assets/img/icons/mark-orange.png',
                iconImageSize: [44, 66], //44 x 66
            });
        /**
         * click left mouse
         */

        myMap.events.add('click', function (e) {
            if (!myMap.balloon.isOpen()) {
                var coords = e.get('coords');

                createPlaceMark(coords);

                myMap.balloon.open(coords, {

                });

                let balloonDiv = document.querySelector('#result');

                renderForm(balloonDiv);
            } else {
                myMap.balloon.close();
            }

        });

        function renderForm (balloon) {
            let template;

            template = document.querySelector('#template').textContent;

            const render = Handlebars.compile(template);
            const html = render();

            balloon.innerHTML = html;
        }

        function createPlaceMark (coords) {
            let myPlacemark = new ymaps.Placemark(coords, {
                hintContent: 'Собственный значок метки',
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'assets/img/icons/mark-gray.png',
                iconImageSize: [22, 33], //44 x 66
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