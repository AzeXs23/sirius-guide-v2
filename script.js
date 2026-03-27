// Ожидаем полной загрузки страницы и data.js
document.addEventListener('DOMContentLoaded', function() {
  // Проверяем, что данные из data.js уже доступны
  if (typeof places !== 'undefined') {
    // Загружаем сохранённые отзывы или используем данные из data.js
    try {
      const savedData = localStorage.getItem('sirius-places');
      if (savedData) {
        window.placesData = JSON.parse(savedData);
      } else {
        window.placesData = [...places];
      }
    } catch (e) {
      console.error("Ошибка загрузки данных", e);
      window.placesData = [...places];
    }
  } else {
    console.error("Файл data.js не загружен!");
    window.placesData = [];
  }

  // Сохранение данных
  window.saveData = function() {
    localStorage.setItem('sirius-places', JSON.stringify(window.placesData));
  };

  // Расчёт рейтинга
  window.calculateRating = function(reviews) {
    if (!reviews || !reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return parseFloat((sum / reviews.length).toFixed(1));
  };

  // Обработка загрузки изображения
  window.handleImageUpload = function(event, placeId) {
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
  };

  // Путь к изображению
  window.getImagePath = function(photo) {
    if (!photo) return 'images/no-image.jpg';
    if (photo.startsWith('images/') || photo.startsWith('http')) {
      return photo;
    }
    return `images/${photo}`;
  };

  // Ошибка загрузки изображения
  window.handleImageError = function(img) {
    img.onerror = null;
    img.src = 'images/no-image.jpg';
  };

  // Отображение мест
  window.renderPlaces = function(category = 'all') {
    const filtered = category === 'all' 
      ? window.placesData 
      : window.placesData.filter(p => p.category === category);
    
    const placesList = document.getElementById('placesList');
    if (!placesList) return;
    
    if (!window.placesData || window.placesData.length === 0) {
      placesList.innerHTML = '<p style="text-align:center; padding:40px;">Загрузка данных...</p>';
      return;
    }
    
    placesList.innerHTML = filtered.map(place => `
      <div class="place-card" onclick="showPlaceDetails(${place.id})">
        <img src="${window.getImagePath(place.photo)}" alt="${place.name}" class="place-img" onerror="handleImageError(this)">
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
  };

  // Модальное окно
  let currentPlaceId = null;

  window.showPlaceDetails = function(placeId) {
    currentPlaceId = placeId;
    const place = window.placesData.find(p => p.id === placeId);
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
          <img src="${window.getImagePath(place.photo)}" alt="${place.name}" class="main-image" onerror="handleImageError(this)">
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
  };

  // Добавление отзыва
  window.addReview = function() {
    const place = window.placesData.find(p => p.id === currentPlaceId);
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
      reader.onload = function(e) {
        place.reviews.push({
          id: Date.now(),
          author: document.getElementById('review-author').value || 'Аноним',
          rating: parseInt(document.getElementById('review-rating').value),
          text: text,
          image: e.target.result,
          date: new Date().toLocaleDateString('ru-RU')
        });
        window.updatePlaceData(place);
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
      window.updatePlaceData(place);
    }
  };

  // Удаление отзыва
  window.deleteReview = function(placeId, reviewId) {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
    
    const place = window.placesData.find(p => p.id === placeId);
    if (!place) return;
    
    place.reviews = place.reviews.filter(r => r.id !== reviewId);
    window.updatePlaceData(place);
  };

  // Обновление данных
  window.updatePlaceData = function(place) {
    place.rating = window.calculateRating(place.reviews);
    window.saveData();
    window.closeModal();
    window.renderPlaces(document.getElementById('categoryFilter').value);
  };

  window.closeModal = function() {
    const modal = document.querySelector('.modal');
    if (modal) {
      document.body.removeChild(modal);
      document.body.style.overflow = 'auto';
    }
  };

  // Фильтр
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      window.renderPlaces(e.target.value);
    });
  }

  // Отрисовка сразу после загрузки
  window.renderPlaces();
});
