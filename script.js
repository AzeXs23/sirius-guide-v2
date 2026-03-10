const BIN_ID = '69b06f2684682b35628670ff';
const API_KEY = '$2a$10$9W9QC/Er99War3q5MakpfuXOjjLdf/QBg5ovYQHU9jOEdyJQ3jfAC';

let placesData = [];

// Загрузка данных
async function loadPlaces() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error('Ошибка загрузки');
    }
    
    const data = await response.json();
    placesData = data.record;
    renderPlaces();
  } catch (e) {
    console.error('Ошибка:', e);
    placesData = [];
    renderPlaces();
  }
}

// Сохранение данных
async function savePlaces() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(placesData)
    });
    
    if (response.ok) {
      console.log('Сохранено!');
    }
  } catch (e) {
    console.error('Ошибка сохранения:', e);
  }
}

// Расчет рейтинга
function calculateRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Number((sum / reviews.length).toFixed(1));
}

// Путь к фото
function getImagePath(photo) {
  if (!photo) return 'images/no-image.jpg';
  return photo.startsWith('images/') ? photo : `images/${photo}`;
}

// Ошибка фото
function handleImageError(img) {
  img.src = 'images/no-image.jpg';
}

// Загрузка фото для отзыва
function handleImageUpload(event, placeId) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById(`review-img-${placeId}`);
    if (preview) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

// Показать все места
function renderPlaces() {
  const list = document.getElementById('placesList');
  if (!list) return;

  list.innerHTML = placesData.map(place => `
    <div class="place-card" onclick="showDetails(${place.id})">
      <img src="${getImagePath(place.photo)}" class="place-img" onerror="handleImageError(this)">
      <div class="place-info">
        <h2>${place.name}</h2>
        <p class="address">${place.address}</p>
        <div class="rating-section">
          ${place.rating ? '★'.repeat(Math.round(place.rating)) + ' ' + place.rating : 'Нет оценок'}
          <small>${place.reviews?.length || 0} отзывов</small>
        </div>
      </div>
    </div>
  `).join('');
}

// Показать детали
let currentId = null;

function showDetails(id) {
  currentId = id;
  const place = placesData.find(p => p.id === id);
  if (!place) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="closeModal()">&times;</span>
      <h2>${place.name}</h2>
      <img src="${getImagePath(place.photo)}" class="main-image" onerror="handleImageError(this)">
      <p><strong>Адрес:</strong> ${place.address}</p>
      <p><strong>Часы:</strong> ${place.workingHours}</p>
      ${place.website ? `<p><strong>Сайт:</strong> <a href="${place.website}" target="_blank">${place.website}</a></p>` : ''}
      <p>${place.description}</p>
      
      <div class="reviews">
        <h3>Отзывы (${place.reviews?.length || 0})</h3>
        ${place.reviews?.map(r => `
          <div class="review">
            <b>${r.author}</b> ${'★'.repeat(r.rating)}
            <p>${r.text}</p>
            ${r.image ? `<img src="${r.image}" class="review-img">` : ''}
            <small>${r.date}</small>
            <button onclick="deleteReview(${place.id}, ${r.id})">Удалить</button>
          </div>
        `).join('') || '<p>Нет отзывов</p>'}
        
        <div class="add-review">
          <h4>Добавить отзыв</h4>
          <input type="text" id="author" placeholder="Ваше имя">
          <select id="rating">
            <option value="5">5 ★★★★★</option>
            <option value="4">4 ★★★★</option>
            <option value="3">3 ★★★</option>
            <option value="2">2 ★★</option>
            <option value="1">1 ★</option>
          </select>
          <textarea id="text" placeholder="Ваш отзыв"></textarea>
          <input type="file" id="image" accept="image/*" onchange="handleImageUpload(event, ${place.id})">
          <img id="review-img-${place.id}" class="preview">
          <button onclick="addReview()">Отправить</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Добавить отзыв
async function addReview() {
  const place = placesData.find(p => p.id === currentId);
  if (!place) return;

  const text = document.getElementById('text').value;
  if (!text) {
    alert('Напишите отзыв');
    return;
  }

  const preview = document.getElementById(`review-img-${currentId}`);
  
  const review = {
    id: Date.now(),
    author: document.getElementById('author').value || 'Аноним',
    rating: parseInt(document.getElementById('rating').value),
    text: text,
    image: preview?.src || null,
    date: new Date().toLocaleDateString()
  };

  if (!place.reviews) place.reviews = [];
  place.reviews.push(review);
  place.rating = calculateRating(place.reviews);

  await savePlaces();
  closeModal();
  renderPlaces();
}

// Удалить отзыв
async function deleteReview(placeId, reviewId) {
  if (!confirm('Удалить отзыв?')) return;
  
  const place = placesData.find(p => p.id === placeId);
  place.reviews = place.reviews.filter(r => r.id !== reviewId);
  place.rating = calculateRating(place.reviews);
  
  await savePlaces();
  closeModal();
  showDetails(placeId);
}

// Закрыть модалку
function closeModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

// Фильтр
document.addEventListener('DOMContentLoaded', () => {
  const filter = document.getElementById('categoryFilter');
  if (filter) {
    filter.addEventListener('change', (e) => {
      const category = e.target.value;
      if (category === 'all') {
        renderPlaces();
      } else {
        const filtered = placesData.filter(p => p.category === category);
        document.getElementById('placesList').innerHTML = filtered.map(place => `
          <div class="place-card" onclick="showDetails(${place.id})">
            <img src="${getImagePath(place.photo)}" class="place-img" onerror="handleImageError(this)">
            <div class="place-info">
              <h2>${place.name}</h2>
              <p class="address">${place.address}</p>
              <div class="rating-section">
                ${place.rating ? '★'.repeat(Math.round(place.rating)) + ' ' + place.rating : 'Нет оценок'}
                <small>${place.reviews?.length || 0} отзывов</small>
              </div>
            </div>
          </div>
        `).join('');
      }
    });
  }
  
  loadPlaces();
});

// Глобальные функции
window.showDetails = showDetails;
window.closeModal = closeModal;
window.addReview = addReview;
window.deleteReview = deleteReview;
window.handleImageUpload = handleImageUpload;
window.handleImageError = handleImageError;
