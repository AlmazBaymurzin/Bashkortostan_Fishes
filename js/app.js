// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let allFishes = [];
let filteredFishes = [];
let currentPage = 0;
const PER_PAGE = 12;

// ===== DOM-ЭЛЕМЕНТЫ =====
const grid = document.getElementById('fishGrid');
const featuredWrapper = document.getElementById('featuredCard');
const searchInput = document.getElementById('searchInput');
const categoryBtns = document.querySelectorAll('.category-btn');
const factText = document.getElementById('randomFact');
const resultCount = document.getElementById('resultCount');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const fishCounter = document.getElementById('fishCounter');

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
    try {
        const response = await fetch('data/fishes.json');
        const data = await response.json();
        allFishes = data.fishes;
        filteredFishes = [...allFishes];
        
        // Обновляем счетчик
        if (fishCounter) fishCounter.textContent = `${allFishes.length} видов`;
        
        // Показываем случайный факт
        showRandomFact();
        
        // Показываем главную карточку
        renderFeatured();
        
        // Рендерим карточки
        renderCards(filteredFishes.slice(0, PER_PAGE));
        updateLoadMore();
        
        // Навешиваем обработчики
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        grid.innerHTML = '<p style="text-align:center;padding:40px;">⚠️ Не удалось загрузить данные. Попробуйте позже.</p>';
    }
}

// ===== СЛУЧАЙНЫЙ ФАКТ =====
function showRandomFact() {
    const facts = [
        'Щука может менять окраску под цвет дна — это маскировка для охоты.',
        'Самый крупный сом в Башкортостане был выловлен в реке Белой и весил более 80 кг.',
        'Стерлядь в Башкортостане восстанавливают: за 5 лет выпущено почти 4 миллиона мальков.',
        'Окунь — одна из самых умных рыб: он запоминает опасные места и избегает их.',
        'Карась способен выживать в водоемах, где почти нет кислорода, зарываясь в ил.',
        'Павловское водохранилище славится трофейными лещами весом до 6 кг.',
        'Хариус водится только в самых чистых и холодных реках востока республики.'
    ];
    const random = facts[Math.floor(Math.random() * facts.length)];
    if (factText) factText.textContent = random;
}

// ===== ГЛАВНАЯ КАРТОЧКА =====
function renderFeatured() {
    if (!featuredWrapper || allFishes.length === 0) return;
    
    // Берем первую рыбу или самую популярную (можно назначить позже)
    const fish = allFishes[0];
    
    const statusMap = {
        'promyslovaya': 'Промысловая',
        'lyubitelskaya': 'Любительская',
        'red_book': '⚠️ Красная книга'
    };
    const statusLabel = statusMap[fish.status] || fish.status;
    let statusClass = fish.status === 'red_book' ? 'tag-red' : 
                     fish.status === 'promyslovaya' ? 'tag-promyslovaya' : '';
    
    featuredWrapper.innerHTML = `
        <a href="fish.html?id=${fish.id}" class="featured-card">
            <img src="${fish.thumb}" alt="${fish.name}" loading="lazy" />
            <div class="featured-card-content">
                <div>
                    <span class="tag ${statusClass}">${statusLabel}</span>
                    <span class="tag">${fish.family}</span>
                </div>
                <div class="featured-card-title">${fish.name}</div>
                <div class="featured-card-desc">${fish.description || 'Интересный представитель ихтиофауны Башкортостана.'}</div>
                <div class="featured-card-meta">📍 ${fish.habitats.join(', ')}</div>
            </div>
        </a>
    `;
}

// ===== ОТРИСОВКА КАРТОЧЕК =====
function renderCards(fishes) {
    if (fishes.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:40px;grid-column:1/-1;">😕 Ничего не найдено. Попробуйте изменить фильтры.</p>';
        return;
    }
    
    // Добавляем анимацию появления с задержкой
    grid.innerHTML = '';
    fishes.forEach((fish, index) => {
        const card = document.createElement('a');
        card.className = 'fish-card';
        card.href = `fish.html?id=${fish.id}`;
        card.style.animationDelay = `${index * 0.05}s`;
        
        const statusMap = {
            'promyslovaya': 'Промысловая',
            'lyubitelskaya': 'Любительская',
            'red_book': '⚠️ Красная книга'
        };
        const statusLabel = statusMap[fish.status] || fish.status;
        let statusClass = fish.status === 'red_book' ? 'tag-red' : 
                         fish.status === 'promyslovaya' ? 'tag-promyslovaya' : '';
        
        card.innerHTML = `
            <img src="${fish.thumb}" alt="${fish.name}" class="fish-card-img" loading="lazy" />
            <div class="fish-card-content">
                <div class="fish-card-title">${fish.name}</div>
                <div class="fish-card-latin">${fish.latin}</div>
                <div class="fish-card-tags">
                    <span class="tag">${fish.family}</span>
                    <span class="tag ${statusClass}">${statusLabel}</span>
                </div>
                <div class="fish-card-habitats">
                    <strong>Где водится:</strong> ${fish.habitats.join(', ')}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ===== ФИЛЬТРЫ =====
function applyFilters(resetPage = true) {
    if (resetPage) currentPage = 0;
    
    const query = searchInput.value.toLowerCase().trim();
    const activeCategory = document.querySelector('.category-btn.active');
    const category = activeCategory ? activeCategory.dataset.filter : 'all';
    
    filteredFishes = allFishes.filter(fish => {
        // Поиск по тексту
        const matchesSearch = query === '' || 
            fish.name.toLowerCase().includes(query) ||
            fish.latin.toLowerCase().includes(query) ||
            fish.family.toLowerCase().includes(query) ||
            fish.habitats.some(h => h.toLowerCase().includes(query));
        
        // Категория
        let matchesCategory = true;
        if (category === 'promyslovaya') matchesCategory = fish.status === 'promyslovaya';
        else if (category === 'red_book') matchesCategory = fish.status === 'red_book';
        else if (category === 'predator') matchesCategory = fish.diet === 'хищник';
        else if (category === 'peaceful') matchesCategory = fish.diet === 'мирная' || fish.diet === 'растительноядная';
        
        return matchesSearch && matchesCategory;
    });
    
    // Обновляем счетчик
    if (resultCount) resultCount.textContent = `${filteredFishes.length} видов`;
    
    // Показываем первую порцию
    renderCards(filteredFishes.slice(0, PER_PAGE));
    updateLoadMore();
}

function updateLoadMore() {
    if (loadMoreBtn) {
        const shown = currentPage * PER_PAGE + PER_PAGE;
        if (shown < filteredFishes.length) {
            loadMoreBtn.style.display = 'inline-block';
            loadMoreBtn.textContent = `Показать еще (${filteredFishes.length - shown} осталось)`;
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

function loadMore() {
    currentPage++;
    const start = currentPage * PER_PAGE;
    const end = start + PER_PAGE;
    const newFishes = filteredFishes.slice(start, end);
    // Добавляем новые карточки в конец сетки
    newFishes.forEach((fish, index) => {
        const card = document.createElement('a');
        card.className = 'fish-card';
        card.href = `fish.html?id=${fish.id}`;
        card.style.animationDelay = `${index * 0.05}s`;
        
        const statusMap = {
            'promyslovaya': 'Промысловая',
            'lyubitelskaya': 'Любительская',
            'red_book': '⚠️ Красная книга'
        };
        const statusLabel = statusMap[fish.status] || fish.status;
        let statusClass = fish.status === 'red_book' ? 'tag-red' : 
                         fish.status === 'promyslovaya' ? 'tag-promyslovaya' : '';
        
        card.innerHTML = `
            <img src="${fish.thumb}" alt="${fish.name}" class="fish-card-img" loading="lazy" />
            <div class="fish-card-content">
                <div class="fish-card-title">${fish.name}</div>
                <div class="fish-card-latin">${fish.latin}</div>
                <div class="fish-card-tags">
                    <span class="tag">${fish.family}</span>
                    <span class="tag ${statusClass}">${statusLabel}</span>
                </div>
                <div class="fish-card-habitats">
                    <strong>Где водится:</strong> ${fish.habitats.join(', ')}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    updateLoadMore();
}

// ===== СОБЫТИЯ =====
function setupEventListeners() {
    // Поиск
    searchInput.addEventListener('input', () => applyFilters(true));
    
    // Категории
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters(true);
        });
    });
    
    // Кнопка "Показать еще"
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMore);
    }
}

// ===== ЗАПУСК =====
loadData();