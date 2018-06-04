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

    let myMap;
    let clusterer;

    new Promise(resolve => ymaps.ready(resolve)) // ждем загрузку карты
    .then(() => {
        var myMap = new ymaps.Map('map', {
                center: [55.76, 37.64], // Москва
                zoom: 5
            }, {
                searchControlProvider: 'yandex#search'
            }),
            myPlacemark = new ymaps.Placemark(myMap.getCenter(), {
                hintContent: 'Собственный значок метки',
                balloonContent: 'Это красивая метка'
            }, {
        // Опции.
        // Необходимо указать данный тип макета.
                iconLayout: 'default#image',
        // Своё изображение иконки метки.
                iconImageHref: 'assets/img/icons/mark-gray.png',
        // Размеры метки.
                iconImageSize: [44, 66],
        // Смещение левого верхнего угла иконки относительно
        // её "ножки" (точки привязки).
                // iconImageOffset: [-5, -38]
            });

        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcons',
            clusterDisableClickZoom: true,
            openBalloonOnClick: false
        });

        myMap.geoObjects
        .add(clusterer)
        .add(myPlacemark);
    }) // инициализация карты
    .catch(e => alert('Ошибка: ' + e.message));

})();