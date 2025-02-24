document.addEventListener('DOMContentLoaded', () => {
    try {
        const searchInput = document.getElementById('search');
        const sections = document.querySelectorAll('.section-content');
        let searchTimeout;
        let notificationTimeout;
        let originalContents = new WeakMap(); // Usando WeakMap per migliore gestione della memoria

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
            try {
                clearTimeout(notificationTimeout);
                const existingNotification = document.querySelector('.search-notification');
                if (existingNotification) {
                    existingNotification.remove();
                }

                const notification = document.createElement('div');
                notification.className = 'search-notification';
                notification.textContent = message;
                document.body.appendChild(notification);

                notificationTimeout = setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 5000);
            } catch (error) {
                console.warn('Errore nella notifica:', error);
            }
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
