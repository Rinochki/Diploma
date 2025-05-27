// ====== ІНІЦІАЛІЗАЦІЯ КАРТИ ======
const map = L.map('map').setView([49.8397, 24.0297], 13); // Центр карти на Львові

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentMarker = null; // Маркер для поточної обраної точки
let routePolyline = null; // Полілінія для маршруту
let routePoints = [];     // Масив точок для маршруту

// Оновлення відображення координат та полів введення при кліку на карту
map.on('click', function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lon = e.latlng.lng.toFixed(6);

    document.getElementById('currentCoordsDisplay').textContent = `Координати: ${lat}, ${lon}`;
    document.getElementById('newLocationLat').value = lat;
    document.getElementById('newLocationLon').value = lon;

    // Переміщуємо або створюємо маркер на місці кліку
    if (currentMarker) {
        currentMarker.setLatLng(e.latlng);
    } else {
        currentMarker = L.marker(e.latlng).addTo(map)
            .bindPopup(`Точка: ${lat}, ${lon}`)
            .openPopup();
    }
});

// ====== ФУНКЦІЇ КАРТИ ТА ВЗАЄМОДІЇ ======

// Пошук місця на карті
document.getElementById('searchLocationBtn').addEventListener('click', function() {
    const query = document.getElementById('searchLocationInput').value;
    if (query) {
        // Використовуємо Nominatim API для геокодування
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    map.setView([lat, lon], 15); // Переміщуємо карту до знайденої локації

                    if (currentMarker) {
                        currentMarker.setLatLng([lat, lon]);
                    } else {
                        currentMarker = L.marker([lat, lon]).addTo(map);
                    }
                    currentMarker.bindPopup(data[0].display_name).openPopup();

                    document.getElementById('currentCoordsDisplay').textContent = `Координати: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                    document.getElementById('newLocationLat').value = lat.toFixed(6);
                    document.getElementById('newLocationLon').value = lon.toFixed(6);

                } else {
                    alert('Місце не знайдено.');
                }
            })
            .catch(error => console.error('Помилка пошуку:', error));
    }
});

// Додати точку до конструктора маршруту
document.getElementById('addPointToRouteBuilderBtn').addEventListener('click', function() {
    const lat = document.getElementById('newLocationLat').value;
    const lon = document.getElementById('newLocationLon').value;

    if (lat && lon) {
        const point = { lat: parseFloat(lat), lon: parseFloat(lon) };
        routePoints.push(point);

        // Додаємо маркер для точки маршруту (опціонально, можна використовувати тільки полілінію)
        L.marker([point.lat, point.lon]).addTo(map).bindPopup(`Точка маршруту: ${routePoints.length}`);

        // Оновлюємо список точок у конструкторі
        const pointItem = document.createElement('div');
        pointItem.classList.add('route-point-item');
        pointItem.innerHTML = `Точка ${routePoints.length}: ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`;
        document.getElementById('routePointsList').appendChild(pointItem);

        // Оновлюємо полілінію маршруту
        updateRoutePolyline();
    } else {
        alert('Будь ласка, оберіть точку на карті або знайдіть її.');
    }
});

// Функція для оновлення полілінії маршруту
function updateRoutePolyline() {
    if (routePolyline) {
        map.removeLayer(routePolyline);
    }
    if (routePoints.length > 1) {
        const latlngs = routePoints.map(p => [p.lat, p.lon]);
        routePolyline = L.polyline(latlngs, { color: 'blue', weight: 5, opacity: 0.7 }).addTo(map);
        map.fitBounds(routePolyline.getBounds()); // Масштабуємо карту під маршрут
    }
}

// Очистити конструктор маршруту
document.getElementById('clearRouteBuilderBtn').addEventListener('click', function() {
    routePoints = [];
    document.getElementById('routePointsList').innerHTML = '<p>Додайте точки з карти, щоб побудувати маршрут.</p>';
    if (routePolyline) {
        map.removeLayer(routePolyline);
        routePolyline = null;
    }
    // Також видаляємо маркери маршруту, якщо вони були додані
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker && layer !== currentMarker) {
            map.removeLayer(layer);
        }
    });
});


// ====== КЕРУВАННЯ ДАНИМИ (ЗБЕРІГАННЯ В localStorage) ======

let users = JSON.parse(localStorage.getItem('users')) || [];
let routes = JSON.parse(localStorage.getItem('routes')) || [];
let comments = JSON.parse(localStorage.getItem('comments')) || [];
let locations = JSON.parse(localStorage.getItem('locations')) || [];

function saveToLocalStorage() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('routes', JSON.stringify(routes));
    localStorage.setItem('comments', JSON.stringify(comments));
    localStorage.setItem('locations', JSON.stringify(locations));
}

function refreshAllDataDisplays() {
    displayUsers();
    displayRoutes();
    displayComments();
    displayLocations();
    populateSelects();
}

// Користувачі
document.getElementById('createUserBtn').addEventListener('click', function() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value; // У реальному проекті пароль НЕ зберігається так!

    if (name && email && password) {
        const newUser = { id: Date.now(), name, email, password };
        users.push(newUser);
        saveToLocalStorage();
        alert('Користувача створено!');
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserEmail').value = '';
        document.getElementById('newUserPassword').value = '';
        refreshAllDataDisplays();
    } else {
        alert('Будь ласка, заповніть всі поля для користувача.');
    }
});

function displayUsers() {
    const container = document.getElementById('usersContainer');
    container.innerHTML = '';
    if (users.length === 0) {
        container.innerHTML = '<p>Немає користувачів для відображення.</p>';
        return;
    }
    users.forEach(user => {
        const div = document.createElement('div');
        div.classList.add('data-item');
        div.innerHTML = `
            <strong>${user.name}</strong> (${user.email})
            <button class="delete-btn" data-id="${user.id}" data-type="user">Видалити</button>
        `;
        container.appendChild(div);
    });
}

// Маршрути
document.getElementById('saveRouteBtn').addEventListener('click', function() {
    const name = document.getElementById('newRouteName').value;
    const description = document.getElementById('newRouteDescription').value;
    const authorId = document.getElementById('routeAuthorSelect').value;

    if (name && routePoints.length > 1 && authorId) {
        const author = users.find(u => u.id == authorId);
        const newRoute = {
            id: Date.now(),
            name,
            description,
            points: routePoints,
            author: author ? author.name : 'Невідомий',
            authorId: authorId,
            sharedWith: []
        };
        routes.push(newRoute);
        saveToLocalStorage();
        alert('Маршрут збережено!');
        document.getElementById('newRouteName').value = '';
        document.getElementById('newRouteDescription').value = '';
        document.getElementById('routeAuthorSelect').value = '';
        document.getElementById('clearRouteBuilderBtn').click(); // Очищаємо конструктор після збереження
        refreshAllDataDisplays();
    } else {
        alert('Будь ласка, вкажіть назву, опис, автора та додайте мінімум дві точки до маршруту.');
    }
});

function displayRoutes() {
    const container = document.getElementById('routesContainer');
    container.innerHTML = '';
    if (routes.length === 0) {
        container.innerHTML = '<p>Немає маршрутів для відображення.</p>';
        return;
    }
    routes.forEach(route => {
        const div = document.createElement('div');
        div.classList.add('data-item');
        div.innerHTML = `
            <strong>${route.name}</strong> (Автор: ${route.author})<br>
            Опис: ${route.description}<br>
            Точок: ${route.points.length}<br>
            Поділено з: ${route.sharedWith.map(id => users.find(u => u.id == id)?.name || 'Невідомий').join(', ') || 'Ні з ким'}
            <button class="delete-btn" data-id="${route.id}" data-type="route">Видалити</button>
            <button class="view-route-on-map-btn" data-id="${route.id}">Показати на карті</button>
        `;
        container.appendChild(div);
    });
}

// Показати маршрут на карті
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('view-route-on-map-btn')) {
        const routeId = parseInt(e.target.dataset.id);
        const routeToDisplay = routes.find(r => r.id === routeId);

        if (routeToDisplay && routeToDisplay.points.length > 1) {
            // Очищаємо попередню полілінію маршруту
            if (routePolyline) {
                map.removeLayer(routePolyline);
            }
            // Видаляємо всі маркери, крім currentMarker
            map.eachLayer(function(layer) {
                if (layer instanceof L.Marker && layer !== currentMarker) {
                    map.removeLayer(layer);
                }
            });

            // Додаємо маркери для точок маршруту
            routeToDisplay.points.forEach((point, index) => {
                L.marker([point.lat, point.lon]).addTo(map).bindPopup(`Точка ${index + 1}: ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`);
            });

            // Малюємо нову полілінію
            const latlngs = routeToDisplay.points.map(p => [p.lat, p.lon]);
            routePolyline = L.polyline(latlngs, { color: 'red', weight: 6, opacity: 0.8 }).addTo(map);
            map.fitBounds(routePolyline.getBounds()); // Масштабуємо карту під маршрут

        } else {
            alert('Маршрут не знайдено або недостатньо точок для відображення.');
        }
    }
});


// Локації
document.getElementById('saveLocationBtn').addEventListener('click', function() {
    const name = document.getElementById('newLocationName').value;
    const description = document.getElementById('newLocationDescription').value;
    const lat = document.getElementById('newLocationLat').value;
    const lon = document.getElementById('newLocationLon').value;

    if (name && description && lat && lon) {
        const newLocation = { id: Date.now(), name, description, lat: parseFloat(lat), lon: parseFloat(lon) };
        locations.push(newLocation);
        saveToLocalStorage();
        alert('Локацію збережено!');
        document.getElementById('newLocationName').value = '';
        document.getElementById('newLocationDescription').value = '';
        document.getElementById('newLocationLat').value = '';
        document.getElementById('newLocationLon').value = '';
        if (currentMarker) { // Видаляємо маркер, який використовувався для збереження локації
            map.removeLayer(currentMarker);
            currentMarker = null;
        }
        document.getElementById('currentCoordsDisplay').textContent = '';
        refreshAllDataDisplays();
    } else {
        alert('Будь ласка, заповніть всі поля та оберіть точку на карті для локації.');
    }
});

function displayLocations() {
    const container = document.getElementById('locationsContainer');
    container.innerHTML = '';
    if (locations.length === 0) {
        container.innerHTML = '<p>Немає локацій для відображення.</p>';
        return;
    }
    locations.forEach(loc => {
        const div = document.createElement('div');
        div.classList.add('data-item');
        div.innerHTML = `
            <strong>${loc.name}</strong> (${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)})<br>
            Опис: ${loc.description}
            <button class="delete-btn" data-id="${loc.id}" data-type="location">Видалити</button>
            <button class="view-location-on-map-btn" data-id="${loc.id}">Показати на карті</button>
        `;
        container.appendChild(div);
    });
}

// Показати локацію на карті
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('view-location-on-map-btn')) {
        const locationId = parseInt(e.target.dataset.id);
        const locToDisplay = locations.find(l => l.id === locationId);

        if (locToDisplay) {
            map.setView([locToDisplay.lat, locToDisplay.lon], 16); // Змінюємо вид карти на локацію
            if (currentMarker) {
                map.removeLayer(currentMarker); // Видаляємо попередній "поточний" маркер
            }
            currentMarker = L.marker([locToDisplay.lat, locToDisplay.lon]).addTo(map)
                .bindPopup(`<strong>${locToDisplay.name}</strong><br>${locToDisplay.description}`)
                .openPopup();
            document.getElementById('currentCoordsDisplay').textContent = `Координати: ${locToDisplay.lat.toFixed(6)}, ${locToDisplay.lon.toFixed(6)}`;
            document.getElementById('newLocationLat').value = locToDisplay.lat.toFixed(6);
            document.getElementById('newLocationLon').value = locToDisplay.lon.toFixed(6);
        } else {
            alert('Локацію не знайдено.');
        }
    }
});


// Коментарі
document.getElementById('createCommentBtn').addEventListener('click', function() {
    const text = document.getElementById('newCommentText').value;
    const authorId = document.getElementById('commentAuthorSelect').value;

    if (text && authorId) {
        const author = users.find(u => u.id == authorId);
        const newComment = { id: Date.now(), text, author: author ? author.name : 'Невідомий', authorId };
        comments.push(newComment);
        saveToLocalStorage();
        alert('Коментар додано!');
        document.getElementById('newCommentText').value = '';
        document.getElementById('commentAuthorSelect').value = '';
        refreshAllDataDisplays();
    } else {
        alert('Будь ласка, заповніть текст коментаря та оберіть автора.');
    }
});

function displayComments() {
    const container = document.getElementById('commentsContainer');
    container.innerHTML = '';
    if (comments.length === 0) {
        container.innerHTML = '<p>Немає коментарів для відображення.</p>';
        return;
    }
    comments.forEach(comment => {
        const div = document.createElement('div');
        div.classList.add('data-item');
        div.innerHTML = `
            "${comment.text}" (від: ${comment.author})
            <button class="delete-btn" data-id="${comment.id}" data-type="comment">Видалити</button>
        `;
        container.appendChild(div);
    });
}

// Поділитися маршрутом
document.getElementById('shareRouteBtn').addEventListener('click', function() {
    const routeId = document.getElementById('shareRouteSelect').value;
    const userId = document.getElementById('shareUserSelect').value;

    if (routeId && userId) {
        const route = routes.find(r => r.id == routeId);
        const user = users.find(u => u.id == userId);

        if (route && user) {
            if (!route.sharedWith.includes(userId)) {
                route.sharedWith.push(userId);
                saveToLocalStorage();
                alert(`Маршрут "${route.name}" поділено з "${user.name}"`);
                refreshAllDataDisplays();
            } else {
                alert(`Маршрут "${route.name}" вже поділено з "${user.name}".`);
            }
        } else {
            alert('Невірний маршрут або користувач.');
        }
    } else {
        alert('Будь ласка, оберіть маршрут та користувача.');
    }
});


// Заповнення селектів (випадаючих списків)
function populateSelects() {
    const routeAuthorSelect = document.getElementById('routeAuthorSelect');
    const commentAuthorSelect = document.getElementById('commentAuthorSelect');
    const shareUserSelect = document.getElementById('shareUserSelect');
    const shareRouteSelect = document.getElementById('shareRouteSelect');

    // Очищаємо попередні опції, крім першої ("Оберіть...")
    routeAuthorSelect.innerHTML = '<option value="">Оберіть автора маршруту</option>';
    commentAuthorSelect.innerHTML = '<option value="">Оберіть автора коментаря</option>';
    shareUserSelect.innerHTML = '<option value="">Оберіть користувача</option>';
    shareRouteSelect.innerHTML = '<option value="">Оберіть маршрут</option>';


    users.forEach(user => {
        const option1 = document.createElement('option');
        option1.value = user.id;
        option1.textContent = user.name;
        routeAuthorSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = user.id;
        option2.textContent = user.name;
        commentAuthorSelect.appendChild(option2);

        const option3 = document.createElement('option');
        option3.value = user.id;
        option3.textContent = user.name;
        shareUserSelect.appendChild(option3);
    });

    routes.forEach(route => {
        const option = document.createElement('option');
        option.value = route.id;
        option.textContent = route.name;
        shareRouteSelect.appendChild(option);
    });
}

// Обробка видалення елементів
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn')) {
        const idToDelete = parseInt(e.target.dataset.id);
        const type = e.target.dataset.type;

        if (confirm(`Ви впевнені, що хочете видалити цей ${type}?`)) {
            switch (type) {
                case 'user':
                    users = users.filter(item => item.id !== idToDelete);
                    break;
                case 'route':
                    routes = routes.filter(item => item.id !== idToDelete);
                    break;
                case 'comment':
                    comments = comments.filter(item => item.id !== idToDelete);
                    break;
                case 'location':
                    locations = locations.filter(item => item.id !== idToDelete);
                    break;
            }
            saveToLocalStorage();
            refreshAllDataDisplays();
        }
    }
});


// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', refreshAllDataDisplays);