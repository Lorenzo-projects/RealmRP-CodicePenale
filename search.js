/**
 * Gestione principale del Codice Penale di Los Santos
 * Questo script gestisce:
 * - Ricerca dinamica nel contenuto
 * - Navigazione tra le sezioni
 * - Tema chiaro/scuro
 * - Responsive sidebar
 * - Highlight dei risultati di ricerca
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // INIZIALIZZAZIONE ELEMENTI DOM
        const elements = {
            search: document.getElementById('search'),
            sections: document.querySelectorAll('.section-content'),
            mainTitle: document.querySelector('.sidebar-logo'),
            navLinks: document.querySelectorAll('.nav-link'),
            introLink: document.querySelector('a[href="#introduzione"]'),
            mobileMenu: document.getElementById('mobile-menu'),
            sidebar: document.querySelector('.sidebar'),
            themeToggle: document.getElementById('theme-toggle'),
            html: document.documentElement,
            themeIcon: document.querySelector('#theme-toggle i')
        };

        // GESTIONE STATO
        let state = {
            searchTimeout: null,
            originalContents: new WeakMap(),
            currentTheme: elements.html.getAttribute('data-theme') || 'light'
        };

        // Aggiungiamo queste funzioni di utilità per il tracking dello stato della ricerca
        const searchState = {
            lastQuery: '',
            activeHighlights: [],
            isSearching: false,
            resetSearch() {
                this.lastQuery = '';
                this.activeHighlights = [];
                this.isSearching = false;
            }
        };

        // INIZIALIZZAZIONE
        initializePage();

        // GESTIONE EVENTI
        setupEventListeners();

        // FUNZIONI DI UTILITÀ
        function initializePage() {
            // Salva contenuti originali e mostra solo prima sezione
            elements.sections.forEach((section, index) => {
                state.originalContents.set(section, section.innerHTML);
                section.style.display = index === 0 ? 'block' : 'none';
            });
        }

        function setupEventListeners() {
            // Event listener per la ricerca
            elements.search.addEventListener('input', debounceSearch);
            
            // Event listener per il tema
            elements.themeToggle.addEventListener('click', toggleTheme);
            
            // Event listener per il titolo principale
            elements.mainTitle.addEventListener('click', handleMainTitleClick);
            
            // Event listener per i link di navigazione
            elements.navLinks.forEach(link => {
                link.addEventListener('click', handleNavigation);
            });

            // Event listener per il menu mobile
            if (elements.mobileMenu) {
                setupMobileMenu();
            }

            // Event listener per il tasto ESC
            document.addEventListener('keydown', handleKeyboardEvents);
        }

        function toggleTheme() {
            const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
            elements.html.setAttribute('data-theme', newTheme);
            elements.themeIcon.classList.replace(
                newTheme === 'dark' ? 'fa-moon' : 'fa-sun',
                newTheme === 'dark' ? 'fa-sun' : 'fa-moon'
            );
            state.currentTheme = newTheme;
        }

        function handleMainTitleClick(e) {
            e.preventDefault();
            resetSearchAndNavigation();
            animateTitle();
            scrollToTop();
        }

        function resetSearchAndNavigation() {
            elements.search.value = '';
            elements.navLinks.forEach(link => link.classList.remove('active'));
            if (elements.introLink) elements.introLink.classList.add('active');
            showOnlyIntroduction();
        }

        function animateTitle() {
            elements.mainTitle.classList.add('title-click');
            setTimeout(() => elements.mainTitle.classList.remove('title-click'), 300);
        }

        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function showOnlyIntroduction() {
            elements.sections.forEach(section => {
                section.style.display = section.id === 'introduzione' ? 'block' : 'none';
            });
        }

        function debounceSearch() {
            clearTimeout(state.searchTimeout);
            state.searchTimeout = setTimeout(searchContent, 300);
        }

        function handleNavigation(e) {
            e.preventDefault();
            const targetId = e.currentTarget.getAttribute('href').substring(1);
            elements.navLinks.forEach(link => link.classList.remove('active'));
            e.currentTarget.classList.add('active');
            elements.sections.forEach(section => {
                section.style.display = section.id === targetId ? 'block' : 'none';
            });
        }

        function setupMobileMenu() {
            elements.mobileMenu.addEventListener('click', () => {
                elements.sidebar.classList.toggle('active');
                elements.mobileMenu.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!elements.sidebar.contains(e.target) && !elements.mobileMenu.contains(e.target)) {
                    elements.sidebar.classList.remove('active');
                    elements.mobileMenu.classList.remove('active');
                }
            });
        }

        function handleKeyboardEvents(e) {
            if (e.key === 'Escape') {
                resetSearchAndNavigation();
            } else if (e.key === 'Enter' && elements.search === document.activeElement) {
                searchContent();
            }
        }

        function resetAllSections() {
            elements.sections.forEach((section, index) => {
                resetSection(section);
                section.style.display = index === 0 ? 'block' : 'none';
            });
        }

        function resetSection(section) {
            const originalContent = state.originalContents.get(section);
            if (originalContent) {
                section.innerHTML = originalContent;
            }
        }

        function searchContent() {
            try {
                const query = elements.search.value.trim();
                const normalizedQuery = cleanAndNormalizeText(query);
                
                if (normalizedQuery === searchState.lastQuery) return;
                searchState.lastQuery = normalizedQuery;
                searchState.isSearching = true;

                elements.sections.forEach(section => resetSection(section));
                if (!query) {
                    elements.sections.forEach((section, index) => {
                        section.style.display = index === 0 ? 'block' : 'none';
                    });
                    return;
                }

                let foundResults = false;
                const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

                elements.sections.forEach(section => {
                    const sectionText = section.textContent.toLowerCase();
                    const matchesAllTerms = searchTerms.every(term => sectionText.includes(term));

                    if (matchesAllTerms) {
                        section.style.display = 'block';
                        foundResults = true;
                        section.innerHTML = highlightText(section, searchTerms);
                        
                        // Gestione migliorata della rimozione highlight
                        setTimeout(() => {
                            const highlights = section.querySelectorAll('.search-highlight');
                            highlights.forEach(highlight => {
                                const text = highlight.textContent;
                                const parent = highlight.parentNode;
                                
                                // Aggiungiamo la classe per la transizione
                                highlight.classList.add('search-highlight-fade');
                                
                                // Dopo la transizione, ripristiniamo il testo normale
                                setTimeout(() => {
                                    const textNode = document.createTextNode(text);
                                    parent.replaceChild(textNode, highlight);
                                    
                                    // Normalizziamo il nodo per unire eventuali nodi di testo adiacenti
                                    parent.normalize();
                                }, 300); // Tempo della transizione CSS
                            });
                        }, 5000); // Durata dell'highlight
                    } else {
                        section.style.display = 'none';
                    }
                });

                // Aggiungiamo tracciamento degli highlight attivi
                searchState.activeHighlights = document.querySelectorAll('.search-highlight');
                
                // Aggiungiamo scroll al primo risultato se trovato
                if (foundResults) {
                    const firstResult = document.querySelector('.search-highlight');
                    if (firstResult) {
                        firstResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }

            } catch (error) {
                console.error('Errore nella ricerca:', error);
                showNotification('Si è verificato un errore durante la ricerca');
            } finally {
                searchState.isSearching = false;
            }
        }

        function highlightText(section, searchTerms) {
            const originalContent = state.originalContents.get(section);
            if (!originalContent) return section.innerHTML;

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = originalContent;

            searchTerms.forEach(term => {
                if (!term) return;

                const walker = document.createTreeWalker(
                    tempDiv,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                const nodes = [];
                let node;
                while (node = walker.nextNode()) {
                    nodes.push(node);
                }

                nodes.forEach(textNode => {
                    const text = textNode.textContent;
                    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');

                    if (regex.test(text)) {
                        const span = document.createElement('span');
                        span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                        textNode.parentNode.replaceChild(span, textNode);
                    }
                });
            });

            return tempDiv.innerHTML;
        }

        function showNotification(message, type = 'info') {
            const existingNotification = document.querySelector('.search-notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            const notification = document.createElement('div');
            notification.className = 'search-notification';
            notification.dataset.type = type; // Per styling differente basato sul tipo
            notification.setAttribute('role', 'alert'); // Per accessibilità

            const icon = document.createElement('i');
            icon.className = 'fas fa-search';

            const text = document.createElement('span');
            const [fixedText, query] = message.split(': ');
            text.innerHTML = `${fixedText}: <em>"${query}"</em>`;

            notification.appendChild(icon);
            notification.appendChild(text);

            document.body.appendChild(notification);

            notification.offsetHeight;

            notification.classList.add('show');

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }
            }, 4000);
        }

        window.addEventListener('beforeunload', () => {
            try {
                searchState.resetSearch();
                elements.sections.forEach(section => resetSection(section));
                state.originalContents = null;
            } catch (error) {
                console.warn('Errore durante il cleanup:', error);
            }
        });

        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function cleanAndNormalizeText(text) {
            return text.toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .trim();
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

    } catch (error) {
        console.error('Errore critico nell\'inizializzazione:', error);
    }
});
