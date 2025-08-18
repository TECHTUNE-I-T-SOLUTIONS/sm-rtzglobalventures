// Basic service worker for web push notifications
self.addEventListener('push', function(event) {
  let data = {}
  if (event.data) {
    try { data = event.data.json() } catch (e) { data = { title: 'Notification', body: event.data.text() } }
  }
  const title = data.title || 'Sm@rtz Notification'
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    data: data.url || '/',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const url = event.notification?.data || '/'
  event.waitUntil(clients.matchAll({ type: 'window' }).then( windowClients => {
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === url && 'focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }))
})
