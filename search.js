document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inizializzazione elementi
        const searchInput = document.getElementById('search');
        const sections = document.querySelectorAll('.section-content');
        const mainTitle = document.querySelector('.sidebar-logo');
        const navLinks = document.querySelectorAll('.nav-link');
        const introLink = document.querySelector('a[href="#introduzione"]');
        const mobileMenu = document.getElementById('mobile-menu');
        const sidebar = document.querySelector('.sidebar');
        const themeToggle = document.getElementById('theme-toggle');
        const html = document.documentElement;
        const themeIcon = themeToggle.querySelector('i');
        
        let searchTimeout;
        let originalContents = new WeakMap();

        // All'inizio, nascondi tutte le sezioni tranne la prima
        sections.forEach((section, index) => {
            section.style.display = index === 0 ? 'block' : 'none';
            originalContents.set(section, section.innerHTML);
        });

        // Gestione click sul logo/titolo
        mainTitle.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Reset ricerca e highlights
            searchInput.value = '';
            document.querySelectorAll('.search-highlight').forEach(el => {
                el.classList.add('search-highlight-fade');
            });
            
            // Reset navigazione
            navLinks.forEach(link => link.classList.remove('active'));
            if (introLink) introLink.classList.add('active');
            
            // Mostra solo introduzione
            sections.forEach(section => {
                section.style.display = section.id === 'introduzione' ? 'block' : 'none';
            });
            
            // Animazione click
            mainTitle.classList.add('title-click');
            setTimeout(() => mainTitle.classList.remove('title-click'), 300);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Gestione tema
        themeToggle.addEventListener('click', () => {
            if (html.getAttribute('data-theme') === 'light') {
                html.setAttribute('data-theme', 'dark');
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            } else {
                html.setAttribute('data-theme', 'light');
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            }
        });

        // Gestione menu mobile
        if (mobileMenu) {
            mobileMenu.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                mobileMenu.classList.toggle('active');
            });

            // Chiudi sidebar al click fuori
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !mobileMenu.contains(e.target)) {
                    sidebar.classList.remove('active');
                    mobileMenu.classList.remove('active');
                }
            });
        }

        // Gestione link navigazione
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                
                // Aggiorna stato attivo
                document.querySelector('.nav-link.active')?.classList.remove('active');
                link.classList.add('active');
                
                // Mostra sezione corretta
                sections.forEach(section => {
                    section.style.display = section.id === targetId ? 'block' : 'none';
                });
            });
        });

        // Inizializzazione sicura
        if (!searchInput || !sections.length) {
            console.warn('Elementi di ricerca non trovati');
            return;
        }

        // Salva il contenuto originale in modo sicuro
        sections.forEach(section => {
            try {
                originalContents.set(section, section.innerHTML);
            } catch (error) {
                console.warn('Errore nel salvare il contenuto originale:', error);
            }
        });

        function resetSection(section) {
            try {
                const originalContent = originalContents.get(section);
                if (originalContent) {
                    section.innerHTML = originalContent;
                }
            } catch (error) {
                console.warn('Errore nel reset della sezione:', error);
            }
        }

        function showNotification(message) {
            const existingNotification = document.querySelector('.search-notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            const notification = document.createElement('div');
            notification.className = 'search-notification';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-search';
            
            const text = document.createElement('span');
            // Separa il messaggio in due parti: il testo fisso e la query
            const [fixedText, query] = message.split(': ');
            text.innerHTML = `${fixedText}: <em>"${query}"</em>`;
            
            notification.appendChild(icon);
            notification.appendChild(text);
            
            document.body.appendChild(notification);
            
            // Forza un reflow
            notification.offsetHeight;
            
            notification.classList.add('show');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }
            }, 4000);
        }

        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function highlightText(section, searchTerms) {
            try {
                const originalContent = originalContents.get(section);
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
                        const regex = new RegExp(`(${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
                        
                        if (regex.test(text)) {
                            const span = document.createElement('span');
                            span.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                            textNode.parentNode.replaceChild(span, textNode);
                        }
                    });
                });

                return tempDiv.innerHTML;
            } catch (error) {
                console.warn('Errore nell\'highlighting:', error);
                return section.innerHTML;
            }
        }

        function searchContent() {
            try {
                const query = searchInput.value.trim();

                // Reset all sections to their original content
                sections.forEach(section => {
                    resetSection(section);
                });

                if (!query) {
                    sections.forEach((section, index) => {
                        section.style.display = index === 0 ? 'block' : 'none';
                    });
                    return;
                }

                let foundResults = false;
                const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

                sections.forEach(section => {
                    const sectionText = section.textContent.toLowerCase();
                    const matchesAllTerms = searchTerms.every(term => sectionText.includes(term));

                    if (matchesAllTerms) {
                        section.style.display = 'block';
                        foundResults = true;
                        section.innerHTML = highlightText(section, searchTerms);
                        
                        // Rimuovi l'highlight dopo 5 secondi
                        setTimeout(() => {
                            const highlights = section.querySelectorAll('.search-highlight');
                            highlights.forEach(highlight => {
                                highlight.classList.add('search-highlight-fade');
                            });
                        }, 5000);
                    } else {
                        section.style.display = 'none';
                    }
                });

                if (!foundResults) {
                    sections[0].style.display = 'block';
                    showNotification('Nessun risultato trovato per: ' + query);
                }
            } catch (error) {
                console.error('Errore nella ricerca:', error);
                resetAllSections();
            }
        }

        function resetAllSections() {
            sections.forEach((section, index) => {
                try {
                    resetSection(section);
                    section.style.display = index === 0 ? 'block' : 'none';
                } catch (error) {
                    console.warn('Errore nel reset generale:', error);
                }
            });
        }

        // Event Listeners con gestione errori
        searchInput.addEventListener('input', () => {
            try {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(searchContent, 300);
            } catch (error) {
                console.warn('Errore nell\'input search:', error);
            }
        });

        document.addEventListener('keydown', (e) => {
            try {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    resetAllSections();
                    searchInput.blur();
                }
            } catch (error) {
                console.warn('Errore nella gestione ESC:', error);
            }
        });

        // Cleanup sicuro
        window.addEventListener('beforeunload', () => {
            try {
                sections.forEach(section => resetSection(section));
                originalContents = null;
            } catch (error) {
                console.warn('Errore nel cleanup:', error);
            }
        });

    } catch (error) {
        console.error('Errore critico nell\'inizializzazione:', error);
    }
});
