document.addEventListener('DOMContentLoaded', function() {
  // Determine and show the initial page.
  // The checkUrlHash function is primarily for handling potential story hashes on load.
  checkUrlHashForStories();
  
  const activePage = document.querySelector('.page-content.active');
  if (!activePage && !window.location.hash) { // If no page is active and no hash
    showPage('acasa');
  } else if (!activePage && window.location.hash && !getStoryContent(window.location.hash.substring(1), true)) {
    // If there's a hash but it's not a story and no page is active, default to acasa and clear bad hash
    showPage('acasa');
    history.replaceState("", document.title, window.location.pathname + window.location.search);
  }

  // Unified click handler for all navigation elements
  const navElements = document.querySelectorAll('.menu-button, .footer-link[data-option], .cta-button[data-option], .internal-link[data-option]');
  navElements.forEach(element => {
    element.addEventListener('click', function(e) {
      const option = this.getAttribute('data-option');
      if (option) {
        if (this.tagName === 'A' && (this.getAttribute('href') === '#' || this.getAttribute('href').startsWith('#'))) {
          e.preventDefault();
        }
        showPage(option);
        if (!getStoryContent(option, true)) {
             window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  });

  // Specific handler for story links in the .stories-grid
  const storyLinks = document.querySelectorAll('.stories-grid .story-link');
  storyLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const storyId = this.closest('.story-card')?.getAttribute('data-story-id') || this.getAttribute('href').substring(1);
      if (storyId && getStoryContent(storyId, true)) {
        if (window.location.hash.substring(1) !== storyId) {
             history.pushState(null, null, '#' + storyId);
        }
        openStoryModal(storyId);
      } else if (storyId) {
        console.warn("Attempted to open story modal for non-existent story:", storyId);
      }
    });
  });

  // Handlers for closing the modal
  const closeModalButton = document.querySelector('.close-modal');
  if(closeModalButton) {
    closeModalButton.addEventListener('click', function() {
        closeStoryModal();
    });
  }

  const modal = document.getElementById('story-modal');
  if(modal) {
    modal.addEventListener('click', function(e) { // Close on click outside
      if (e.target === modal) {
        closeStoryModal();
      }
    });
    window.addEventListener('keydown', function(e) { // Close on Escape
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeStoryModal();
        }
    });
  }

  // Form submission handler
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      console.log('Form data submitted (simulated):', data);
      alert('Mesajul a fost trimis (simulare)! Vă mulțumim.');
      form.reset();
    });
  });

  // Listen for hash changes (e.g., browser back/forward buttons)
  window.addEventListener('hashchange', checkUrlHashForStories);

}); // END OF DOMContentLoaded

/**
 * Shows the specified page content and hides others.
 */
function showPage(pageId) {
  const allPages = document.querySelectorAll('.page-content');
  allPages.forEach(page => page.classList.remove('active'));

  const selectedPage = document.getElementById(`${pageId}-content`);
  const knownPages = ['acasa', 'povesti', 'despre', 'servicii', 'cum-functioneaza', 'contact', 'privacy', 'terms'];

  if (selectedPage) {
    selectedPage.classList.add('active');
  } else if (knownPages.includes(pageId)) {
    console.warn(`Page content for ID "${pageId}-content" not found in HTML. Defaulting to acasa.`);
    const acasaContent = document.getElementById('acasa-content');
    if (acasaContent) acasaContent.classList.add('active');
  } else {
    console.warn(`Unknown pageId "${pageId}" in showPage. Defaulting to acasa if no page is active.`);
    if(!document.querySelector('.page-content.active')) {
        const acasaContent = document.getElementById('acasa-content');
        if (acasaContent) acasaContent.classList.add('active');
    }
  }

  // Update active state for navigation buttons
  const allNavButtons = document.querySelectorAll('.menu-button, .footer-link[data-option]');
  allNavButtons.forEach(button => {
    const buttonOption = button.getAttribute('data-option');
    const modalActiveStoryId = document.getElementById('story-modal').style.display === 'block' ? 
                                window.location.hash.substring(1) : null;
    if (modalActiveStoryId && getStoryContent(modalActiveStoryId,true)) {
        button.classList.toggle('active', buttonOption === 'povesti');
    } else {
        button.classList.toggle('active', buttonOption === pageId);
    }
  });
}

/**
 * Opens the story modal with content for the given storyId.
 */
function openStoryModal(storyId) {
  showPage('povesti'); 

  const modal = document.getElementById('story-modal');
  const modalContent = document.getElementById('story-modal-content');
  const storyHtml = getStoryContent(storyId);

  if (modal && modalContent && storyHtml && storyHtml.indexOf("nu a fost găsită") === -1) {
    modalContent.innerHTML = storyHtml;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
  } else {
    console.warn(`Story content for ID "${storyId}" not found or error. Modal not opened.`);
    if (window.location.hash.substring(1) === storyId) {
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  }
}

/**
 * Closes the story modal.
 */
function closeStoryModal() {
  const modal = document.getElementById('story-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  document.body.style.overflow = 'auto';

  const currentHash = window.location.hash.substring(1);
  if (currentHash && getStoryContent(currentHash, true)) {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }

  showPage('povesti');
}

/**
 * Checks URL hash on page load or hash change for story deep linking.
 */
function checkUrlHashForStories() {
  const hash = window.location.hash.substring(1);
  if (hash && getStoryContent(hash, true)) {
    openStoryModal(hash);
  } else if (hash) {
    console.warn(`Non-story hash "${hash}" found. Clearing it.`);
    history.replaceState("", document.title, window.location.pathname + window.location.search);
    if (!document.querySelector('.page-content.active')) {
        showPage('acasa');
    }
  }
}

/**
 * Retrieves the HTML content by finding the BEST (longest) matching story ID.
 * This correctly handles specific IDs like 'name-1923' vs 'name-1964'.
 * @param {string} storyId - The ID of the story from the URL hash.
 * @param {boolean} [checkOnly=false] - If true, returns boolean indicating existence.
 * @returns {string|boolean} HTML string for the story or boolean if checkOnly.
 */
function getStoryContent(storyId, checkOnly = false) {
  const storyImages = {
    "ioan-muresan": "https://via.placeholder.com/400x250/cccccc/555555?text=Ioan+Muresan",
    // Make sure to have images for your new, specific keys
    "elena-crisan-1923": "https://via.placeholder.com/400x250/cccccc/555555?text=Elena+Crisan+1923",
    "elena-crisan-1964": "https://via.placeholder.com/400x250/cccccc/555555?text=Elena+Crisan+1964",
    "dumitru-iancu": "https://via.placeholder.com/400x250/cccccc/555555?text=Dumitru+Iancu",
    "maria-avram": "https://via.placeholder.com/400x250/cccccc/555555?text=Maria+Avram"
  };
  const stories = {
    // IMPORTANT: Use unique keys for each person
    "ioan-muresan": `
      <div>
        <h2>Ioan Mureșan (1935-2023)</h2>
        <img src="${storyImages['ioan-muresan']}" alt="Ioan Mureșan" style="width:100%;max-width:400px;height:auto;margin-bottom:1rem;border-radius:8px;">
        <p>O viață dedicată educației și comunității. A fost un profesor iubit, un mentor pentru mulți și un stâlp al cunoașterii în orașul său natal. Pasiunea sa pentru matematică a inspirat generații de elevi să exploreze frumusețea numerelor și logicii.</p>
      </div>
    `,
    "elena-crisan-1923": `
      <div>
        <h2>Elena Crișan (1923 - 2010)</h2>
        <img src="${storyImages['elena-crisan-1923']}" alt="Elena Crișan (1923)" style="width:100%;max-width:400px;height:auto;margin-bottom:1rem;border-radius:8px;">
        <p>This is the story for the Elena Crișan born in 1923. Her life was marked by her work as a librarian and her love for classic literature...</p>
      </div>
    `,
    "elena-crisan-1964": `
      <div>
        <h2>Elena Crișan (1964 - 2024)</h2>
        <img src="${storyImages['elena-crisan-1964']}" alt="Elena Crișan (1964)" style="width:100%;max-width:400px;height:auto;margin-bottom:1rem;border-radius:8px;">
        <p>This is the story for the DIFFERENT Elena Crișan born in 1964. An avid mountaineer and community volunteer, she inspired many with her adventurous spirit...</p>
      </div>
    `,
    "dumitru-iancu": `
      <div>
        <h2>Dumitru Iancu (1958-2022)</h2>
        <img src="${storyImages['dumitru-iancu']}" alt="Dumitru Iancu" style="width:100%;max-width:400px;height:auto;margin-bottom:1rem;border-radius:8px;">
        <p>Un inginer constructor pasionat, Dumitru Iancu a lăsat în urmă nu doar structuri solide, ci și o amprentă de neșters în inimile celor care l-au cunoscut.</p>
      </div>
    `,
    "maria-avram": `
      <div>
        <h2>Maria Avram (1927-2020)</h2>
        <img src="${storyImages['maria-avram']}" alt="Maria Avram" style="width:100%;max-width:400px;height:auto;margin-bottom:1rem;border-radius:8px;">
        <p>Povestea Mariei Avram este una a supraviețuirii, a demnității și a speranței neclintite în fața greutăților istoriei.</p>
      </div>
    `
  };
  
  const validStoryKeys = Object.keys(stories);
  
  // 1. Find ALL keys that the URL hash starts with.
  const possibleMatches = validStoryKeys.filter(key => storyId.startsWith(key));
  
  // 2. If there are matches, sort them by length from longest to shortest.
  if (possibleMatches.length > 0) {
    possibleMatches.sort((a, b) => b.length - a.length);
    
    // 3. The first item in the sorted list is the best, most specific match.
    const bestMatchKey = possibleMatches[0];
    
    if (checkOnly) {
      return true;
    }
    return stories[bestMatchKey];
  }

  // If no key matches, return the "not found" message.
  if (checkOnly) {
    return false;
  }
  return "<p>Povestea nu a fost găsită. Vă rugăm să verificați ID-ul poveștii.</p>";
}
