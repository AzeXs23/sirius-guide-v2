// ===== НАСТРОЙКИ JSONBIN =====
const BIN_ID = '69b06f2684682b35628670ff';
const API_KEY = '$2a$10$9W9QC/Er99War3q5MakpfuXOjjLdf/QBg5ovYQHU9jOEdyJQ3jfAC';

let placesData = [];

// Загрузка данных с сервера
async function loadPlaces() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    const data = await response.json();
    placesData = data.record;
    renderPlaces(document.getElementById('categoryFilter').value);
  } catch (e) {
    console.error('Ошибка загрузки данных, использую локальные:', e);
    placesData = [...places];
    renderPlaces(document.getElementById('categoryFilter').value);
  }
}

// Сохранение данных на сервер
async function savePlaces() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(placesData)
    });
    console.log('✅ Данные сохранены в JSONBin');
  } catch (e) {
    console.error('❌ Ошибка сохранения:', e);
  }
}

// Расчёт рейтинга
function calculateRating(reviews) {
  if (!reviews || !reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return parseFloat((sum / reviews.length).toFixed(1));
}

// Обработка загрузки изображения
function handleImageUpload(event, placeId) {
  const file = event.target.files[0];
  if (!file) return;

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
          <small>${place.reviews ? place.reviews.length : 0} отзывов</small>
        </div>
      </div>
    </div>
  `).join('');
}

// Функция для корректного получения пути к изображению
function getImagePath(photo) {
  if (!photo) return 'images/no-image.jpg';
  if (photo.startsWith('images/') || photo.startsWith('http')) {
    return photo;
  }
  return `images/${photo}`;
}

// Обработчик ошибок загрузки изображения
function handleImageError(img) {
  img.onerror = null;
  img.src = 'images/no-image.jpg';
}

// Модальное окно
let currentPlaceId = null;

function showPlaceDetails(placeId) {
  currentPlaceId = placeId;
  const place = placesData.find(p => p.id === placeId);
  if (!place) return;

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
          <h3>Отзывы (${place.reviews ? place.reviews.length : 0})</h3>
          ${place.reviews && place.reviews.length > 0 ? place.reviews.map(review => `
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
          `).join('') : '<p>Пока нет отзывов. Будьте первым!</p>'}
          
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
                     accept="image/jpeg, image/png, image/webg, image/gif"
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

// Добавление отзыва
async function addReview() {
  const place = placesData.find(p => p.id === currentPlaceId);
  if (!place) return;
  
  const text = document.getElementById('review-text').value;
  if (!text) {
    alert('Пожалуйста, напишите отзыв');
    return;
  }

  if (!place.reviews) place.reviews = [];

  const imageInput = document.getElementById(`review-image-${currentPlaceId}`);
  
  if (imageInput && imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = async function(e) {
      place.reviews.push({
        id: Date.now(),
        author: document.getElementById('review-author').value || 'Аноним',
        rating: parseInt(document.getElementById('review-rating').value),
        text: text,
        image: e.target.result,
        date: new Date().toLocaleDateString('ru-RU')
      });
      await updatePlaceData(place);
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
    await updatePlaceData(place);
  }
}

// Удаление отзыва
async function deleteReview(placeId, reviewId) {
  if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
  
  const place = placesData.find(p => p.id === placeId);
  if (!place) return;
  
  place.reviews = place.reviews.filter(r => r.id !== reviewId);
  await updatePlaceData(place);
}

// Обновление данных
async function updatePlaceData(place) {
  place.rating = calculateRating(place.reviews);
  await savePlaces();
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

// ТЕСТОВАЯ ФУНКЦИЯ
async function testJSONBin() {
  try {
    console.log('Пробуем загрузить из JSONBin...');
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    
    if (!response.ok) {
      console.error('❌ Ошибка HTTP:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Успех! Данные из JSONBin:', data);
    console.log('Количество мест:', data.record.length);
  } catch (e) {
    console.error('❌ Ошибка подключения:', e);
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
  loadPlaces();
  setTimeout(testJSONBin, 2000);
});

// Делаем функции глобальными
window.showPlaceDetails = showPlaceDetails;
window.addReview = addReview;
window.deleteReview = deleteReview;
window.closeModal = closeModal;
window.handleImageUpload = handleImageUpload;
window.handleImageError = handleImageError;
