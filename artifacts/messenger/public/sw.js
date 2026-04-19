self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: "MAKSWIM", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || "MAKSWIM", {
      body:  data.body  || "Новое сообщение",
      icon:  data.icon  || "/favicon.svg",
      badge: "/favicon.svg",
      data:  data.data  || {},
      vibrate: [100, 50, 100],
      tag: "makswim-msg",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const chatId = event.notification.data?.chatId;
  const url = chatId ? `/chat/${chatId}` : "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
