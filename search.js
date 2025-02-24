document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const sections = document.querySelectorAll('.section-content');
    let searchTimeout;
    let notificationTimeout;
    let originalContents = new Map();

    // Salva il contenuto originale di tutte le sezioni
    sections.forEach(section => {
        originalContents.set(section, section.innerHTML);
    });

    function resetSection(section) {
        section.innerHTML = originalContents.get(section);
    }

    function showNotification(message) {
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
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightText(section, searchTerms) {
        const container = document.createElement('div');
        container.innerHTML = originalContents.get(section);

        // Funzione ricorsiva per attraversare e modificare i nodi di testo
        function processNode(node) {
            if (node.nodeType === 3) { // Nodo testo
                let content = node.textContent;
                let highlighted = false;
                
                searchTerms.forEach(term => {
                    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
                    if (regex.test(content.toLowerCase())) {
                        content = content.replace(regex, '<mark class="search-highlight">$1</mark>');
                        highlighted = true;
                    }
                });

                if (highlighted) {
                    const span = document.createElement('span');
                    span.innerHTML = content;
                    node.parentNode.replaceChild(span, node);
                }
            } else if (node.nodeType === 1) { // Elemento
                Array.from(node.childNodes).forEach(processNode);
            }
        }

        Array.from(container.childNodes).forEach(processNode);
        return container.innerHTML;
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
            console.error('Error in searchContent:', error);
            sections.forEach((section, index) => {
                resetSection(section);
                section.style.display = index === 0 ? 'block' : 'none';
            });
        }
    }

    // Gestione eventi con debounce
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(searchContent, 300);
    });

    // Gestione tasto ESC e reset
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            sections.forEach((section, index) => {
                resetSection(section);
                section.style.display = index === 0 ? 'block' : 'none';
            });
            searchInput.blur();
        }
    });

    // Cleanup quando si lascia la pagina
    window.addEventListener('beforeunload', () => {
        sections.forEach(section => resetSection(section));
        originalContents.clear();
    });
});
