/* globals ymaps, Handlebars */

var form = document.querySelector('#form'),
    reviews = {
        items: [],
        clickAddress: {
            address: ''
        },
        position: [],
        placemark: {}
    },
    clusterer;

closeBalloon();

new Promise(resolve => ymaps.ready(resolve)) // ждем загрузку карты
    .then(() => {
        var myMap = new ymaps.Map('map', {
            center: [55.76, 37.64], // Москва
            zoom: 15
        }, {
            searchControlProvider: 'yandex#search'
        });

        // Creating a custom layout with information about the selected geo object.
        var customItemContentLayout = ymaps.templateLayoutFactory.createClass(
            '<div class=cluster>' +
            '<h2 class=cluster__header>{{ properties.balloonContentHeader|raw }}</h2>' +
            '<div class=cluster__body>{{ properties.balloonContentBody|raw }}</div>' +
            '<div class=cluster__footer>{{ properties.balloonContentFooter|raw }}</div>'+
            '</div>'
        );

        function createReview (coords) {
            let dateObj = new Date(),
                month = dateObj.getUTCMonth() + 1,
                day = dateObj.getUTCDate(),
                year = dateObj.getUTCFullYear(),
                review = {};

            review.coords = coords;
            review.name = form.querySelector('#firstName').value;
            review.spot = form.querySelector('#spot').value;
            review.address = reviews.clickAddress.address;
            review.comment = form.querySelector('#comment').value;
            review.date = day + '.' + month + '.' + year;
            review.position = reviews.position;

            if (review.name && review.spot && review.comment) {
                reviews.items.push(review);
                form.querySelector('#firstName').value = null;
                form.querySelector('#spot').value = null;
                form.querySelector('#comment').value = null;
                createPlaceMark(coords, review);

                return true;
            }

            return false;

        }

        myMap.events.add('click', function (e) {
            let coords = e.get('coords');

            if (form.style.display !== 'block') {
                reviews.position = e.get('position');
                openBalloon(coords);
            } else {
                closeBalloon();
                toggleIcon();
            }
        });

        async function openBalloon(coords) {
            reviews.clickAddress.address = await getAddress(coords);
            renderBalloon(coords);
            renderForm(coords);
        }

        function renderBalloon ([left, top]) {
            form.style.display = 'block';
            form.style.left = left + 'px';

            let toTopEdge = window.innerHeight - top;
            let toLeftEdge = window.innerWidth - left;

            form.style.top = toTopEdge > form.offsetHeight ? top + 'px' : top - form.offsetHeight + 'px';
            form.style.left = toLeftEdge > form.offsetWidth ? left + 'px' : left - form.offsetWidth + 'px';
        }

        function renderForm(coords) {
            let template = document.querySelector('#template').textContent;
            const render = Handlebars.compile(template);
            const html = render(reviews.clickAddress);

            form.innerHTML = html;
            document.querySelector('#button-add').addEventListener('click', () => {
                if (createReview(coords)) {
                    renderFeed(coords);

                } else {
                    return false;
                }
            });
        }

        function renderFeed([x, y]) {
            let feed = form.querySelector('#feed');
            const template = document.querySelector('#feed-template').textContent;
            const comments = getReviews(x, y);
            const render = Handlebars.compile(template);
            const html = render(comments);

            feed.innerHTML = html;
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

        document.addEventListener('click', (e) => {
            if (e.target.dataset.coords) {
                let coords = e.target.dataset.coords.split(',');
                let position = e.target.dataset.position.split(',');

                myMap.balloon.close();
                renderBalloon(position);
                renderForm(coords);
                renderFeed(coords);
            }

            if (e.target.parentElement.classList.contains('icon-times')) {
                closeBalloon();
                toggleIcon();
            }
        });

        function createPlaceMark (coords, review) {
            let myPlacemark = new ymaps.Placemark(coords, {
                hintContent: 'Место с отзывом',
                balloonContentHeader: `<span>${review.spot}</span>`,
                balloonContentBody: `<div>
                                        <a href='#' data-position='${reviews.position}' data-coords='${review.coords}'>
                                            ${review.address}
                                        </a>
                                    </div>
                                    <div class='cluster__comment'>${review.comment}</div>`,
                balloonContentFooter: `<div>${review.date}</div>`
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'assets/img/icons/mark-orange.png',
                iconImageSize: [22, 33], // 44 x 66
            });

            reviews.placemark = myPlacemark;
            myPlacemark.events.add('click', function (e) {
                e.preventDefault();
                let coords = myPlacemark.geometry.getCoordinates();

                reviews.position = e.get('position');
                renderBalloon(reviews.position);
                renderForm(coords);
                renderFeed(coords);
                myPlacemark.options.set({ iconImageHref: 'assets/img/icons/mark-orange.png' });
                reviews.placemark = myPlacemark;
            });
            clusterer.add(myPlacemark);
        }

        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcons',
            clusterDisableClickZoom: true,
            openBalloonOnClick: true,
            // Setting the "Carousel" standard layout for a cluster balloon.
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            // Setting a custom layout.
            clusterBalloonItemContentLayout: customItemContentLayout,
            clusterBalloonPanelMaxMapArea: 0,
            // Setting the size of the balloon content layout (in pixels).
            clusterBalloonContentLayoutWidth: 200,
            clusterBalloonContentLayoutHeight: 130,
            // Setting the maximum number of items in the bottom panel on one page
            clusterBalloonPagerSize: 5
        });

        myMap.geoObjects
            .add(clusterer);
    }) // инициализация карты
    .catch(e => console.log('Ошибка: ' + e.message));

function getAddress(coords) {
    return new Promise(function(resolve) {
        ymaps.geocode(coords).then(function (res) {
            var firstGeoObject = res.geoObjects.get(0);

            resolve(firstGeoObject.getAddressLine());
        });
    });
}

function closeBalloon () {
    form.style.display = 'none';
}

function toggleIcon() {
    if (reviews.placemark.options != undefined) {
        reviews.placemark.options.set({ iconImageHref: 'assets/img/icons/mark-gray.png' });
    }
}