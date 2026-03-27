// Ждём полной загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
  
  // Проверяем, что data.js загрузился
  if (typeof places === 'undefined') {
    console.error('Ошибка: data.js не загружен!');
    document.getElementById('placesList').innerHTML = '<p style="text-align:center; padding:40px;">Ошибка загрузки данных</p>';
    return;
  }

  // Загружаем сохранённые отзывы или берём данные из data.js
  let placesData;
  try {
    const saved = localStorage.getItem('sirius-places');
    if (saved) {
      placesData = JSON.parse(saved);
    } else {
      placesData = [...places];
    }
  } catch(e) {
    placesData = [...places];
  }

  // Сохранение в localStorage
  function saveData() {
    localStorage.setItem('sirius-places', JSON.stringify(placesData));
  }

  // Расчёт рейтинга
  function calcRating(reviews) {
    if (!reviews || !reviews.length) return 0;
    const sum = reviews.reduce((a, r) => a + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }

  // Путь к фото
  function getImagePath(photo) {
    if (!photo) return 'images/no-image.jpg';
    if (photo.startsWith('images/') || photo.startsWith('http')) return photo;
    return `images/${photo}`;
  }

  // Ошибка фото
  function handleImageError(img) {
    img.onerror = null;
    img.src = 'images/no-image.jpg';
  }

  // Загрузка фото отзыва
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

  // Отрисовка списка мест
  function renderPlaces(category = 'all') {
    const filtered = category === 'all' 
      ? placesData 
      : placesData.filter(p => p.category === category);
    
    const container = document.getElementById('placesList');
    if (!container) return;
    
    container.innerHTML = filtered.map(place => `
      <div class="place-card" onclick="showDetails(${place.id})">
        <img src="${getImagePath(place.photo)}" class="place-img" onerror="handleImageError(this)">
        <div class="place-info">
          <h2>${place.name}</h2>
          <p class="address">${place.address}</p>
          <div class="rating-section">
            ${place.rating > 0 ? '★'.repeat(Math.round(place.rating)) + ' ' + place.rating : 'Нет оценок'}
            <small>${place.reviews?.length || 0} отзывов</small>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Модальное окно
  let currentId = null;

  function showDetails(id) {
    currentId = id;
    const place = placesData.find(p => p.id === id);
    if (!place) return;

    const oldModal = document.querySelector('.modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn" onclick="closeModal()">&times;</span>
        <div class="modal-info">
          <h2>${place.name}</h2>
          <img src="${getImagePath(place.photo)}" class="main-image" onerror="handleImageError(this)">
          <p><strong>Адрес:</strong> ${place.address}</p>
          <p><strong>Часы:</strong> ${place.workingHours}</p>
          ${place.website ? `<p><strong>Сайт:</strong> <a href="${place.website}" target="_blank">${place.website}</a></p>` : ''}
          <p class="description">${place.description}</p>
          
          <div class="reviews-section">
            <h3>Отзывы (${place.reviews?.length || 0})</h3>
            ${place.reviews && place.reviews.length ? place.reviews.map(r => `
              <div class="review">
                <div class="review-header">
                  <span>${r.author}</span>
                  <span>${'★'.repeat(r.rating)}</span>
                  <button class="delete-review-btn" onclick="event.stopPropagation(); deleteReview(${place.id}, ${r.id})">×</button>
                </div>
                <p>${r.text}</p>
                ${r.image ? `<img src="${r.image}" class="review-image">` : ''}
                <small>${r.date}</small>
              </div>
            `).join('') : '<p>Нет отзывов. Будьте первым!</p>'}
            
            <div class="add-review">
              <h4>Оставить отзыв</h4>
              <input type="text" id="review-author" placeholder="Ваше имя">
              <select id="review-rating">
                <option value="5">5 ★★★★★</option><option value="4">4 ★★★★</option>
                <option value="3" selected>3 ★★★</option><option value="2">2 ★★</option><option value="1">1 ★</option>
              </select>
              <textarea id="review-text" placeholder="Ваш отзыв"></textarea>
              <div class="review-image-upload">
                <input type="file" id="review-image-${place.id}" accept="image/*" onchange="handleImageUpload(event, ${place.id})" style="display:none">
                <label for="review-image-${place.id}">📷 Прикрепить фото</label>
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

  // Добавить отзыв
  function addReview() {
    const place = placesData.find(p => p.id === currentId);
    if (!place) return;
    const text = document.getElementById('review-text').value;
    if (!text) return alert('Напишите отзыв');

    if (!place.reviews) place.reviews = [];
    const newReview = {
      id: Date.now(),
      author: document.getElementById('review-author').value || 'Аноним',
      rating: parseInt(document.getElementById('review-rating').value),
      text: text,
      date: new Date().toLocaleDateString('ru-RU')
    };

    const imgInput = document.getElementById(`review-image-${currentId}`);
    if (imgInput && imgInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        newReview.image = e.target.result;
        place.reviews.push(newReview);
        updatePlace(place);
      };
      reader.readAsDataURL(imgInput.files[0]);
    } else {
      place.reviews.push(newReview);
      updatePlace(place);
    }
  }

  // Удалить отзыв
  function deleteReview(placeId, reviewId) {
    if (!confirm('Удалить отзыв?')) return;
    const place = placesData.find(p => p.id === placeId);
    if (!place) return;
    place.reviews = place.reviews.filter(r => r.id !== reviewId);
    updatePlace(place);
  }

  // Обновить данные
  function updatePlace(place) {
    place.rating = calcRating(place.reviews);
    saveData();
    closeModal();
    renderPlaces(document.getElementById('categoryFilter').value);
  }

  function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
    document.body.style.overflow = 'auto';
  }

  // Фильтр
  const filter = document.getElementById('categoryFilter');
  if (filter) {
    filter.addEventListener('change', e => renderPlaces(e.target.value));
  }

  // Глобальные функции
  window.showDetails = showDetails;
  window.addReview = addReview;
  window.deleteReview = deleteReview;
  window.closeModal = closeModal;
  window.handleImageUpload = handleImageUpload;
  window.handleImageError = handleImageError;

  // Запуск
  renderPlaces();
});
