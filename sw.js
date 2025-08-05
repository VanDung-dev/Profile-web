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

// Cài đặt service worker và cache các tài nguyên tĩnh
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Đã mở cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercept các request và trả về từ cache nếu có
self.addEventListener('fetch', (event) => {
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
        );
      })
    );
});

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