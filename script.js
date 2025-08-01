document.addEventListener('DOMContentLoaded', function() {
  // ======================== DOM REFERENCES ========================
  const terminalContainer = document.querySelector('.container');
  const appIcon = document.getElementById('app-icon');
  const redDot = document.getElementById('red-dot');
  const content = document.querySelector('.content');
  const tabsContainer = document.querySelector('.tabs-container');
  const ContainerTitle = document.querySelector('.container-title');
  const dockAppIcon = document.getElementById('dock-terminal');
  const dockRedDot = document.getElementById('dock-terminal-red-dot');
  const dock = document.querySelector('.dock');
  const themeSelector = document.getElementById('theme-selector');
  const dockGithub = document.getElementById('dock-github');
  
  // ======================== APP STATE ========================
  const state = {
    isMaximized: false,
    isMinimized: true,
    isClosed: false,
    originalContent: content.innerHTML,
    minimizedContent: content.innerHTML,
    minimizedTitle: ContainerTitle.textContent,
    currentLanguage: localStorage.getItem('language') || 'vi'
  };

  // ======================== INITIALIZATION ========================
  function initialize() {
    if (window.innerWidth <= 450) {
        document.querySelector('.gnome-bar').style.display = 'none';
      }
    
    ContainerTitle.textContent = 'VanDung-dev@manjaro: ~/profile';
    initTheme();
    
    const savedLang = localStorage.getItem('language') || 'vi';
    setLanguage(savedLang);
    
    terminalContainer.style.display = 'block';
    terminalContainer.classList.add('restore');
    
    appIcon.style.display = 'none';
    redDot.style.display = 'none';
    redDot.classList.remove('visible');
    dockRedDot.style.display = 'none';
    dockRedDot.classList.remove('visible');
    
    dock.classList.add('hidden');
    
    state.isMinimized = false;
    state.isClosed = false;
    
    setTimeout(() => {
      terminalContainer.classList.remove('restore');
      startTypingAll();
    }, 300);
    
    setupEventListeners();
    updateClock();
    setInterval(updateClock, 60000);
  }

  // ======================== EVENT HANDLERS ========================
  function setupEventListeners() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });

    document.querySelector('.minimize')?.addEventListener('click', minimizeTerminal);
    document.querySelector('.maximize')?.addEventListener('click', toggleMaximize);
    document.querySelector('.close')?.addEventListener('click', closeTerminal);
    document.querySelector('.resize-handle')?.addEventListener('mousedown', initResize);

    if (!isMobileDevice()) {
      document.querySelector('.terminal-header').addEventListener('mousedown', startDrag);
    }
    
    appIcon.addEventListener('click', handleAppIconClick);

    dockAppIcon?.addEventListener('click', handleAppIconClick);

    document.querySelector('.language-toggle')?.addEventListener('click', toggleLanguage);

    document.querySelectorAll('.avatar img').forEach(img => {
      img.addEventListener('error', handleAvatarError);
    });

    themeSelector?.addEventListener('click', toggleThemePopup);

    dockGithub?.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://github.com/VanDung-dev', '_blank', 'noopener,noreferrer');
    });

    document.querySelectorAll('a[href^="http"]').forEach(link => {
      link.addEventListener('click', (e) => {
        if (link.target !== '_blank') {
          e.preventDefault();
          window.open(link.href, '_blank', 'noopener,noreferrer');
        }
      });
    });
  }

  // ======================== SYSTEM FUNCTIONS ========================
  function updateClock() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
    
    clockElement.innerHTML = `${dateString} &nbsp; ${timeString}`;
  }
  
  // ======================== TERMINAL CONTROLS ========================
  function minimizeTerminal() {
    state.minimizedContent = content.innerHTML;
    state.minimizedTitle = ContainerTitle.textContent;
    
    terminalContainer.classList.add('minimized');
    setTimeout(() => {
      terminalContainer.style.display = 'none';
      terminalContainer.classList.remove('minimized');
      
      appIcon.style.display = 'flex';
      redDot.style.display = 'block';
      redDot.classList.add('visible');
      dockRedDot.style.display = 'block';
      dockRedDot.classList.add('visible');

      dock.classList.remove('hidden');

      state.isMinimized = true;
    }, 300);
  }

  function toggleMaximize() {
    const gnomeBarHeight = 40;
    const gnomeBarOffset = 5;
    const isMobile = window.innerWidth <= 450;

    if (!state.isMaximized) {
      terminalContainer.classList.add('maximized');
      if (isMobile) {
        Object.assign(terminalContainer.style, {
          width: '100vw',
          height: '100vh',
          borderRadius: '0',
          position: 'fixed',
          top: 'auto',
          left: 'auto'
        });
      } else {
        Object.assign(terminalContainer.style, {
          width: '100vw',
          height: `calc(100vh - ${gnomeBarHeight + gnomeBarOffset}px)`,
          maxWidth: '100%',
          borderRadius: '0',
          position: 'fixed',
          top: `${gnomeBarHeight}px`,
          left: 'auto',
          zIndex: '1000'
        });
      }
    } else {
      terminalContainer.classList.remove('maximized');
      Object.assign(terminalContainer.style, {
        width: '80vw',
        height: '80vh',
        maxWidth: '1200px',
        borderRadius: '12px',
        position: 'relative',
        top: 'auto',
        left: 'auto',
        zIndex: '1'
      });
    }
    state.isMaximized = !state.isMaximized;
  }

  function closeTerminal() {
    terminalContainer.classList.add('closed');
    setTimeout(() => {
      terminalContainer.style.display = 'none';
      terminalContainer.classList.remove('closed');
      
      redDot.style.display = 'none';
      redDot.classList.remove('visible');
      dockRedDot.style.display = 'none';
      dockRedDot.classList.remove('visible');
      
      content.innerHTML = createTerminalInputHTML();
      tabsContainer.style.display = 'none';
      ContainerTitle.textContent = 'VanDung-dev@manjaro';
      
      appIcon.style.display = 'flex';

      dock.classList.remove('hidden');

      state.isClosed = true;
      state.isMinimized = false;
    }, 300);
  }

  // ======================== RESIZE FUNCTIONALITY ========================
  function initResize(e) {
    e.preventDefault();

    // Thêm class resizing khi bắt đầu thay đổi kích thước
    terminalContainer.classList.add('resizing');

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = parseInt(document.defaultView.getComputedStyle(terminalContainer).width, 10);
    const startHeight = parseInt(document.defaultView.getComputedStyle(terminalContainer).height, 10);

    function resize(e) {
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);

      // Giới hạn kích thước tối thiểu
      const minWidth = 400;
      const minHeight = 300;

      if (newWidth >= minWidth) {
        terminalContainer.style.width = `${newWidth}px`;
      }

      if (newHeight >= minHeight) {
        terminalContainer.style.height = `${newHeight}px`;
      }
    }

    function stopResize() {
      // Xóa class resizing khi kết thúc thay đổi kích thước
      terminalContainer.classList.remove('resizing');
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    }

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  }

  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  window.addEventListener('resize', debounce(function() {
    if (window.innerWidth <= 450) {
      document.querySelector('.gnome-bar').style.display = 'none';
    } else {
      document.querySelector('.gnome-bar').style.display = 'flex';
    }
  }, 100));

  function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
      const context = this;
      const args = arguments;
      if (!lastRan) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function() {
          if ((Date.now() - lastRan) >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }

  window.addEventListener('resize', throttle(function() {
    if (window.innerWidth <= 450) {
      document.querySelector('.gnome-bar').style.display = 'none';
    } else {
      document.querySelector('.gnome-bar').style.display = 'flex';
    }
  }, 100));

  // ======================== APP ICON CONTROLS ========================
  function handleAppIconClick() {
    if (state.isClosed) openTerminal();
    else if (state.isMinimized) restoreTerminal();
    else minimizeTerminal();
  }

  function openTerminal() {
    initLazyLoading()
    appIcon.style.display = 'none';
    terminalContainer.style.display = 'block';
    terminalContainer.classList.add('restore');

    dock.classList.add('hidden');
    
    setTimeout(() => {
      terminalContainer.classList.remove('restore');
      content.innerHTML = createTerminalInputHTML();
      tabsContainer.style.display = 'none';
      ContainerTitle.textContent = 'VanDung-dev@manjaro';
      
      const input = content.querySelector('.terminal-input');
      if (input) {
        setupCursor(input);
        input.addEventListener('keydown', handleTerminalInput);
        input.focus();
      }

      state.isClosed = false;
      state.isMinimized = false;
    }, 300);
  }

  function restoreTerminal() {
    initLazyLoading()
    appIcon.style.display = 'none';
    redDot.style.display = 'none';
    redDot.classList.remove('visible');
    dockRedDot.style.display = 'none';
    dockRedDot.classList.remove('visible');
    
    terminalContainer.style.display = 'block';
    terminalContainer.classList.add('restore');

    dock.classList.add('hidden');
    
    setTimeout(() => {
      terminalContainer.classList.remove('restore');
      
      if (state.minimizedContent) {
        content.innerHTML = state.minimizedContent;
        ContainerTitle.textContent = state.minimizedTitle;
        tabsContainer.style.display = state.minimizedTitle.includes('profile') ? 'flex' : 'none';
        startTypingAll();
      }
      
      state.isMinimized = false;
    }, 300);
  }

  // ======================== TERMINAL CONTENT ========================
  function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  }

  function isValidCommand(command) {
    // Chỉ cho phép các ký tự an toàn
    const safeChars = /^[a-zA-Z0-9\s\-_\/\.\?\&\=\+\*\@\#\!\,:;'"\(\)\{\}\[\]\^\$\|~`]+$/;
    return safeChars.test(command) && command.length <= 100;
  }

  function handleError(error, context = '') {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  }


  function createTerminalInputHTML() {
    return state.currentLanguage === 'vi' 
      ? createTerminalInputHTML_vi() 
      : createTerminalInputHTML_en();
  }

  function createTerminalInputHTML_vi() {
    return `
      <div class="content-section active" id="empty-content">
        <div class="output">
          <div class="output-line">
            <div class="zsh-unified">
              <span class="zsh-icon manjaro-icon-bg">
                <i class="nf nf-linux-manjaro"></i>
              </span>
              <span class="zsh-file manjaro-file-bg">
                <i class="nf nf-fa-home"></i>~
              </span>
            </div>
            <div class="input-container">
              <span class="input-prompt"></span>
              <input type="text" class="terminal-input" placeholder="cd profile/ hoặc help" autofocus>
              <span class="custom-cursor"></span>
            </div>
          </div>
          <div class="command-output"></div>
        </div>
      </div>`;
  }

  function createTerminalInputHTML_en() {
  return `
    <div class="content-section active" id="empty-content">
      <div class="output">
        <div class="output-line">
          <div class="zsh-unified">
            <span class="zsh-icon manjaro-icon-bg">
              <i class="nf nf-linux-manjaro"></i>
            </span>
            <span class="zsh-file manjaro-file-bg">
              <i class="nf nf-fa-home"></i>~
            </span>
          </div>
          <div class="input-container">
            <span class="input-prompt"></span>
            <input type="text" class="terminal-input" placeholder="cd profile/ or help" autofocus>
            <span class="custom-cursor"></span>
          </div>
        </div>
        <div class="command-output"></div>
      </div>
    </div>`;
  }

  function handleTerminalInput(event) {
    try {
      if (event.key !== 'Enter') return;

      const input = event.target;
      const command = input.value.trim();
      const outputDiv = content.querySelector('.command-output');

      if (!command) return;
      if (!isValidCommand(command)) {
        outputDiv.innerHTML += `<div class="error">Invalid command: contains unsafe characters</div>`;
        input.value = '';
        return;
      }
      try {
        if (command === 'cd profile/') {
          content.innerHTML = state.originalContent;
          tabsContainer.style.display = 'flex';
          ContainerTitle.textContent = 'VanDung-dev@manjaro: ~/profile';

          initLazyLoading();

          const firstTab = document.querySelector('.tab');
          if (firstTab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            firstTab.classList.add('active');

            document.querySelectorAll('.content-section').forEach(section => {
              section.classList.remove('active');
            });

            const section = document.querySelector('.content-section');
            if (section) {
              section.classList.add('active');
              startTypingAll();
            }
          }
        } else if (command === 'neofetch') {
          outputDiv.innerHTML = `
            <div class="neofetch-output">
      ██████████████████  ████████  VanDung-devg@manjaro 
      ██████████████████  ████████  ----------------- 
      ██████████████████  ████████  OS: Manjaro Linux x86_64 
      ██████████████████  ████████  Host: ASUS TUF Gaming A16 FA617NS
      ████████            ████████  Kernel: 6.12.3-1-MANJARO 
      ████████  ████████  ████████  Uptime: 1 hour, 54 mins 
      ████████  ████████  ████████  Packages: 1495 (pacman), 8 (flatpak) 
      ████████  ████████  ████████  Shell: zsh 5.9 
      ████████  ████████  ████████  Resolution: 1920x1080 
      ████████  ████████  ████████  DE: GNOME 48.2 
      ████████  ████████  ████████  WM: Mutter 
      ████████  ████████  ████████  WM Theme: Adwaita 
      ████████  ████████  ████████  Theme: adw-gtk3-dark [GTK2/3] 
      ████████  ████████  ████████  Icons: Papirus-Dark-Maia [GTK2/3] 
                                    Terminal: gnome-terminal 
                                    CPU: AMD Ryzen 7 7735HS with Radeon Graphics (16) @ 4.829GHz 
                                    GPU: AMD ATI Radeon 680M 
                                    GPU: AMD ATI Radeon RX 7600/7600 XT/7600M XT/7600S/7700S / PRO W7600 
                                    Memory: 10969MiB / 31328MiB 
            </div>`;
        } else if (command === 'ls' || command === 'ls -la') {
          outputDiv.innerHTML = `
          <div class="ls-output">
            profile
          </div>`;
        } else if (command === 'clear') {
          outputDiv.innerHTML = '';
        } else if (command === 'python --version') {
          outputDiv.innerHTML = `<div class="python-version-output">Python 3.12.3</div>`;
        } else if (command === 'git status') {
          outputDiv.innerHTML = `
          <div class="git-status-output">
          On branch main<br>
          Your branch is up to date with 'origin/main'.<br>
          No changes to commit, working tree clean.
          </div>`;
        } else if (command === 'sudo pacman -Syu') {
          outputDiv.innerHTML = `<div class="updating-output" id="updating-output"></div>`;
          const updateLines = [
            '[sudo] password for VanDung-dev: ********',
            ':: Synchronizing package databases...',
            ' core downloading...',
            ' extra downloading...',
            ' community downloading...',
            ' multilib downloading...',
            ':: Starting full system upgrade...',
            ' resolving dependencies...',
            ' looking for conflicting packages...',
            ' Packages (5) linux-6.12.34  python-3.12.9  zsh-5.9.1  nano-7.2  git-2.44.0',
            '',
            'Total Download Size:    120.00 MiB',
            'Total Installed Size:   500.00 MiB',
            '',
            ':: Proceed with installation? [Y/n] y',
            ' downloading packages...',
            ' checking keys in keyring...',
            ' checking package integrity...',
            ' loading package files...',
            ' checking for file conflicts...',
            ' checking available disk space...',
            ' installing linux...',
            ' installing python...',
            ' installing zsh...',
            ' installing nano...',
            ' installing git...',
            '',
            ':: Running post-transaction hooks...',
            ' Updating icon theme caches...',
            ' Arming ConditionNeedsUpdate...',
            ' Updating the desktop file MIME type cache...',
            '',
            'System updated successfully!'
          ];
          let idx = 0;
          let lastUpdate = 0;

          function printNextLine(timestamp) {
            if (!lastUpdate) lastUpdate = timestamp;
            const elapsed = timestamp - lastUpdate;
            const minDelay = 200;
            const maxDelay = 500;
            const delay = minDelay + Math.random() * (maxDelay - minDelay);

            if (elapsed >= delay) {
              const output = document.getElementById('updating-output');
              if (!output) return;
              output.innerHTML += updateLines[idx] + '<br>';
              idx++;
              lastUpdate = timestamp;
            }

            if (idx < updateLines.length) {
              const id = requestAnimationFrame(printNextLine);
              animationFrameIds.push(id);
            }
          }

          const id = requestAnimationFrame(printNextLine);
          animationFrameIds.push(id);
        } else if (command === 'help') {
          outputDiv.innerHTML = state.currentLanguage === 'vi'
              ? helpOutputVi()
              : helpOutputEn();
        } else {
          outputDiv.innerHTML += `<div class="error">Command not found: ${escapeHtml(command)}</div>`;
        }
      } catch (error) {
        handleError(error, `executing command: ${command}`);
        outputDiv.innerHTML += `<div class="error">Error executing command: ${escapeHtml(command)}</div>`;
      }

      input.value = '';
      content.scrollTop = content.scrollHeight;
      input.focus();
    } catch (error) {
      handleError(error, 'terminal input handler');
    }
  }

  function helpOutputVi() {
    return `<div class="help-output">
      <strong>Các lệnh có thể dùng:</strong>
      <ul>
        <li><code>cd profile/</code> - Chuyển thư mục profile</li>
        <li><code>ls</code> - Liệt kê file/thư mục</li>
        <li><code>clear</code> - Xóa màn hình terminal</li>
        <li><code>neofetch</code> - Hiện thông tin hệ thống</li>
        <li><code>python --version</code> - Xem phiên bản Python</li>
        <li><code>help</code> - Hiện hướng dẫn này</li>
      </ul>
    </div>`;
  }

  function helpOutputEn() {
    return `<div class="help-output">
      <strong>Available Commands:</strong>
      <ul>
        <li><code>cd</code> - Change directory</li>
        <li><code>ls</code> - List files</li>
        <li><code>clear</code> - Clear the terminal</li>
        <li><code>neofetch</code> - Display system information</li>
        <li><code>python --version</code> - Show Python version</li>
        <li><code>help</code> - Show this help message</li>
      </ul>
    </div>`;
  }

  // ======================== UI HELPERS ========================
  let tempSpan = null;

  function setupCursor(input) {
    input.style.caretColor = 'transparent';
    
    const cursor = input.nextElementSibling?.classList.contains('custom-cursor') 
      ? input.nextElementSibling 
      : createCursorElement(input.parentNode);
    
    if (!tempSpan) {
      tempSpan = document.createElement('span');
      Object.assign(tempSpan.style, {
        position: 'absolute',
        visibility: 'hidden',
        whiteSpace: 'pre',
        top: '-9999px',
        left: '-9999px',
        pointerEvents: 'none'
      });
      document.body.appendChild(tempSpan);
    }
    
    tempSpan.style.font = window.getComputedStyle(input).font;

    input.addEventListener('mousedown', handleMouseDown);
    input.addEventListener('mousemove', handleMouseMove);
    input.addEventListener('mouseup', handleMouseUp);
    
    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('input', handleInput);
    
    input.addEventListener('focus', () => cursor.style.opacity = '1');
    input.addEventListener('blur', () => cursor.style.opacity = '0');
    
    updateCursorPosition(input, cursor);
  }

  function handleMouseDown(e) {
    const input = e.target;
    const cursor = input.nextElementSibling;
    const rect = input.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    input.dataset.selectionStart = calculatePosition(input, x);
    setCursorPosition(input, cursor, x);
    input.dataset.selecting = "true";
  }

  function handleMouseMove(e) {
    const input = e.target;
    const cursor = input.nextElementSibling;
    
    if (input.dataset.selecting === "true") {
      const rect = input.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const endPos = calculatePosition(input, x);
      const startPos = parseInt(input.dataset.selectionStart);
      
      input.setSelectionRange(Math.min(startPos, endPos), Math.max(startPos, endPos));
      setCursorPosition(input, cursor, x);
    }
  }

  function handleMouseUp() {
    const input = event.target;
    const cursor = input.nextElementSibling;
    
    input.dataset.selecting = "false";
    updateCursorPosition(input, cursor);
  }

  function handleKeyDown(e) {
    const input = e.target;
    const cursor = input.nextElementSibling;
    
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      requestAnimationFrame(() => updateCursorPosition(input, cursor));
    }
  }

  function handleInput() {
    const input = event.target;
    const cursor = input.nextElementSibling;
    
    requestAnimationFrame(() => updateCursorPosition(input, cursor));
  }

  function calculatePosition(input, clickX) {
    const text = input.value;
    let position = 0;
    
    for (let i = 0; i <= text.length; i++) {
      tempSpan.textContent = text.substring(0, i);
      const width = tempSpan.offsetWidth;
      
      if (clickX < width + 3) {
        position = i;
        break;
      }
      
      if (i === text.length) {
        position = text.length;
      }
    }
    
    return position;
  }

  function setCursorPosition(input, cursor, clickX) {
    const position = calculatePosition(input, clickX);
    input.setSelectionRange(position, position);
    updateCursorPosition(input, cursor);
  }

  function updateCursorPosition(input, cursor) {
    tempSpan.textContent = input.value.substring(0, input.selectionStart);
    cursor.style.left = `${tempSpan.offsetWidth}px`;
  }
  
  function createCursorElement(parent) {
    const cursor = document.createElement('span');
    cursor.className = 'custom-cursor';
    parent.appendChild(cursor);
    return cursor;
  }

  function handleTabClick() {
    clearAnimationFrames();

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');

    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });

    const tabName = this.getAttribute('data-tab');
    const section = document.getElementById(`${tabName}-content`);
    if (section) {
      section.classList.add('active');
      ContainerTitle.textContent = 'VanDung-dev@manjaro: ~/profile';
      startTypingAll();
    }
  }

  if (isMobileDevice()) {
    window.addEventListener('resize', handleMobileKeyboard);
  }

  function handleMobileKeyboard() {
    if (window.innerHeight < window.outerHeight * 0.7) {
      terminalContainer.style.height = `${window.innerHeight - 40}px`;
    } else {
      terminalContainer.style.height = '90vh';
    }
  }

  // ======================== ANIMATIONS ========================
  const commands = [
    "python --version ",
    "pip install -r requirements.txt ",
    "python main.py ",
    "git status ",
    "git add . ",
    "git commit -m 'Update profile' ",
    "git push ",
    "python chess_game.py ",
    "python discord_bot.py ",
    "python blockchain_demo.py ",
    "ls -la ",
    "cd projects/ ",
    "python --version "
  ];

  let animationFrameIds = [];

  function clearAnimationFrames() {
    animationFrameIds.forEach(id => {cancelAnimationFrame(id);});
    animationFrameIds = [];
    document.querySelectorAll('.command[data-animation-id]').forEach(el => {
      const id = el.dataset.animationId;
      if (id) {
        cancelAnimationFrame(id);
        delete el.dataset.animationId;
      }
    });
  }

  function startTypingAll() {
    clearAnimationFrames();
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;
    
    activeSection.querySelectorAll('.command').forEach(commandEl => {
      const cursorEl = commandEl.querySelector('.cursor');
      if (cursorEl) animateCommand(commandEl);
    });
  }

  function animateCommand(commandElement) {
    let currentCommand = "";
    let charIndex = 0;
    let commandIndex = 0;
    let isDeleting = false;
    let isWaiting = false;
    let waitStart = 0;
    let lastTimestamp = 0;
    let animationFrameId = null;

    commandElement.innerHTML = `<span class="typed"></span><span class="cursor"></span>`;
    const typedSpan = commandElement.querySelector('.typed');

    function type(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;

      if (isWaiting) {
        if (timestamp - waitStart >= 2000) { // Giảm thời gian chờ từ 3s xuống 2s
          isWaiting = false;
          isDeleting = true;
          lastTimestamp = timestamp;
        }
        animationFrameId = requestAnimationFrame(type);
        return;
      }

      const elapsed = timestamp - lastTimestamp;
      const typingSpeed = isDeleting ? 30 : 80 + Math.random() * 50;

      if (elapsed >= typingSpeed) {
        const currentText = commands[commandIndex];
        if (!currentText) return;

        if (!isDeleting && !isWaiting && charIndex < currentText.length) {
          currentCommand += currentText.charAt(charIndex++);
        } else if (isDeleting && charIndex > 0) {
          currentCommand = currentCommand.slice(0, -1);
          charIndex--;
        }

        typedSpan.textContent = currentCommand;

        if (!isDeleting && !isWaiting && charIndex === currentText.length) {
          isWaiting = true;
          waitStart = timestamp;
        }

        if (isDeleting && charIndex === 0) {
          isDeleting = false;
          commandIndex = (commandIndex + 1) % commands.length;
        }

        lastTimestamp = timestamp;
      }

      animationFrameId = requestAnimationFrame(type);
    }

    // Hủy animation cũ nếu có
    if (commandElement.dataset.animationId) {
      cancelAnimationFrame(commandElement.dataset.animationId);
    }

    animationFrameId = requestAnimationFrame(type);
    commandElement.dataset.animationId = animationFrameId;
  }

  // ======================== LANGUAGE MANAGEMENT ========================
  function toggleLanguage() {
    const newLang = state.currentLanguage === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
  }

  function setLanguage(lang) {
    initLazyLoading()
    state.currentLanguage = lang;
    localStorage.setItem('language', lang);

    document.querySelectorAll('.lang-content').forEach(content => {
      content.style.display = content.classList.contains(`lang-${lang}`) ? 'block' : 'none';
    });

    const languageIcon = document.querySelector('.language-toggle .language-icon');
    if (languageIcon) languageIcon.textContent = lang;

    if (state.isClosed || state.isMinimized) return;
    if (content.querySelector('#empty-content')) {
      content.innerHTML = createTerminalInputHTML();
      const input = content.querySelector('.terminal-input');
      if (input) {
        setupCursor(input);
        input.addEventListener('keydown', handleTerminalInput);
        input.focus();
      }
    }

    startTypingAll();
  }

  // ======================== ERROR HANDLING ========================
  function handleAvatarError() {
    const parent = this.parentNode;
    this.style.display = 'none';
    
    if (!parent.querySelector('.avatar-fallback')) {
      const fallback = document.createElement('span');
      fallback.className = 'avatar-fallback';
      Object.assign(fallback.style, {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '80px'
      });
      fallback.textContent = 'dev';
      parent.appendChild(fallback);
    }
  }

  // ======================== LAZY LOADING ========================
  function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy-load');

    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.onload = () => {
                img.classList.add('loaded');
              };
              img.classList.remove('lazy-load');
              lazyImageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '100px 0px', // Load ảnh trước khi chúng xuất hiện 100px
        threshold: 0.01
      });

      lazyImages.forEach(img => {
        lazyImageObserver.observe(img);
      });
    } else {
      // Fallback cho trình duyệt không hỗ trợ IntersectionObserver
      lazyImages.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.remove('lazy-load');
        }
      });
    }
  }

  // ======================== THEME MANAGEMENT ========================
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'default';
    setTheme(savedTheme);

    createThemePopup();
  }

  function setTheme(themeName) {
    const themeClasses = ['theme-default', 'theme-blue', 'theme-red', 'theme-yellow', 'theme-green'];
    document.body.classList.remove(...themeClasses);

    document.body.classList.add(`theme-${themeName}`);

    localStorage.setItem('theme', themeName);

    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.toggle('active', option.classList.contains(`theme-${themeName}`));
    });
  }

  function toggleThemePopup(e) {
    e.stopPropagation();
    const popup = document.getElementById('theme-popup');
    popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex';
  }

  function createThemePopup() {
    let themePopup = document.getElementById('theme-popup');
    
    if (!themePopup) {
      themePopup = document.createElement('div');
      themePopup.className = 'theme-selector-popup';
      themePopup.id = 'theme-popup';
      document.body.appendChild(themePopup);
    }

    themePopup.innerHTML = '';

    const themes = ['default', 'blue', 'red', 'yellow', 'green'];

    themes.forEach(theme => {
      const option = document.createElement('div');
      option.className = `theme-option theme-${theme}`;
      option.title = theme.charAt(0).toUpperCase() + theme.slice(1);
      option.addEventListener('click', () => {
        setTheme(theme);
        themePopup.style.display = 'none';
      });
      themePopup.appendChild(option);
    });

    themePopup.style.display = 'none';

    const currentTheme = localStorage.getItem('theme') || 'default';
    document.querySelectorAll('.theme-option').forEach(option => {
      if (option.classList.contains(`theme-${currentTheme}`)) {
        option.classList.add('active');
      }
    });
  }

  // ======================== DRAG FUNCTIONALITY ========================
  let isDragging = false;
  let dragStartX, dragStartY;
  let initialContainerLeft, initialContainerTop;

  // Hàm kiểm tra thiết bị có phải là mobile/tablet không
  function isMobileDevice() {
    return (typeof window.orientation !== "undefined") ||
        (navigator.userAgent.indexOf('IEMobile') !== -1) ||
        (window.innerWidth <= 1024);
  }

  function startDrag(e) {
    // Không kéo thả trên thiết bị di động
    if (isMobileDevice()) return;

    if (state.isMaximized) return;

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    const rect = terminalContainer.getBoundingClientRect();
    initialContainerLeft = rect.left;
    initialContainerTop = rect.top;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);

    terminalContainer.style.cursor = 'grabbing';
    terminalContainer.style.userSelect = 'none';
  }

  function onDrag(e) {
    if (!isDragging) return;

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    const newLeft = initialContainerLeft + dx;
    const newTop = initialContainerTop + dy;

    terminalContainer.style.left = `${newLeft}px`;
    terminalContainer.style.top = `${newTop}px`;
    terminalContainer.style.position = 'fixed';
    terminalContainer.style.margin = '0';
    if (!terminalContainer.classList.contains('dragging')) {
      terminalContainer.classList.add('dragging');
    }
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);

    terminalContainer.style.cursor = '';
    terminalContainer.style.userSelect = '';
    terminalContainer.classList.remove('dragging');
  }

  // ======================== START APPLICATION ========================
  initialize();
  initLazyLoading();

  function animateClock() {
    updateClock();
    const id = requestAnimationFrame(animateClock);
    animationFrameIds.push(id);
  }
  animateClock();
});
