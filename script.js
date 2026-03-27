// Простейший код без заморочек
(function() {
  
  // Ждём, пока страница загрузится
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    console.log('Страница загружена, начинаем...');
    
    // Проверяем, есть ли данные
    if (typeof places === 'undefined') {
      console.error('Нет data.js!');
      return;
    }
    
    // Берём данные
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
    
    console.log('Количество мест:', placesData.length);
    
    // Функция для пути к фото
    function getImagePath(photo) {
      if (!photo) return 'images/no-image.jpg';
      if (photo.startsWith('images/')) return photo;
      return 'images/' + photo;
    }
    
    // Отрисовка списка
    function renderPlaces(category) {
      if (!category) category = 'all';
      
      const filtered = category === 'all' 
        ? placesData 
        : placesData.filter(p => p.category === category);
      
      const container = document.getElementById('placesList');
      if (!container) return;
      
      let html = '';
      for (let i = 0; i < filtered.length; i++) {
        const place = filtered[i];
        html += `
          <div class="place-card" onclick="window.showDetails(${place.id})">
            <img src="${getImagePath(place.photo)}" class="place-img" onerror="this.src='images/no-image.jpg'">
            <div class="place-info">
              <h2>${place.name}</h2>
              <p class="address">${place.address}</p>
              <div class="rating-section">
                ${place.rating > 0 ? '★'.repeat(Math.round(place.rating)) + ' ' + place.rating : 'Нет оценок'}
                <small>${place.reviews ? place.reviews.length : 0} отзывов</small>
              </div>
            </div>
          </div>
        `;
      }
      container.innerHTML = html;
    }
    
    // Показ деталей
    window.showDetails = function(id) {
      const place = placesData.find(p => p.id === id);
      if (!place) return;
      
      alert(place.name + '\n' + place.address + '\n\n' + place.description);
    };
    
    // Фильтр
    const filter = document.getElementById('categoryFilter');
    if (filter) {
      filter.addEventListener('change', function(e) {
        renderPlaces(e.target.value);
      });
    }
    
    // Запуск
    renderPlaces('all');
    console.log('Готово!');
  }
  
})();
