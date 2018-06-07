/* globals ymaps, Handlebars */
    closeBalloon();    

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

    let clusterer;

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
        // The "raw" flag means that data is inserted "as is" without escaping HTML.
        '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
            '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
            '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
        );

        function getAddress(coords) {            
            ymaps.geocode(coords).then(function (res) {
                var firstGeoObject = res.geoObjects.get(0);

                reviews.clickAddress.address = firstGeoObject.getAddressLine();
            });            
        }

        function createReview (form, coords) {
            let review = {};
    
            review.coords = coords;
            review.name = form.querySelector('#firstName').value;
            review.spot = form.querySelector('#spot').value;            
            review.address = reviews.clickAddress.address;            
            review.comment = form.querySelector('#comment').value;
            review.date = new Date().toLocaleString();
            
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
            let form = document.querySelector('#form');

            getAddress(coords);
            if (form.style.display !== 'block') {
                let position = e.get('position');          
                
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
            let template = document.querySelector('#template').textContent;
            const render = Handlebars.compile(template);
            const html = render(reviews.clickAddress);

            form.innerHTML = html;
            document.querySelector('#button-add').addEventListener('click', () => {
                if (createReview(form, coords)) {
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

        function createPlaceMark (coords, review) {
            
            let myPlacemark = new ymaps.Placemark(coords, {
                hintContent: 'Место с отзывом',
                balloonContentHeader: review.name,
                balloonContentBody: review.comment,
                balloonContentFooter: review.date
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'assets/img/icons/mark-gray.png',
                iconImageSize: [22, 33], //44 x 66
            });

            myPlacemark.events.add('click', function (e) {
                e.preventDefault();
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
    .catch(e => alert('Ошибка: ' + e.message));