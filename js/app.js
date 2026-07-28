// js/app.js
// Скрипт для загрузки и отображения карточек рыб на главной странице

document.addEventListener('DOMContentLoaded', function() {
    // 1. Находим контейнер, куда будем вставлять карточки
    const container = document.getElementById('fishGrid');

    // Если контейнера нет на странице — выходим
    if (!container) {
        console.warn('Контейнер #fishGrid не найден на странице.');
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

            // 5. Обновляем счетчик видов в шапке
            updateCounter(fishes.length);

            // 6. Показываем случайный факт
            showRandomFact(fishes);
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

    fishes.forEach((fish, index) => {
        // Проверяем наличие обязательных полей
        const name = fish.name || 'Без названия';
        const thumb = fish.thumb || 'img/placeholder.jpg';
        const habitat = Array.isArray(fish.habitat) ? fish.habitat.join(', ') : 'Информация отсутствует';
        
        // Определяем класс статуса
        let statusClass = 'tag-promyslovaya';
        let statusLabel = fish.status || 'Промысловая';
        if (fish.status && fish.status.includes('краснокнижная')) {
            statusClass = 'tag-red';
            statusLabel = 'Красная книга ⚠️';
        }

        // Формируем блок с интересными фактами (показываем первый факт, если есть)
        let funFactHTML = '';
        if (Array.isArray(fish.funFacts) && fish.funFacts.length > 0) {
            funFactHTML = `<div class="fish-card-habitats" style="margin-top:6px;font-size:14px;color:#4a5a6a;">⭐ ${fish.funFacts[0]}</div>`;
        }

        // Задержка анимации для каждой карточки
        const delay = index * 0.05;

        // Строим HTML карточки (используем классы из style.css)
        cardsHTML += `
            <a href="fish.html?id=${fish.id || ''}" class="fish-card" style="animation-delay: ${delay}s; text-decoration: none; color: inherit;">
                <img src="${thumb}" alt="${name}" class="fish-card-img" loading="lazy" onerror="this.src='img/placeholder.jpg'" />
                <div class="fish-card-content">
                    <h3 class="fish-card-title">${name}</h3>
                    <div class="fish-card-latin">${fish.latin || ''}</div>
                    <div class="fish-card-tags">
                        <span class="tag ${statusClass}">${statusLabel}</span>
                        <span class="tag">${fish.family || ''}</span>
                    </div>
                    <div class="fish-card-habitats">
                        <strong>📍</strong> ${habitat}
                    </div>
                    ${funFactHTML}
                </div>
            </a>
        `;
    });

    // Вставляем все карточки в контейнер
    container.innerHTML = cardsHTML;
}

/**
 * Обновляет счетчик видов в шапке
 */
function updateCounter(count) {
    const counter = document.getElementById('fishCounter');
    if (counter) {
        counter.textContent = `${count} видов`;
    }
}

/**
 * Показывает случайный факт в блоке
 */
function showRandomFact(fishes) {
    const factContainer = document.getElementById('randomFact');
    if (!factContainer) return;

    // Собираем все факты
    const allFacts = [];
    fishes.forEach(fish => {
        if (Array.isArray(fish.funFacts)) {
            fish.funFacts.forEach(fact => {
                allFacts.push(`${fish.name}: ${fact}`);
            });
        }
    });

    if (allFacts.length === 0) {
        factContainer.textContent = '🐟 В каталоге пока нет интересных фактов.';
        return;
    }

    const randomIndex = Math.floor(Math.random() * allFacts.length);
    factContainer.textContent = allFacts[randomIndex];
}
