self.addEventListener("install", e => {

e.waitUntil(
caches.open("fpv-app").then(cache => {
return cache.addAll([
"/",
"/index.html"
])
})
)

})