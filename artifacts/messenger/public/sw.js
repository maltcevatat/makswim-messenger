self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: "MAKSWIM", body: event.data.text() }; }

  const scope = self.registration.scope;
  const icon = data.icon || scope + "icon-192.jpeg";

  event.waitUntil(
    self.registration.showNotification(data.title || "MAKSWIM", {
      body:  data.body  || "Новое сообщение",
      icon,
      badge: icon,
      data:  data.data  || {},
      vibrate: [100, 50, 100],
      tag: "makswim-msg",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const scope = self.registration.scope;
  const chatId = event.notification.data?.chatId;
  const url = chatId ? scope + "chat/" + chatId : scope;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(scope) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
