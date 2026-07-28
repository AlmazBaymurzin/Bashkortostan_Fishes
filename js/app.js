// js/app.js
// Скрипт для загрузки и отображения карточек рыб на главной странице

document.addEventListener('DOMContentLoaded', function() {
    // 1. Находим контейнер, куда будем вставлять карточки
    const container = document.getElementById('fish-cards');

    // Если контейнера нет на странице — выходим
    if (!container) {
        console.warn('Контейнер #fish-cards не найден на странице.');
        return;
    }

    // 2. Загружаем данные из JSON-файла
    fetch('data/fishes.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 3. Извлекаем массив рыб из объекта (ключ "fishes")
            const fishes = data.fishes;

            // Проверяем, что данные — это массив
            if (!Array.isArray(fishes) || fishes.length === 0) {
                container.innerHTML = '<p class="no-data">🐟 В каталоге пока нет рыб. Загляните позже!</p>';
                return;
            }

            // 4. Отображаем карточки
            renderFishCards(fishes, container);
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных:', error);
            container.innerHTML = '<p class="error-message">⚠️ Не удалось загрузить каталог рыб. Пожалуйста, обновите страницу позже.</p>';
        });
});

/**
 * Функция для рендеринга карточек рыб
 * @param {Array} fishes - массив объектов с данными о рыбах
 * @param {HTMLElement} container - контейнер для карточек
 */
function renderFishCards(fishes, container) {
    // Очищаем контейнер
    container.innerHTML = '';

    // Создаем HTML для каждой карточки
    let cardsHTML = '';

    fishes.forEach(fish => {
        // Проверяем наличие обязательных полей
        const name = fish.name || 'Без названия';
        const thumb = fish.thumb || 'img/placeholder.jpg';
        const habitat = Array.isArray(fish.habitat) ? fish.habitat.join(', ') : 'Информация отсутствует';
        const statusClass = fish.status && fish.status.includes('краснокнижная') ? 'status-red' : 'status-common';

        // Формируем блок с интересными фактами (показываем первый факт, если есть)
        let funFactHTML = '';
        if (Array.isArray(fish.funFacts) && fish.funFacts.length > 0) {
            funFactHTML = `<div class="fun-fact">⭐ ${fish.funFacts[0]}</div>`;
        }

        // Строим HTML карточки
        cardsHTML += `
            <div class="fish-card" data-id="${fish.id || ''}">
                <div class="fish-card-image">
                    <img src="${thumb}" alt="${name}" loading="lazy">
                </div>
                <div class="fish-card-content">
                    <h3 class="fish-name">${name}</h3>
                    <span class="fish-status ${statusClass}">${fish.status || ''}</span>
                    <div class="fish-habitat">📍 ${habitat}</div>
                    ${funFactHTML}
                    <a href="fish.html?id=${fish.id || ''}" class="fish-link">Подробнее →</a>
                </div>
            </div>
        `;
    });

    // Вставляем все карточки в контейнер
    container.innerHTML = cardsHTML;
}
