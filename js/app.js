// js/app.js
// Скрипт для загрузки, отображения, ФИЛЬТРАЦИИ и случайных фактов

let allFishes = [];
let currentFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('fishGrid');
    if (!container) return;

    fetch('data/fishes.json')
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allFishes = data.fishes || [];
            if (!Array.isArray(allFishes) || allFishes.length === 0) {
                container.innerHTML = '<p class="no-data">🐟 В каталоге пока нет рыб. Загляните позже!</p>';
                return;
            }

            // 1. Первичный рендер
            applyFiltersAndRender();

            // 2. Настраиваем обработчики фильтров
            setupFilterButtons();

            // 3. Настраиваем поиск
            setupSearch();

            // 4. Обновляем статистику в промо-баннере
            updatePromoStats(allFishes);

            // 5. Показываем случайный факт (НОВОЕ!)
            showRandomFact(allFishes);
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных:', error);
            container.innerHTML = '<p class="error-message">⚠️ Не удалось загрузить каталог рыб.</p>';
        });
});

// ==========================================================
//  ЛОГИКА ФИЛЬТРАЦИИ И ПОИСКА
// ==========================================================

function applyFiltersAndRender() {
    let filtered = allFishes;
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(fish => 
            fish.name.toLowerCase().includes(query) || 
            (fish.latin && fish.latin.toLowerCase().includes(query)) ||
            (fish.family && fish.family.toLowerCase().includes(query))
        );
    }

    if (currentFilter === 'all') {
        // Оставляем все
    } else if (currentFilter === 'promyslovaya') {
        filtered = filtered.filter(fish => fish.status && !fish.status.includes('краснокнижная'));
    } else if (currentFilter === 'red_book') {
        filtered = filtered.filter(fish => fish.status && fish.status.includes('краснокнижная'));
    } else if (currentFilter === 'predator') {
        filtered = filtered.filter(fish => fish.diet && fish.diet.toLowerCase().includes('хищник'));
    } else if (currentFilter === 'peaceful') {
        filtered = filtered.filter(fish => {
            if (!fish.diet) return true;
            const diet = fish.diet.toLowerCase();
            return !diet.includes('хищник') && !diet.includes('хищник-');
        });
    }

    renderFishCards(filtered, document.getElementById('fishGrid'));
    updateCounter(filtered.length);

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === currentFilter);
    });
}

// ==========================================================
//  ОБРАБОТЧИКИ
// ==========================================================

function setupFilterButtons() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilter = this.dataset.filter;
            applyFiltersAndRender();
            // При смене фильтра показываем новый случайный факт
            showRandomFact(allFishes);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        searchQuery = this.value;
        applyFiltersAndRender();
    });
}

// ==========================================================
//  РЕНДЕРИНГ
// ==========================================================

function renderFishCards(fishes, container) {
    if (!container) return;
    container.innerHTML = '';

    if (fishes.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#7a8a9a;grid-column:1/-1;">
                <p style="font-size:18px;">😕 Ничего не найдено</p>
                <p style="font-size:14px;">Попробуйте изменить фильтр или поиск</p>
            </div>
        `;
        return;
    }

    let cardsHTML = '';
    fishes.forEach((fish, index) => {
        const name = fish.name || 'Без названия';
        const thumb = fish.thumb || 'img/placeholder.jpg';
        const habitat = Array.isArray(fish.habitat) ? fish.habitat.join(', ') : 'Информация отсутствует';
        
        let statusClass = 'tag-promyslovaya';
        let statusLabel = fish.status || 'Промысловая';
        if (fish.status && fish.status.includes('краснокнижная')) {
            statusClass = 'tag-red';
            statusLabel = 'Красная книга ⚠️';
        }

        let funFactHTML = '';
        if (Array.isArray(fish.funFacts) && fish.funFacts.length > 0) {
            funFactHTML = `<div class="fish-card-habitats" style="margin-top:6px;font-size:14px;color:#4a5a6a;">⭐ ${fish.funFacts[0]}</div>`;
        }

        const delay = index * 0.05;

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

    container.innerHTML = cardsHTML;
}

function updateCounter(count) {
    const counter = document.getElementById('fishCounter');
    const resultCount = document.getElementById('resultCount');
    const text = `${count} ${getPlural(count)}`;
    if (counter) counter.textContent = text;
    if (resultCount) resultCount.textContent = text;
}

function getPlural(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'вид';
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'вида';
    return 'видов';
}

// ==========================================================
//  СТАТИСТИКА ДЛЯ ПРОМО-БАННЕРА
// ==========================================================

function updatePromoStats(fishes) {
    let promyslovayaCount = 0;
    let redBookCount = 0;

    fishes.forEach(fish => {
        const status = fish.status || '';
        if (status.includes('краснокнижная')) {
            redBookCount++;
        } else {
            promyslovayaCount++;
        }
    });

    const promoEl = document.getElementById('statPromyslovaya');
    const redEl = document.getElementById('statRedBook');

    if (promoEl) promoEl.textContent = `🎣 ${promyslovayaCount} промысловых видов`;
    if (redEl) redEl.textContent = `⚠️ ${redBookCount} видов в Красной книге`;
}

// ==========================================================
//  🆕 СЛУЧАЙНЫЙ ФАКТ (ВОССТАНОВЛЕН!)
// ==========================================================

function showRandomFact(fishes) {
    const factContainer = document.getElementById('randomFact');
    if (!factContainer) return;

    // Собираем все факты из всех рыб
    const allFacts = [];
    fishes.forEach(fish => {
        if (Array.isArray(fish.funFacts)) {
            fish.funFacts.forEach(fact => {
                allFacts.push(`${fish.name}: ${fact}`);
            });
        }
    });

    // Если фактов нет — выводим заглушку
    if (allFacts.length === 0) {
        factContainer.textContent = '🐟 В каталоге пока нет интересных фактов.';
        return;
    }

    // Выбираем случайный
    const randomIndex = Math.floor(Math.random() * allFacts.length);
    factContainer.textContent = allFacts[randomIndex];
}
