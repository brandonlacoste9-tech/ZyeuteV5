/**
 * ZYEUTÉ DESKTOP - Creator Studio App Logic
 */

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const pageTitle = document.querySelector('.page-title');
const uploadBtn = document.getElementById('uploadBtn');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const dropZone = document.getElementById('dropZone');
const startLiveBtn = document.getElementById('startLiveBtn');

// Navigation
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    
    // Update active nav
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    
    // Show section
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Update title
    const titles = {
      dashboard: 'Dashboard',
      content: 'Content',
      upload: 'Upload Video',
      analytics: 'Analytics',
      live: 'Live Studio',
      comments: 'Comments'
    };
    pageTitle.textContent = titles[section] || 'Dashboard';
  });
});

// Upload functionality
if (uploadBtn) {
  uploadBtn.addEventListener('click', () => {
    // Switch to upload section
    navItems.forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-section="upload"]').classList.add('active');
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById('upload-section').classList.add('active');
    pageTitle.textContent = 'Upload Video';
  });
}

if (selectFilesBtn) {
  selectFilesBtn.addEventListener('click', async () => {
    if (window.electronAPI) {
      const filePath = await window.electronAPI.selectVideo();
      if (filePath) {
        console.log('Selected file:', filePath);
        // Handle file selection
        alert(`Selected: ${filePath}`);
      }
    } else {
      // Web fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          console.log('Selected file:', file.name);
          alert(`Selected: ${file.name}`);
        }
      };
      input.click();
    }
  });
}

// Drag and drop
if (dropZone) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropZone.style.borderColor = 'rgba(255, 191, 0, 0.6)';
    dropZone.style.backgroundColor = 'rgba(255, 191, 0, 0.05)';
  }

  function unhighlight() {
    dropZone.style.borderColor = 'rgba(255, 191, 0, 0.3)';
    dropZone.style.backgroundColor = '';
  }

  dropZone.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  function handleFiles(files) {
    if (files.length > 0) {
      const file = files[0];
      console.log('Dropped file:', file.name);
      alert(`Ready to upload: ${file.name}`);
    }
  }
}

// Live streaming
let isLive = false;
if (startLiveBtn) {
  startLiveBtn.addEventListener('click', () => {
    isLive = !isLive;
    if (isLive) {
      startLiveBtn.innerHTML = '<span class="live-dot"></span> End Live';
      startLiveBtn.style.background = '#333';
      alert('Going live! (Demo mode)');
    } else {
      startLiveBtn.innerHTML = '<span class="live-dot"></span> Go Live';
      startLiveBtn.style.background = '';
      alert('Stream ended');
    }
  });
}

// Menu event listeners (from main process)
if (window.electronAPI) {
  window.electronAPI.onMenuUploadVideo(() => {
    navItems.forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-section="upload"]').classList.add('active');
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById('upload-section').classList.add('active');
    pageTitle.textContent = 'Upload Video';
  });

  window.electronAPI.onMenuNewProject(() => {
    console.log('New project clicked');
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Zyeute Studio loaded! 🐝⚜️');
  
  // Check if running in Electron
  if (window.electronAPI) {
    console.log('Running in Electron');
    console.log('Platform:', window.appInfo?.platform);
  } else {
    console.log('Running in browser');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + U for upload
  if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
    e.preventDefault();
    if (uploadBtn) uploadBtn.click();
  }
  
  // Cmd/Ctrl + 1-4 for sections
  if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
    e.preventDefault();
    const index = parseInt(e.key) - 1;
    const navs = Array.from(navItems);
    if (navs[index]) {
      navs[index].click();
    }
  }
});
