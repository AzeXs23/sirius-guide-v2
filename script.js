// Загрузка данных
let placesData;

try {
  const savedData = localStorage.getItem('sirius-places');
  placesData = savedData ? JSON.parse(savedData) : [...places];
} catch (e) {
  console.error("Ошибка загрузки данных, используется стандартный набор", e);
  placesData = [...places];
}

// Проверка загрузки данных
console.log('Загружены места:', placesData);

// Проверка доступности изображений
document.addEventListener('DOMContentLoaded', function() {
  placesData.forEach(place => {
    const img = new Image();
    img.onload = function() {
      console.log('Фото доступно:', place.photo);
    };
    img.onerror = function() {
      console.error('Фото недоступно:', place.photo);
    };
    img.src = getImagePath(place.photo);
  });
});

// Сохранение данных
function saveData() {
  localStorage.setItem('sirius-places', JSON.stringify(placesData));
}

// Расчёт рейтинга
function calculateRating(reviews) {
  if (!reviews || !reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return parseFloat((sum / reviews.length).toFixed(1));
}

// Обработка загрузки изображения (обновленная для поддержки форматов)
function handleImageUpload(event, placeId) {
  const file = event.target.files[0];
  if (!file) return;

  // Проверяем допустимые форматы изображений
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validImageTypes.includes(file.type)) {
    alert('Пожалуйста, выберите изображение в формате JPEG, PNG, WEBP или GIF');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const reviewImg = document.getElementById(`review-img-${placeId}`);
    if (reviewImg) {
      reviewImg.src = e.target.result;
      reviewImg.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

// Отображение мест
function renderPlaces(category = 'all') {
  console.log('Проверка фото:', placesData.map(p => ({
    name: p.name,
    photo: p.photo,
    exists: checkFileExists(p.photo)
  })));

  function checkFileExists(url) {
    const img = new Image();
    img.src = url;
    return img.complete ? "Да" : "Нет";
  }

  const filtered = category === 'all' 
    ? placesData 
    : placesData.filter(p => p.category === category);
  
  const placesList = document.getElementById('placesList');
  if (!placesList) return;
  
  placesList.innerHTML = filtered.map(place => `
    <div class="place-card" onclick="showPlaceDetails(${place.id})">
      <img src="${getImagePath(place.photo)}" alt="${place.name}" class="place-img" onerror="handleImageError(this)">
      <div class="place-info">
        <h2>${place.name}</h2>
        <p class="address">${place.address}</p>
        <div class="rating-section">
          ${place.rating > 0 ? '★'.repeat(Math.round(place.rating)) + ` ${Number(place.rating).toFixed(1)}` : 'Нет оценок'}
          <small>${place.reviews.length} отзывов</small>
        </div>
      </div>
    </div>
  `).join('');
}

// Функция для корректного получения пути к изображению
function getImagePath(photo) {
  if (!photo) return 'images/no-image.jpg';
  // Проверяем, начинается ли путь с 'images/' или 'http'
  if (photo.startsWith('images/') || photo.startsWith('http')) {
    return photo;
  }
  return `images/${photo}`; // Добавляем 'images/' если его нет
}

// Обработчик ошибок загрузки изображения
function handleImageError(img) {
  img.onerror = null; // Предотвращаем зацикливание
  img.src = 'images/no-image.jpg';
}

// Модальное окно
let currentPlaceId = null;

function showPlaceDetails(placeId) {
  currentPlaceId = placeId;
  const place = placesData.find(p => p.id === placeId);
  if (!place) return;

  // Закрываем предыдущее модальное окно, если оно есть
  const existingModal = document.querySelector('.modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" onclick="closeModal()">&times;</span>
      <div class="modal-info">
        <h2>${place.name}</h2>
        <img src="${getImagePath(place.photo)}" alt="${place.name}" class="main-image" onerror="handleImageError(this)">
        <p><strong>Адрес:</strong> ${place.address}</p>
        <p><strong>Часы работы:</strong> ${place.workingHours}</p>
        ${place.website ? `<p><strong>Сайт:</strong> <a href="${place.website}" target="_blank">${place.website}</a></p>` : ''}
        <p class="description">${place.description}</p>
        
        <div class="reviews-section">
          <h3>Отзывы (${place.reviews.length})</h3>
          ${place.reviews.map(review => `
            <div class="review" id="review-${review.id}">
              <div class="review-header">
                <span>${review.author}</span>
                <span>${'★'.repeat(review.rating)}</span>
                <button class="delete-review-btn" onclick="event.stopPropagation(); deleteReview(${place.id}, ${review.id})">×</button>
              </div>
              <p>${review.text}</p>
              ${review.image ? `<img src="${review.image}" class="review-image" onerror="this.style.display='none'">` : ''}
              <small>${review.date}</small>
            </div>
          `).join('')}
          
          <div class="add-review">
            <h3>Оставить отзыв</h3>
            <input type="text" id="review-author" placeholder="Ваше имя (необязательно)">
            <select id="review-rating">
              <option value="5">Отлично ★★★★★</option>
              <option value="4">Хорошо ★★★★</option>
              <option value="3" selected>Нормально ★★★</option>
              <option value="2">Плохо ★★</option>
              <option value="1">Ужасно ★</option>
            </select>
            <textarea id="review-text" placeholder="Ваш отзыв..." required></textarea>
            <div class="review-image-upload">
              <input type="file" id="review-image-${place.id}" 
                     accept="image/jpeg, image/png, image/webp, image/gif"
                     onchange="handleImageUpload(event, ${place.id})" 
                     style="display: none;">
              <label for="review-image-${place.id}">Прикрепить фото</label>
              <img id="review-img-${place.id}" class="review-image-preview">
            </div>
            <button onclick="addReview()">Отправить</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

// Функция удаления отзыва
function deleteReview(placeId, reviewId) {
  if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
  
  const place = placesData.find(p => p.id === placeId);
  if (!place) return;
  
  // Удаляем отзыв
  place.reviews = place.reviews.filter(r => r.id !== reviewId);
  
  // Обновляем данные
  place.rating = calculateRating(place.reviews);
  saveData();
  
  // Обновляем модальное окно
  showPlaceDetails(placeId);
}

function addReview() {
  const place = placesData.find(p => p.id === currentPlaceId);
  if (!place) return;
  
  const text = document.getElementById('review-text').value;
  if (!text) {
    alert('Пожалуйста, напишите отзыв');
    return;
  }

  const imageInput = document.getElementById(`review-image-${currentPlaceId}`);
  const reader = new FileReader();
  
  if (imageInput.files[0]) {
    reader.onload = function(e) {
      place.reviews.push({
        id: Date.now(),
        author: document.getElementById('review-author').value || 'Аноним',
        rating: parseInt(document.getElementById('review-rating').value),
        text: text,
        image: e.target.result,
        date: new Date().toLocaleDateString('ru-RU')
      });
      updatePlaceData(place);
    };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    place.reviews.push({
      id: Date.now(),
      author: document.getElementById('review-author').value || 'Аноним',
      rating: parseInt(document.getElementById('review-rating').value),
      text: text,
      image: null,
      date: new Date().toLocaleDateString('ru-RU')
    });
    updatePlaceData(place);
  }
}

function updatePlaceData(place) {
  place.rating = calculateRating(place.reviews);
  saveData();
  closeModal();
  renderPlaces(document.getElementById('categoryFilter').value);
}

function closeModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    document.body.removeChild(modal);
    document.body.style.overflow = 'auto';
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      renderPlaces(e.target.value);
    });
  }
  renderPlaces();
});
