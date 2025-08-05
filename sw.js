const CACHE_NAME = 'profile-web-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/style.css',
  '/content.json', // Thêm file content.json vào danh sách cache để hỗ trợ tải nội dung offline
  '/images/avatar.webp',
  '/images/terminal-icon.webp'
];

// Trang dự phòng khi offline
const FALLBACK_PAGE_VI = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="utf-8">
    <title>Offline</title>
    <style>
      body {
        font-family: monospace;
        text-align: center;
        padding: 50px;
        background: #1e1e1e;
        color: #f0f0f0;
      }
      .offline-message {
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #34be5b;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <div class="offline-message">
      <h1>Bạn đang offline</h1>
      <p>Hồ sơ này cần kết nối internet để tải đúng cách.</p>
      <p>Vui lòng kiểm tra kết nối và thử lại.</p>
    </div>
  </body>
  </html>
`;

const FALLBACK_PAGE_EN = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Offline</title>
    <style>
      body {
        font-family: monospace;
        text-align: center;
        padding: 50px;
        background: #1e1e1e;
        color: #f0f0f0;
      }
      .offline-message {
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #34be5b;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <div class="offline-message">
      <h1>You are offline</h1>
      <p>This profile requires an internet connection to load properly.</p>
      <p>Please check your connection and try again.</p>
    </div>
  </body>
  </html>
`;

// Cài đặt service worker và cache các tài nguyên tĩnh
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Đã mở cache');
        // Thêm trang dự phòng vào cache
        return cache.addAll(urlsToCache)
          .then(() => {
            // Cache cả hai phiên bản ngôn ngữ của trang offline
            cache.put('/offline-vi.html', new Response(FALLBACK_PAGE_VI, {
              headers: { 'Content-Type': 'text/html' }
            }));
            cache.put('/offline-en.html', new Response(FALLBACK_PAGE_EN, {
              headers: { 'Content-Type': 'text/html' }
            }));
          });
      })
  );
});

// Intercept các request và trả về từ cache nếu có
self.addEventListener('fetch', (event) => {
  // Bỏ qua các yêu cầu tới API bên ngoài hoặc các origin khác
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Trả về response từ cache nếu có
        if (response) {
          return response;
        }
        
        // Nếu không có trong cache, fetch từ network
        return fetch(event.request).then(
          (response) => {
            // Kiểm tra nếu response hợp lệ
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response vì nó chỉ có thể được sử dụng một lần
            var responseToCache = response.clone();

            // Lưu response vào cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Trả về trang dự phòng cho các yêu cầu điều hướng
          if (event.request.mode === 'navigate') {
            // Xác định ngôn ngữ từ cookies nếu có
            const lang = getLanguageFromCookies(event.request);
            const offlinePage = lang === 'en' ? '/offline-en.html' : '/offline-vi.html';
            return caches.match(offlinePage);
          }
          // Trả về phản hồi từ cache cho các yêu cầu khác
          return caches.match(event.request);
        });
      })
    );
});

// Hàm để xác định ngôn ngữ từ cookies
function getLanguageFromCookies(request) {
  // Lấy cookies từ request
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
    const languageCookie = cookies.find(cookie => cookie.startsWith('language='));
    if (languageCookie) {
      const lang = languageCookie.split('=')[1];
      return lang === 'en' ? 'en' : 'vi'; // Trả về 'en' hoặc mặc định 'vi'
    }
  }
  // Mặc định trả về tiếng Việt
  return 'vi';
}

// Cập nhật cache khi có version mới
self.addEventListener('activate', (event) => {
  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});