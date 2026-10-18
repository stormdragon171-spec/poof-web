/* Poof service worker: makes the app installable and shows notifications.
   It does not cache pages, so you always get the newest version. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(){ /* network only */ });

self.addEventListener('push', function(e){
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch(err) { d = { title: 'Poof', body: 'You have a new notification' }; }
  var isCall = d.kind === 'call';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      var visible = list.some(function(c){ return c.visibilityState === 'visible'; });
      if (visible) return; // Poof is open on screen, it already shows everything
      var opts = {
        body: d.body || '',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: d.tag || (isCall ? 'poof-call' : 'poof-msg'),
        renotify: true,
        requireInteraction: isCall,
        vibrate: isCall ? [800, 300, 800, 300, 800, 300, 800, 300, 800] : [200, 100, 200],
        data: { kind: d.kind || 'message' }
      };
      if (isCall) opts.actions = [{ action: 'answer', title: 'Answer' }, { action: 'decline', title: 'Decline' }];
      return self.registration.showNotification(isCall ? (d.title || 'Someone') + ' is calling' : (d.title || 'Poof'), opts);
    })
  );
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  if (e.action === 'decline') return;
  var answer = e.action === 'answer' || (e.notification.data && e.notification.data.kind === 'call');
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for (var i = 0; i < list.length; i++) {
        if ('focus' in list[i]) {
          if (answer) list[i].postMessage({ type: 'answer-call' });
          return list[i].focus();
        }
      }
      return self.clients.openWindow(answer ? './?answer=1' : './');
    })
  );
});
